from turns import TurnCollector


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
    # P2 captures no audio and no word metadata (D12/D14): the record must not
    # grow fields that later code would assume are populated.
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
    assert merged is first
    assert merged.text == "hello there"
    bot = c.add_bot_text("hi")
    assert bot is not None and bot.position == 2 and bot.role == "ai"
