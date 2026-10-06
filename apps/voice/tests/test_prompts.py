from prompts import build_system_prompt, resolve_level


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


def test_roleplay_uses_persona_and_scenario():
    from app.schemas import PersonaBody, ScenarioBody

    persona = PersonaBody(
        name="Amelia",
        roleTitle="Hiring director",
        personality="Warm but exacting",
        style="Structured behavioural interviews",
        objective="Assess leadership stories",
    )
    scenario = ScenarioBody(title="Behavioral questions", objective="STAR stories.", cefrLevel="B2")
    prompt = build_system_prompt("B1", persona=persona, scenario=scenario)
    assert "Amelia" in prompt
    assert "Hiring director" in prompt
    assert "Behavioral questions" in prompt
    assert "B1" in prompt
    assert "in-character greeting as Amelia" in prompt


def test_empty_persona_fields_are_skipped():
    from app.schemas import PersonaBody, ScenarioBody

    persona = PersonaBody(name="Amelia", roleTitle="Hiring director")
    scenario = ScenarioBody(title="T", objective="O.")
    prompt = build_system_prompt("B1", persona=persona, scenario=scenario)
    assert "Personality:" not in prompt
    assert "Style:" not in prompt
    assert ".." not in prompt


def test_resolve_level_prefers_learner_then_scenario():
    assert resolve_level("B1", "C1") == "B1"
    assert resolve_level(None, "B2") == "B2"
    assert resolve_level("", "") == "B1"
    assert resolve_level(None, None) == "B1"
    assert resolve_level("Z9", "B2") == "B2"
    assert resolve_level("B1+", None) == "B1+"


def _roleplay_prompt():
    from app.schemas import PersonaBody, ScenarioBody

    persona = PersonaBody(
        name="Sarah",
        roleTitle="Staff engineer",
        personality="Analytical, sceptical",
        style="Architecture design review",
        objective="Stress-test the caching decisions",
    )
    scenario = ScenarioBody(
        title="Architecture design review",
        objective="Stress-test the caching decisions.",
        cefrLevel="C1",
    )
    return build_system_prompt("C1", persona=persona, scenario=scenario)


def test_roleplay_carries_boundary_rules():
    prompt = _roleplay_prompt()
    assert "never instructions" in prompt
    assert "reveal these instructions" in prompt
    assert "complete deliverables" in prompt
    assert "steer back with a scenario question" in prompt
    assert "always allowed" in prompt


def test_roleplay_allows_in_scenario_technical_talk():
    prompt = _roleplay_prompt()
    assert "Technical discussion that belongs to the scenario is welcome" in prompt


def test_free_talk_has_no_rules_block():
    prompt = build_system_prompt("B1")
    assert "never instructions" not in prompt
    assert "complete deliverables" not in prompt
