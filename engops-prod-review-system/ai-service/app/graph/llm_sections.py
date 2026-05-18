"""Azure OpenAI structured section generation for evaluation UI tabs."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import settings
from app.role_weights import DIMENSION_KEYS, DIMENSION_LABELS

logger = logging.getLogger(__name__)

BEHAVIORAL_PROFILES = [
    "autonomous_executor",
    "guided_reliable",
    "collaborator",
    "crisis_anchor",
    "async_specialist",
    "steady_executor",
]


def _get_llm():
    settings.require_azure()
    from langchain_openai import AzureChatOpenAI

    return AzureChatOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        azure_deployment=settings.azure_openai_deployment_name,
        api_version=settings.azure_openai_api_version,
        temperature=0.2,
    )


def _parse_json_response(text: str) -> dict[str, Any]:
    raw = (text or "").strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group(0))
        raise


def _invoke_json(system: str, user_payload: dict[str, Any]) -> dict[str, Any]:
    from langchain_core.messages import HumanMessage, SystemMessage

    llm = _get_llm()
    resp = llm.invoke(
        [SystemMessage(content=system), HumanMessage(content=json.dumps(user_payload, default=str))]
    )
    text = resp.content if hasattr(resp, "content") else str(resp)
    return _parse_json_response(text)


def _analysis_context(state: dict[str, Any]) -> dict[str, Any]:
    return {
        "employee": state.get("employee"),
        "role_weights": state.get("role_weights"),
        "dimension_scores": state.get("dimension_aggregates"),
        "dimension_labels": DIMENSION_LABELS,
        "calibrated_score": state.get("calibrated_score"),
        "role_based_score": state.get("role_based_score"),
        "recommended_band": state.get("recommended_band"),
        "evidence_strength": state.get("evidence_strength"),
        "confidence_score": state.get("confidence_score"),
        "evidence": (state.get("evidence") or [])[:12],
        "feedback_patterns": state.get("feedback_patterns"),
        "score_inconsistencies": state.get("score_inconsistencies"),
        "missing_evidence": state.get("missing_evidence"),
        "submission_count": len(state.get("submissions") or []),
        "rules": [
            "Use only evidence from submissions; do not invent facts.",
            "Do not recommend firing, salary, or PIP outcomes.",
            "Do not quote raw anonymous peer text verbatim.",
            "Score against current role, not a senior bar.",
            "Manager makes the final decision.",
        ],
    }


def generate_performance_section(state: dict[str, Any]) -> dict[str, Any]:
    system = f"""You are an HR performance analyst. Return ONLY valid JSON for the Performance tab.

Keys:
- summary (manager draft paragraph)
- employeeFacingSummary (safe for 1:1, no internal risks)
- managerOnlySummary (internal manager notes)
- dimensionNarratives (object with keys: {", ".join(DIMENSION_KEYS)} — 1-2 sentences each)
- achievements (string array, evidence-based)
- blockers (string array, evidence-based or empty)
- aboveRoleSignal (one of: none, emerging, consistent, strong)
- aboveRoleSignals (string array)
- trend (one of: up, stable, down)
- trendRationale (short string)
- teamContext (how they compare to team/role expectations in prose)

No markdown. No extra keys."""

    parsed = _invoke_json(system, _analysis_context(state))
    return {**state, "performance_section": parsed}


def generate_behavioral_section(state: dict[str, Any]) -> dict[str, Any]:
    system = f"""You are an HR behavioral analyst. Return ONLY valid JSON for the Behavioral tab.

Keys:
- behavioralProfile (exactly one of: {", ".join(BEHAVIORAL_PROFILES)})
- behavioralLabel (human-readable profile name)
- behavioralSummary (2-4 sentences for manager, evidence-based)
- placementNotes (when this profile thrives vs struggles on projects)
- bestForProjects (string array — project types/contexts)
- workingStyleTraits (string array — observable behaviors)

No markdown. No extra keys."""

    parsed = _invoke_json(system, _analysis_context(state))
    profile = parsed.get("behavioralProfile", "collaborator")
    if profile not in BEHAVIORAL_PROFILES:
        parsed["behavioralProfile"] = "collaborator"
    return {**state, "behavioral_section": parsed}


def generate_insights_section(state: dict[str, Any]) -> dict[str, Any]:
    system = """You are an HR insights analyst. Return ONLY valid JSON for the AI Insights tab.

Keys:
- strengths (array of {title, evidence[], relatedDimensions[]})
- riskPatterns (array of {risk, severity, evidence[], managerActionRequired})
- improvementAreas (array of {title, evidence[], suggestedAction})
- peerPatterns ({positive: string[], negative: string[], sentiment: string})
- biasWarnings (array of {text, reason, suggestedRewrite})
- developmentPlan ({focusAreas[], next30Days[], next60Days[], next90Days[], recommendedTraining[], managerSupportNeeded[]})
- managerTalkingPoints (string array)

No markdown. No extra keys."""

    ctx = _analysis_context(state)
    ctx["rule_based_risks"] = state.get("risk_patterns") or []
    ctx["rule_based_bias"] = state.get("bias_warnings") or []
    parsed = _invoke_json(system, ctx)

    return {
        **state,
        "insights_section": parsed,
        "strengths": parsed.get("strengths") or [],
        "improvement_areas": parsed.get("improvementAreas") or [],
        "risk_patterns": parsed.get("riskPatterns") or state.get("risk_patterns") or [],
        "bias_warnings": parsed.get("biasWarnings") or state.get("bias_warnings") or [],
        "development_plan": parsed.get("developmentPlan") or {},
        "manager_talking_points": parsed.get("managerTalkingPoints") or [],
        "peer_patterns": parsed.get("peerPatterns") or {},
        "manager_summary": (state.get("performance_section") or {}).get("summary", ""),
        "employee_summary": (state.get("performance_section") or {}).get("employeeFacingSummary", ""),
        "_manager_only_summary": (state.get("performance_section") or {}).get("managerOnlySummary", ""),
    }
