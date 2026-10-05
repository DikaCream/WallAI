"""Direct mode tests for the WallAI contract (LLM responses are mocked)."""

import json

from tests.direct.conftest import to_hex

CONTRACT = "contracts/wall_ai.py"
PROMPT_PATTERN = r".*content moderator of WallAI.*"


def _mock_decision(vm, approved, reason):
    vm.clear_mocks()
    vm.mock_llm(PROMPT_PATTERN, json.dumps({"approved": approved, "reason": reason}))


def test_initial_state(direct_deploy):
    contract = direct_deploy(CONTRACT)
    assert contract.get_message_count() == 0
    assert contract.get_messages(0, 10) == []
    assert contract.get_all_messages() == []
    stats = contract.get_stats()
    assert stats["approved"] == 0
    assert stats["rejected"] == 0
    assert stats["total"] == 0


def test_approved_message_is_stored(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _mock_decision(direct_vm, True, "Friendly greeting")

    result = contract.post_message("  Hello GenLayer, happy to be here!  ")
    assert result["approved"] is True
    assert result["reason"] == "Friendly greeting"

    assert contract.get_message_count() == 1
    messages = contract.get_messages(0, 10)
    assert len(messages) == 1
    msg = messages[0]
    assert msg["id"] == 0
    assert msg["author"] == to_hex(direct_alice)
    assert msg["text"] == "Hello GenLayer, happy to be here!"
    assert msg["reason"] == "Friendly greeting"
    assert isinstance(msg["timestamp"], int)

    stats = contract.get_stats()
    assert stats["approved"] == 1
    assert stats["rejected"] == 0

    author = contract.get_author_stats(to_hex(direct_alice))
    assert author["approved"] == 1
    assert author["rejected"] == 0
    assert author["last_rejection_reason"] == ""


def test_rejected_message_is_counted_not_stored(direct_vm, direct_deploy, direct_bob):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_bob
    _mock_decision(direct_vm, False, "Spam advertising a scam")

    result = contract.post_message("BUY CHEAP TOKENS NOW!!! 1000x guaranteed, DM me")
    assert result["approved"] is False
    assert result["reason"] == "Spam advertising a scam"

    assert contract.get_message_count() == 0
    stats = contract.get_stats()
    assert stats["approved"] == 0
    assert stats["rejected"] == 1
    assert stats["total"] == 1

    author = contract.get_author_stats(to_hex(direct_bob))
    assert author["rejected"] == 1
    assert author["last_rejection_reason"] == "Spam advertising a scam"


def test_string_booleans_and_missing_reason_are_normalized(
    direct_vm, direct_deploy, direct_alice
):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.clear_mocks()
    direct_vm.mock_llm(PROMPT_PATTERN, json.dumps({"approved": "true"}))

    result = contract.post_message("Just a normal message")
    assert result["approved"] is True
    assert result["reason"] == "Approved by AI moderator"
    assert contract.get_message_count() == 1


def test_pagination_newest_first(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _mock_decision(direct_vm, True, "OK")

    for i in range(5):
        contract.post_message(f"message number {i}")

    page1 = contract.get_messages(0, 2)
    assert [m["text"] for m in page1] == ["message number 4", "message number 3"]
    page2 = contract.get_messages(2, 2)
    assert [m["text"] for m in page2] == ["message number 2", "message number 1"]
    page3 = contract.get_messages(4, 2)
    assert [m["text"] for m in page3] == ["message number 0"]
    assert contract.get_messages(10, 2) == []

    all_messages = contract.get_all_messages()
    assert [m["id"] for m in all_messages] == [0, 1, 2, 3, 4]


def test_mixed_authors_and_last_rejection_reason(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT)

    direct_vm.sender = direct_alice
    _mock_decision(direct_vm, True, "Fine")
    contract.post_message("Good morning everyone")

    direct_vm.sender = direct_bob
    _mock_decision(direct_vm, False, "Insulting language")
    contract.post_message("you are all idiots")
    _mock_decision(direct_vm, False, "Harassment")
    contract.post_message("I will find you")

    stats = contract.get_stats()
    assert stats == {"approved": 1, "rejected": 2, "total": 3}
    bob = contract.get_author_stats(to_hex(direct_bob))
    assert bob["rejected"] == 2
    assert bob["approved"] == 0
    assert bob["last_rejection_reason"] == "Harassment"


def test_empty_message_reverts(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Message cannot be empty"):
        contract.post_message("   ")


def test_too_long_message_reverts(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("too long"):
        contract.post_message("a" * 281)


def test_max_length_message_is_accepted(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    _mock_decision(direct_vm, True, "OK")
    contract.post_message("b" * 280)
    assert contract.get_message_count() == 1


def test_malformed_llm_output_reverts(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    direct_vm.clear_mocks()
    direct_vm.mock_llm(PROMPT_PATTERN, json.dumps({"verdict": "maybe"}))
    with direct_vm.expect_revert("approved"):
        contract.post_message("hello")
    assert contract.get_message_count() == 0
