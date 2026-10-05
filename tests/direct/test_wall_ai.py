"""Direct mode tests for the WallAI contract (LLM responses are mocked)."""

import json

from tests.direct.conftest import to_hex

CONTRACT = "contracts/wall_ai.py"
MODERATION = r".*content moderator of WallAI.*"
APPEAL = r".*senior appeal reviewer of WallAI.*"


def _moderate(vm, approved, reason="OK"):
    vm.clear_mocks()
    vm.mock_llm(MODERATION, json.dumps({"approved": approved, "reason": reason}))


def _appeal(vm, overturned, reason="Appeal reviewed"):
    vm.clear_mocks()
    vm.mock_llm(APPEAL, json.dumps({"overturned": overturned, "reason": reason}))


def _post(vm, contract, sender, text, approved=True, reason="OK"):
    vm.sender = sender
    _moderate(vm, approved, reason)
    return contract.post_message(text)


# ---------------------------------------------------------------- posts


def test_initial_state(direct_deploy):
    contract = direct_deploy(CONTRACT)
    assert contract.get_message_count() == 0
    assert contract.get_messages(0, 10) == []
    assert contract.get_rejected(0, 10) == []
    stats = contract.get_stats()
    assert stats["approved"] == 0 and stats["rejected"] == 0 and stats["total"] == 0
    assert stats["likes"] == 0 and stats["replies"] == 0 and stats["appeals"] == 0
    assert contract.get_leaderboard(10) == []


def test_approved_message_is_stored(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    result = _post(direct_vm, contract, direct_alice, "  Hello GenLayer!  ", True, "Friendly greeting")
    assert result["approved"] is True
    assert result["id"] == 0

    msg = contract.get_messages(0, 10)[0]
    assert msg["author"] == to_hex(direct_alice)
    assert msg["text"] == "Hello GenLayer!"
    assert msg["reason"] == "Friendly greeting"
    assert msg["via_appeal"] is False and msg["rejected_id"] == -1
    assert msg["likes"] == 0 and msg["replies"] == 0 and msg["handle"] == ""
    assert isinstance(msg["timestamp"], int)
    assert contract.get_message(0)["text"] == "Hello GenLayer!"

    author = contract.get_author_stats(to_hex(direct_alice))
    assert author["approved"] == 1 and author["rejected"] == 0


def test_rejected_post_is_listed_without_text(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT)
    result = _post(direct_vm, contract, direct_bob, "BUY CHEAP TOKENS NOW!!!", False, "Spam")
    assert result == {"approved": False, "reason": "Spam", "id": 0}

    assert contract.get_message_count() == 0
    rejected = contract.get_rejected(0, 10)
    assert len(rejected) == 1
    item = rejected[0]
    assert item["author"] == to_hex(direct_bob)
    assert item["reason"] == "Spam"
    assert item["appeal_status"] == "none"
    assert item["text"] == ""  # text is never exposed for rejected posts
    assert item["message_id"] == -1
    assert "BUY CHEAP" not in json.dumps(rejected)

    stats = contract.get_stats()
    assert stats["rejected"] == 1 and stats["total"] == 1
    bob = contract.get_author_stats(to_hex(direct_bob))
    assert bob["rejected"] == 1 and bob["last_rejection_reason"] == "Spam"


def test_string_booleans_and_missing_reason_are_normalized(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.clear_mocks()
    direct_vm.mock_llm(MODERATION, json.dumps({"approved": "true"}))
    result = contract.post_message("Just a normal message")
    assert result["approved"] is True
    assert result["reason"] == "No reason given by the AI reviewer"


def test_pagination_newest_first(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    for i in range(5):
        _post(direct_vm, contract, direct_alice, f"message number {i}")
    assert [m["text"] for m in contract.get_messages(0, 2)] == ["message number 4", "message number 3"]
    assert [m["text"] for m in contract.get_messages(4, 2)] == ["message number 0"]
    assert contract.get_messages(10, 2) == []
    assert [m["id"] for m in contract.get_all_messages()] == [0, 1, 2, 3, 4]


def test_rejected_pagination_newest_first(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT)
    for i in range(3):
        _post(direct_vm, contract, direct_bob, f"spam {i}", False, f"reason {i}")
    assert [r["reason"] for r in contract.get_rejected(0, 2)] == ["reason 2", "reason 1"]
    assert [r["id"] for r in contract.get_rejected(2, 5)] == [0]
    assert contract.get_rejected_count() == 3


def test_input_validation(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Message cannot be empty"):
        contract.post_message("   ")
    with direct_vm.expect_revert("too long"):
        contract.post_message("a" * 281)
    _moderate(direct_vm, True)
    contract.post_message("b" * 280)
    assert contract.get_message_count() == 1


def test_malformed_llm_output_reverts(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.clear_mocks()
    direct_vm.mock_llm(MODERATION, json.dumps({"verdict": "maybe"}))
    with direct_vm.expect_revert("approved"):
        contract.post_message("hello")
    assert contract.get_message_count() == 0


# ---------------------------------------------------------------- likes


def test_like_toggle_and_counts(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_alice, "Like me")

    direct_vm.sender = direct_bob
    assert contract.like(0) == {"liked": True, "likes": 1}
    direct_vm.sender = direct_charlie
    assert contract.like(0) == {"liked": True, "likes": 2}
    assert contract.get_messages(0, 1)[0]["likes"] == 2
    assert contract.has_liked(0, to_hex(direct_bob)) is True
    assert contract.get_liked(to_hex(direct_charlie), [0, 5]) == [True, False]

    direct_vm.sender = direct_bob
    assert contract.like(0) == {"liked": False, "likes": 1}  # toggle off
    assert contract.has_liked(0, to_hex(direct_bob)) is False
    assert contract.get_author_stats(to_hex(direct_alice))["likes_received"] == 1
    assert contract.get_stats()["likes"] == 1


def test_cannot_like_own_or_missing_message(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_alice, "Mine")
    with direct_vm.expect_revert("own message"):
        contract.like(0)
    with direct_vm.expect_revert("Message not found"):
        contract.like(7)


# ---------------------------------------------------------------- replies


def test_replies_are_moderated(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_alice, "Original post")

    direct_vm.sender = direct_bob
    _moderate(direct_vm, True, "Polite reply")
    result = contract.reply(0, "Nice post!")
    assert result == {"approved": True, "reason": "Polite reply", "id": 0}

    _moderate(direct_vm, False, "Insult")
    rejected = contract.reply(0, "you are an idiot")
    assert rejected["approved"] is False and rejected["id"] == -1

    replies = contract.get_replies(0, 0, 10)
    assert len(replies) == 1
    assert replies[0]["text"] == "Nice post!" and replies[0]["author"] == to_hex(direct_bob)
    assert contract.get_messages(0, 1)[0]["replies"] == 1
    assert contract.get_replies(3, 0, 10) == []

    stats = contract.get_stats()
    assert stats["replies"] == 1 and stats["rejected_replies"] == 1
    bob = contract.get_author_stats(to_hex(direct_bob))
    assert bob["replies"] == 1 and bob["rejected"] == 1 and bob["last_rejection_reason"] == "Insult"


def test_reply_validation(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Message not found"):
        contract.reply(0, "hello")
    _post(direct_vm, contract, direct_alice, "Post")
    with direct_vm.expect_revert("too long"):
        contract.reply(0, "x" * 201)


# ---------------------------------------------------------------- handles


def test_handles_are_unique_and_shown(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    assert contract.set_handle("@Alice_01") == {"handle": "alice_01"}
    assert contract.get_handle(to_hex(direct_alice)) == "alice_01"
    assert contract.resolve_handle("alice_01") == to_hex(direct_alice)

    _post(direct_vm, contract, direct_alice, "hi")
    assert contract.get_messages(0, 1)[0]["handle"] == "alice_01"

    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("already taken"):
        contract.set_handle("alice_01")

    direct_vm.sender = direct_alice
    contract.set_handle("alice_new")  # rename frees the old handle
    assert contract.resolve_handle("alice_01") == ""
    direct_vm.sender = direct_bob
    assert contract.set_handle("alice_01") == {"handle": "alice_01"}


def test_handle_validation(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("3-20 characters"):
        contract.set_handle("ab")
    with direct_vm.expect_revert("3-20 characters"):
        contract.set_handle("a" * 21)
    with direct_vm.expect_revert("a-z, 0-9"):
        contract.set_handle("bad-name!")


# ---------------------------------------------------------------- appeals


def test_appeal_overturned_publishes_post(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_alice, "We destroyed them in the finals!", False, "Violent language")

    _appeal(direct_vm, True, "Sports slang, not a threat")
    result = contract.appeal(0)
    assert result == {"overturned": True, "reason": "Sports slang, not a threat", "message_id": 0}

    msg = contract.get_messages(0, 1)[0]
    assert msg["text"] == "We destroyed them in the finals!"
    assert msg["via_appeal"] is True and msg["rejected_id"] == 0

    item = contract.get_rejected(0, 1)[0]
    assert item["appeal_status"] == "overturned"
    assert item["appeal_reason"] == "Sports slang, not a threat"
    assert item["message_id"] == 0
    assert item["text"] == "We destroyed them in the finals!"  # shown once overturned

    stats = contract.get_stats()
    assert stats["approved"] == 1 and stats["rejected"] == 0 and stats["overturned"] == 1
    author = contract.get_author_stats(to_hex(direct_alice))
    assert author["approved"] == 1 and author["rejected"] == 0


def test_appeal_denied_keeps_text_hidden(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_bob, "send me your seed phrase", False, "Phishing")
    _appeal(direct_vm, False, "Clear phishing attempt")
    result = contract.appeal(0)
    assert result == {"overturned": False, "reason": "Clear phishing attempt", "message_id": -1}

    item = contract.get_rejected(0, 1)[0]
    assert item["appeal_status"] == "denied" and item["text"] == ""
    assert contract.get_message_count() == 0
    assert contract.get_stats()["appeals"] == 1 and contract.get_stats()["rejected"] == 1


def test_appeal_rules(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_bob, "spammy", False, "Spam")

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Only the author"):
        contract.appeal(0)
    with direct_vm.expect_revert("not found"):
        contract.appeal(9)

    direct_vm.sender = direct_bob
    _appeal(direct_vm, False)
    contract.appeal(0)
    with direct_vm.expect_revert("already appealed"):
        contract.appeal(0)


# ---------------------------------------------------------------- leaderboard


def test_leaderboard_orders_by_approved_then_likes(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT)
    _post(direct_vm, contract, direct_alice, "a1")
    _post(direct_vm, contract, direct_bob, "b1")
    _post(direct_vm, contract, direct_bob, "b2")
    _post(direct_vm, contract, direct_charlie, "c1")
    _post(direct_vm, contract, direct_charlie, "rejected", False, "Spam")

    direct_vm.sender = direct_bob
    contract.set_handle("bobby")
    contract.like(3)  # charlie's c1
    direct_vm.sender = direct_alice
    contract.like(3)

    board = contract.get_leaderboard(10)
    assert [row["address"] for row in board] == [
        to_hex(direct_bob),
        to_hex(direct_charlie),
        to_hex(direct_alice),
    ]
    assert board[0]["handle"] == "bobby" and board[0]["approved"] == 2
    assert board[1]["likes_received"] == 2 and board[1]["rejected"] == 1
    assert len(contract.get_leaderboard(1)) == 1
