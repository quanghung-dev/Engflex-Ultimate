from prompts import build_system_prompt


def test_prompt_includes_level():
    prompt = build_system_prompt("A2")
    assert "A2" in prompt
    assert "English" in prompt


def test_prompt_defaults_to_b1():
    assert "B1" in build_system_prompt()


def test_prompt_names_tutor_and_hides_model():
    prompt = build_system_prompt()
    assert "Flexi" in prompt
    assert "Never mention model names" in prompt


def test_prompt_owns_first_turn_and_bans_name_asking():
    prompt = build_system_prompt()
    assert "very first reply is the greeting" in prompt
    assert "Never ask for the learner's name" in prompt
