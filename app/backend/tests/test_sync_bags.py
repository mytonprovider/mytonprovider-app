from datetime import datetime, timezone

from app.db.repos.bag_slot import Reason, SlotKey
from app.workers.sync_bags import _moved

CHECKED = datetime(2026, 10, 16, 19, 20, 34, tzinfo=timezone.utc)
AGAIN = datetime(2026, 10, 16, 19, 50, 12, tzinfo=timezone.utc)

A = SlotKey("EQA", "p1")
B = SlotKey("EQB", "p2")


def test_a_reason_that_did_not_move_is_not_written() -> None:
    # The prod case: upstream repeated the same verdict for 13 725 slots on every pass.
    known = {A: Reason(0, CHECKED), B: Reason(401, CHECKED)}

    assert _moved(dict(known), known, True) == []


def test_a_new_verdict_is_written() -> None:
    known = {A: Reason(0, CHECKED)}

    rows = _moved({A: Reason(401, AGAIN)}, known, True)

    assert rows == [{"address": "EQA", "provider_pubkey": "p1", "reason": 401, "reason_at": AGAIN}]


def test_the_same_code_checked_again_is_written() -> None:
    # The code carries no date, so a re-check only shows up in reason_at.
    known = {A: Reason(0, CHECKED)}

    rows = _moved({A: Reason(0, AGAIN)}, known, True)

    assert [row["reason_at"] for row in rows] == [AGAIN]


def test_a_slot_we_do_not_mirror_is_skipped() -> None:
    # The catalogue reports contracts we never hired for; they have no row to update.
    reported = {A: Reason(0, CHECKED), B: Reason(0, CHECKED)}

    assert _moved(reported, {A: Reason(0, CHECKED)}, True) == []


def test_a_dropped_reason_is_cleared_against_the_whole_catalogue() -> None:
    known = {A: Reason(0, CHECKED), B: Reason(401, CHECKED)}

    rows = _moved({A: Reason(0, CHECKED)}, known, True)

    assert rows == [{"address": "EQB", "provider_pubkey": "p2", "reason": None, "reason_at": None}]


def test_a_short_answer_clears_nothing() -> None:
    known = {A: Reason(0, CHECKED), B: Reason(401, CHECKED)}

    assert _moved({A: Reason(0, CHECKED)}, known, False) == []


def test_a_slot_that_never_had_a_reason_is_left_alone() -> None:
    known = {A: Reason(None, None)}

    assert _moved({}, known, True) == []
