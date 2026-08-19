"""[M-4] Drift detector for SYSTEM_PROMPT vs. AnalysisResult.

The Gemini/OpenAI response format is enforced entirely by prompt text right
now (see the review's M-4 finding for why we didn't switch to a Pydantic
`response_schema` argument). That means every AnalysisResult field name has
to appear in SYSTEM_PROMPT — otherwise the LLM invents its own field names
and validation fails at runtime. This test catches the "renamed a field
but forgot to touch prompts.py" mistake at test time instead.
"""
from __future__ import annotations

from app.models.analysis import AnalysisResult
from app.services.prompts import SYSTEM_PROMPT


def _collect_field_names(schema: dict) -> set[str]:
    fields: set[str] = set()

    def walk(node: object) -> None:
        if isinstance(node, dict):
            props = node.get("properties")
            if isinstance(props, dict):
                for name, sub in props.items():
                    fields.add(name)
                    walk(sub)
            defs = node.get("$defs")
            if isinstance(defs, dict):
                for sub in defs.values():
                    walk(sub)
            for value in node.values():
                if isinstance(value, (dict, list)):
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(schema)
    return fields


def test_system_prompt_covers_all_analysis_result_fields():
    schema = AnalysisResult.model_json_schema()
    fields = _collect_field_names(schema)
    missing = sorted(name for name in fields if name not in SYSTEM_PROMPT)
    assert not missing, (
        "SYSTEM_PROMPT is missing AnalysisResult field(s): "
        f"{missing}. Update backend/app/services/prompts.py so the LLM "
        "sees the new field name(s)."
    )


# Values the LLM must NEVER produce because the server overrides them.
# `mode` in particular is stamped to "LIVE" (or "MOCK" by MockAnalyzer)
# after parsing, so the model doesn't need to know either literal.
_ENUM_ALLOW_MISSING = {"MOCK", "LIVE"}


def test_system_prompt_covers_all_enum_values():
    """Literal / enum values must appear literally so the LLM returns them
    exactly (not a synonym like 'go' or 'conditional')."""
    schema = AnalysisResult.model_json_schema()

    enums: set[str] = set()

    def walk(node: object) -> None:
        if isinstance(node, dict):
            enum_values = node.get("enum")
            if isinstance(enum_values, list):
                for v in enum_values:
                    if isinstance(v, str):
                        enums.add(v)
            for value in node.values():
                if isinstance(value, (dict, list)):
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(schema)

    missing = sorted(
        v for v in enums
        if v not in SYSTEM_PROMPT and v not in _ENUM_ALLOW_MISSING
    )
    assert not missing, (
        "SYSTEM_PROMPT is missing AnalysisResult enum value(s): "
        f"{missing}. Either add them to prompts.py or, if the server "
        "always overrides that field, add it to _ENUM_ALLOW_MISSING with a "
        "comment explaining why."
    )
