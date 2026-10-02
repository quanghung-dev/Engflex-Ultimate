from transcript.capture import TurnCollector


def test_consecutive_user_fragments_merge_into_one_record():
    c = TurnCollector()
    c.add_user_text("hello")
    c.add_user_text("there")
    records = c.records()
    assert len(records) == 1
    assert records[0].text == "hello there"
    assert records[0].position == 1


def test_bot_text_starts_a_new_record_and_resets_merge():
    c = TurnCollector()
    c.add_user_text("hi")
    c.add_bot_text("hello!", was_interrupted=False)
    c.add_user_text("again")
    records = c.records()
    assert [r.role for r in records] == ["user", "ai", "user"]
    assert [r.position for r in records] == [1, 2, 3]


def test_empty_user_text_is_dropped():
    c = TurnCollector()
    c.add_user_text("")
    c.add_user_text("   ")
    c.add_user_text("real")
    assert [r.text for r in c.records()] == ["real"]


def test_empty_bot_text_is_dropped():
    c = TurnCollector()
    c.add_bot_text("  ")
    assert c.records() == []


def test_interruption_is_ored_across_merged_fragments():
    c = TurnCollector()
    c.add_user_text("a", was_interrupted=False)
    c.add_user_text("b", was_interrupted=True)
    assert c.records()[0].was_interrupted is True


def test_records_expose_only_the_four_fields():
    # The record carries no audio and no word metadata: it must not grow
    # fields that later code would assume are populated.
    c = TurnCollector()
    c.add_user_text("hi")
    assert set(vars(c.records()[0])) == {
        "position",
        "role",
        "text",
        "was_interrupted",
    }


def test_clear_resets_positions():
    c = TurnCollector()
    c.add_user_text("hi")
    c.clear()
    c.add_user_text("again")
    assert c.records()[0].position == 1


def test_add_returns_none_for_empty_text():
    c = TurnCollector()
    assert c.add_user_text("   ") is None
    assert c.add_bot_text("") is None
    assert c.records() == []


def test_add_returns_the_touched_record():
    c = TurnCollector()
    first = c.add_user_text("hello")
    assert first is not None and first.position == 1
    merged = c.add_user_text("there")
    assert merged is not None and merged is first
    assert merged.text == "hello there"
    bot = c.add_bot_text("hi")
    assert bot is not None and bot.position == 2 and bot.role == "ai"


def test_begin_correction_with_no_user_turn_returns_none():
    c = TurnCollector()
    assert c.begin_correction("i went yesterday") is None


def test_begin_correction_ignores_empty_text():
    c = TurnCollector()
    c.add_user_text("i go yesterday")
    assert c.begin_correction("   ") is None
    assert [r.text for r in c.records()] == ["i go yesterday"]


def test_begin_correction_rewrites_the_user_turn_in_place():
    c = TurnCollector()
    c.add_user_text("i go yesterday")
    assert c.begin_correction("i went yesterday") == 1
    assert [r.text for r in c.records()] == ["i went yesterday"]


def test_begin_correction_drops_the_stale_reply_and_reserves_its_slot():
    c = TurnCollector()
    c.add_user_text("i go yesterday")
    c.add_bot_text("so you went")
    assert c.begin_correction("i went yesterday") == 1
    # The stale reply is gone; the slot it held is reserved for the new one.
    assert [r.position for r in c.records()] == [1]
    c.add_bot_text("understood")
    records = c.records()
    assert [r.position for r in records] == [1, 2]
    assert [r.text for r in records] == ["i went yesterday", "understood"]


def test_begin_correction_reclaims_a_reply_recorded_afterwards():
    # An InterruptionFrame records the dying reply with was_interrupted=True
    # after the correction. The regenerated reply must still land on the
    # reserved position, or every later position drifts and Go's
    # (conversation_id, position) key desyncs.
    c = TurnCollector()
    c.add_user_text("i go yesterday")
    c.add_bot_text("so you went")
    assert c.begin_correction("i went yesterday") == 1
    c.add_bot_text("wait, say that again", was_interrupted=True)
    c.add_bot_text("understood")
    records = c.records()
    assert [r.position for r in records] == [1, 2]
    assert records[1].text == "understood"


def test_begin_correction_targets_the_last_user_turn_only():
    c = TurnCollector()
    c.add_user_text("first")
    c.add_bot_text("a")
    c.add_user_text("second")
    c.add_bot_text("b")
    assert c.begin_correction("second corrected") == 3
    assert [r.text for r in c.records()] == ["first", "a", "second corrected"]
