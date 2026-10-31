import logging
from datetime import datetime, timezone
from typing import Any

from aiohttp import ClientResponseError

from app.db import session_factory
from app.db.repos import BagRepo, BagSlotRepo
from app.db.repos.bag_slot import Reason, SlotKey
from app.http.mytonprovider import mytonprovider
from app.http.mytonprovider.models import Contract
from app.workers._base import BaseWorker

logger = logging.getLogger(__name__)


class SyncBagsWorker(BaseWorker):
    interval = 10 * 60
    delay = 30

    async def run(self) -> None:
        contracts, complete = await _collect_contracts()
        if not contracts:
            return
        bags = [{"address": contract.address, "bag_id": contract.bag_id.lower()} for contract in contracts]
        reasons = {
            SlotKey(contract.address, contract.provider_pubkey.lower()): Reason(
                contract.reason, _reason_at(contract.reason_timestamp)
            )
            for contract in contracts
        }
        async with session_factory() as session:
            bag_repo = BagRepo(session)
            slot_repo = BagSlotRepo(session)
            known_addresses = set(await bag_repo.addresses())
            known = await slot_repo.reasons()
            fresh = [row for row in bags if row["address"] not in known_addresses]
            moved = _moved(reasons, known, complete)
            if fresh:
                await bag_repo.insert(fresh)
            if moved:
                await slot_repo.update_reasons(moved)
            await session.commit()
        logger.debug(
            "synced %d contracts, %d new addresses, %d reasons written of %d slots",
            len(contracts),
            len(fresh),
            len(moved),
            len(known),
        )


async def _collect_contracts() -> tuple[list[Contract], bool]:
    contracts: list[Contract] = []
    limit, offset = 250, 0
    while True:
        try:
            response = await mytonprovider.contracts(limit, offset)
        except ClientResponseError as error:
            if error.status == 404:
                return [], False
            raise
        if not response.contracts:
            break
        contracts.extend(response.contracts)
        if len(contracts) >= response.total:
            break
        offset += limit
    complete = len(contracts) >= response.total
    if not complete:
        logger.warning("upstream returned %d contracts of %d", len(contracts), response.total)
    return contracts, complete


# The catalogue repeats every reason on every pass: writing them all rewrote the whole table a tick.
def _moved(reasons: dict[SlotKey, Reason], known: dict[SlotKey, Reason], complete: bool) -> list[dict[str, Any]]:
    rows = [_row(key, reason) for key, reason in reasons.items() if key in known and known[key] != reason]
    # Only against the whole catalogue: a short answer would wipe every slot it left out.
    if complete:
        rows += [
            _row(key, Reason(None, None))
            for key, reason in known.items()
            if reason.code is not None and key not in reasons
        ]
    return rows


def _row(key: SlotKey, reason: Reason) -> dict[str, Any]:
    return {
        "address": key.address,
        "provider_pubkey": key.provider_pubkey,
        "reason": reason.code,
        "reason_at": reason.at,
    }


def _reason_at(timestamp: int | None) -> datetime | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)
