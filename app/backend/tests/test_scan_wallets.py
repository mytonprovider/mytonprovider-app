from app.http.toncenter.models import Message, Transaction
from app.workers.scan_wallets import _take_chain


def tx(lt: int, prev_lt: int) -> Transaction:
    return Transaction(
        account="wallet",
        hash=f"h{lt}",
        lt=lt,
        now=0,
        orig_status="active",
        end_status="active",
        total_fees=0,
        prev_trans_hash=f"h{prev_lt}",
        prev_trans_lt=prev_lt,
        description=None,
        in_msg=Message(hash="in"),
        out_msgs=[],
    )


def lts(taken: list[Transaction]) -> list[int]:
    return [transaction.lt for transaction in taken]


def test_a_page_is_taken_above_its_anchor() -> None:
    page = [tx(10, 0), tx(20, 10), tx(30, 20)]

    taken, following = _take_chain(page, (10, "h10"))
    assert lts(taken) == [20, 30]
    assert following == (30, "h30")


def test_a_missing_link_takes_nothing() -> None:
    # the index has not shown lt 20 yet: the cursor stays where it was
    page = [tx(10, 0), tx(30, 20)]

    taken, following = _take_chain(page, (10, "h10"))
    assert taken == []
    assert following is None


def test_a_gap_keeps_what_came_before_it() -> None:
    page = [tx(10, 0), tx(20, 10), tx(40, 30)]

    taken, following = _take_chain(page, (10, "h10"))
    assert lts(taken) == [20]
    assert following is None


def test_a_wallet_without_a_cursor_starts_at_its_oldest() -> None:
    page = [tx(10, 0), tx(20, 10)]

    taken, following = _take_chain(page, None)
    assert lts(taken) == [10, 20]
    assert following == (20, "h20")


def test_an_empty_page_keeps_the_anchor() -> None:
    taken, following = _take_chain([], (10, "h10"))
    assert taken == []
    assert following == (10, "h10")
