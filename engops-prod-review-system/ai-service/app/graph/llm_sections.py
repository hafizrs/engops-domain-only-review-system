"""LLM structured section generation for evaluation UI tabs (Ollama demo / Azure prod)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.config import settings
from app.graph.section_enrichment import enrich_insights_section, enrich_performance_section
from app.role_weights import DIMENSION_KEYS, DIMENSION_LABELS

logger = logging.getLogger(__name__)

BEHAVIORAL_PROFILES = [
    "autonomous_executor",
    "guided_reliable",
    "collaborator",
    "crisis_anchor",
    "async_specialist",
    "steady_executor",
    "technical_specialist",
    "quiet_contributor",
    "process_champion",
]


def _get_azure_llm():
    """Azure OpenAI (paid production)."""
    settings._require_azure()
    from langchain_openai import AzureChatOpenAI

    return AzureChatOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        azure_deployment=settings.azure_openai_deployment_name,
        api_version=settings.azure_openai_api_version,
        temperature=0.2,
    )


def _repair_json(text: str) -> str:
    """Fix common small-model JSON mistakes."""
    fixed = text.strip()
    fixed = fixed.replace("```json", "").replace("```", "").strip()
    # trailing commas before } or ]
    fixed = re.sub(r",\s*}", "}", fixed)
    fixed = re.sub(r",\s*]", "]", fixed)
    return fixed


def _close_truncated_json(text: str) -> str:
    """Best-effort close JSON cut off by num_predict (unterminated string/braces)."""
    s = text.rstrip()
    if not s:
        return s

    in_string = False
    escape = False
    for ch in s:
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
    if in_string:
        s += '"'

    stack: list[str] = []
    in_string = False
    escape = False
    for ch in s:
        if escape:
            escape = False
            continue
        if ch == "\\" and in_string:
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            stack.append("}")
        elif ch == "[":
            stack.append("]")
        elif ch in "}]" and stack and stack[-1] == ch:
            stack.pop()

    if stack:
        s += "".join(reversed(stack))
    return s


def _extract_json_object(raw: str) -> str | None:
    """Extract first balanced {...} object from text."""
    start = raw.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(raw)):
        ch = raw[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return raw[start : i + 1]
    return None


def _parse_json_response(text: str) -> dict[str, Any]:
    raw = _repair_json(text or "")
    closed = _close_truncated_json(raw)
    candidates = [raw]
    if closed != raw:
        candidates.append(closed)
    extracted = _extract_json_object(raw)
    if extracted and extracted != raw:
        candidates.append(extracted)
    extracted_closed = _extract_json_object(closed) if closed != raw else None
    if extracted_closed and extracted_closed not in candidates:
        candidates.append(extracted_closed)

    last_err: json.JSONDecodeError | None = None
    for candidate in candidates:
        for attempt in (candidate, _repair_json(candidate), _close_truncated_json(_repair_json(candidate))):
            try:
                return json.loads(attempt)
            except json.JSONDecodeError as e:
                last_err = e
    if last_err:
        raise last_err
    raise json.JSONDecodeError("No JSON object found", raw, 0)


def _ollama_chat(system: str, user_content: str, *, num_predict: int | None = None) -> str:
    import httpx

    settings.require_llm()
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
        "stream": False,
        "format": "json",
        "options": {
            "num_gpu": settings.ollama_num_gpu,
            "num_ctx": settings.ollama_num_ctx,
            "num_predict": num_predict if num_predict is not None else settings.ollama_num_predict,
            "temperature": 0.1,
        },
    }
    r = httpx.post(
        f"{settings.ollama_base_url.rstrip('/')}/api/chat",
        json=payload,
        timeout=settings.ollama_timeout_seconds,
    )
    r.raise_for_status()
    return (r.json().get("message") or {}).get("content", "")


def _invoke_json_ollama(
    system: str,
    user_payload: dict[str, Any],
    *,
    num_predict: int | None = None,
) -> dict[str, Any]:
    """Call Ollama /api/chat directly (GPU options, JSON mode)."""
    settings.require_llm()
    predict = num_predict if num_predict is not None else settings.ollama_num_predict
    logger.info(
        "Calling Ollama model=%s gpu_layers=%s num_predict=%s timeout=%ss",
        settings.ollama_model,
        settings.ollama_num_gpu,
        predict,
        settings.ollama_timeout_seconds,
    )
    user_content = json.dumps(user_payload, default=str)
    text = _ollama_chat(system, user_content, num_predict=predict)
    try:
        return _parse_json_response(text)
    except json.JSONDecodeError as first_err:
        logger.warning("Ollama JSON parse failed, retrying once: %s", first_err)
        retry_system = system + "\n\nIMPORTANT: Return ONE valid JSON object only. Use evidence quotes from input."
        text = _ollama_chat(retry_system, user_content, num_predict=predict)
        return _parse_json_response(text)


def _invoke_json(system: str, user_payload: dict[str, Any]) -> dict[str, Any]:
    if settings.llm_provider == "ollama":
        return _invoke_json_ollama(system, user_payload)

    from langchain_core.messages import HumanMessage, SystemMessage

    llm = _get_azure_llm()
    resp = llm.invoke(
        [SystemMessage(content=system), HumanMessage(content=json.dumps(user_payload, default=str))]
    )
    text = resp.content if hasattr(resp, "content") else str(resp)
    return _parse_json_response(text)


def _insights_context_ollama(state: dict[str, Any]) -> dict[str, Any]:
    """Smaller payload for insights — leaves room for large JSON output in context window."""
    perf = state.get("performance_section") or {}
    beh = state.get("behavioral_section") or {}
    evidence = [(e[:200] if isinstance(e, str) else e) for e in (state.get("evidence") or [])[:8]]
    return {
        "employee": state.get("employee"),
        "dimension_scores": state.get("dimension_aggregates"),
        "calibrated_score": state.get("calibrated_score"),
        "recommended_band": state.get("recommended_band"),
        "evidence_strength": state.get("evidence_strength"),
        "evidence": evidence,
        "performance_summary": (perf.get("summary") or "")[:300],
        "behavioral_profile": beh.get("behavioralProfile"),
        "behavioral_summary": (beh.get("behavioralSummary") or "")[:300],
        "rule_based_risks": (state.get("risk_patterns") or [])[:3],
        "rule_based_bias": (state.get("bias_warnings") or [])[:3],
        "submission_count": len(state.get("submissions") or []),
    }


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
        "evidence": (state.get("evidence") or [])[:6],
        "feedback_patterns": state.get("feedback_patterns"),
        "score_inconsistencies": state.get("score_inconsistencies"),
        "missing_evidence": state.get("missing_evidence"),
        "submission_count": len(state.get("submissions") or []),
        "rules": [
            "Use only evidence from submissions; do not invent facts.",
            "Every narrative must cite at least one concrete detail from the evidence list (dimension, reviewer pattern, or quoted option text).",
            "Never use generic filler such as 'meets expectations', 'continues to develop', or 'shows potential' without a specific example.",
            "Do not penalize low communication scores if technical_judgment and quality are strong — note visibility vs performance gap when applicable.",
            "Do not recommend firing, salary, or PIP outcomes.",
            "Do not quote raw anonymous peer text verbatim.",
            "Score against current role, not a senior bar.",
            "Manager makes the final decision.",
        ],
    }


def _performance_system() -> str:
    if settings.llm_provider == "ollama":
        return f"""HR performance analyst. Return valid JSON only.

Write full sentences copied or paraphrased from evidence — NOT dimension labels alone.
achievements: 3-4 strings using reviewer option text (e.g. delivery wins, technical impact).
blockers: low-score themes or empty array.

Keys:
- summary (2-3 sentence manager paragraph citing evidence)
- employeeFacingSummary (positive 1:1-safe paragraph)
- managerOnlySummary (internal notes)
- dimensionNarratives (keys: {", ".join(DIMENSION_KEYS)} — 1 sentence each with evidence)
- achievements (string array — full sentences from evidence)
- blockers (string array — improvement themes or [])
- aboveRoleSignal (none|emerging|consistent|strong)
- aboveRoleSignals (string array)
- trend (up|stable|down)
- trendRationale (string)
- teamContext (string)

No markdown."""
    return f"""You are an HR performance analyst. Return ONLY valid JSON for the Performance tab.

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

Each narrative must reference specific evidence. If evidence is thin, say what is missing instead of generic praise.

No markdown. No extra keys."""


def generate_performance_section(state: dict[str, Any]) -> dict[str, Any]:
    parsed = _invoke_json(_performance_system(), _analysis_context(state))
    if settings.llm_provider == "ollama":
        parsed = enrich_performance_section(parsed, state)
    return {**state, "performance_section": parsed}


def _first_present(parsed: dict[str, Any], *keys: str, default=None):
    for key in keys:
        val = parsed.get(key)
        if val not in (None, "", [], {}):
            return val
    return default


def _normalize_string_list(items: Any) -> list[str]:
    if not isinstance(items, list):
        return []
    out: list[str] = []
    for item in items:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
    return out


def _normalize_strengths(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out: list[dict[str, Any]] = []
    for item in items:
        if isinstance(item, str) and item.strip():
            out.append({"title": item.strip(), "evidence": [], "relatedDimensions": []})
        elif isinstance(item, dict):
            title = item.get("title") or item.get("name") or ""
            if title:
                out.append(
                    {
                        "title": str(title),
                        "evidence": _normalize_string_list(item.get("evidence")),
                        "relatedDimensions": _normalize_string_list(item.get("relatedDimensions")),
                    }
                )
    return out


def _normalize_insights(parsed: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    """Normalize small-model output (snake_case, string arrays) to UI schema."""
    strengths = _normalize_strengths(_first_present(parsed, "strengths", default=[]))
    risks = _first_present(parsed, "riskPatterns", "risk_patterns", default=[]) or state.get("risk_patterns") or []
    improvements = _first_present(parsed, "improvementAreas", "improvement_areas", default=[])
    bias = _first_present(parsed, "biasWarnings", "bias_warnings", default=[]) or state.get("bias_warnings") or []
    peer = _first_present(parsed, "peerPatterns", "peer_patterns", default={}) or {}
    dev_plan = _first_present(parsed, "developmentPlan", "development_plan", default={}) or {}
    talking = _first_present(parsed, "managerTalkingPoints", "manager_talking_points", default=[]) or []

    if not isinstance(risks, list):
        risks = []
    if not isinstance(improvements, list):
        improvements = []
    if not isinstance(bias, list):
        bias = []
    if not isinstance(peer, dict):
        peer = {}
    if not isinstance(dev_plan, dict):
        dev_plan = {}
    if not isinstance(talking, list):
        talking = _normalize_string_list(talking)

    if not strengths and state.get("evidence"):
        strengths = [
            {
                "title": str(ev)[:80],
                "evidence": [str(ev)],
                "relatedDimensions": [],
            }
            for ev in (state.get("evidence") or [])[:2]
        ]

    if not talking:
        talking = [
            "Review calibrated score and evidence with the employee",
            "Agree one development focus for next quarter",
        ]

    return {
        "strengths": strengths,
        "riskPatterns": risks,
        "improvementAreas": improvements,
        "peerPatterns": {
            "positive": _normalize_string_list(peer.get("positive")),
            "negative": _normalize_string_list(peer.get("negative")),
            "sentiment": str(peer.get("sentiment") or "mixed"),
        },
        "biasWarnings": bias,
        "developmentPlan": dev_plan,
        "managerTalkingPoints": talking,
    }


def generate_behavioral_section(state: dict[str, Any]) -> dict[str, Any]:
    system = f"""You are an HR behavioral analyst. Return ONLY valid JSON for the Behavioral tab.

Keys:
- behavioralProfile (exactly one of: {", ".join(BEHAVIORAL_PROFILES)})
- behavioralLabel (human-readable profile name)
- behavioralSummary (2-4 sentences for manager, evidence-based)
- placementNotes (when this profile thrives vs struggles on projects)
- bestForProjects (string array — project types/contexts)
- workingStyleTraits (string array — observable behaviors)

Prefer technical_specialist or quiet_contributor when technical/quality scores are high but communication is lower — this is a valid style, not a defect.

No markdown. No extra keys."""

    parsed = _invoke_json(system, _analysis_context(state))
    profile = parsed.get("behavioralProfile", "collaborator")
    if profile not in BEHAVIORAL_PROFILES:
        parsed["behavioralProfile"] = "collaborator"
    return {**state, "behavioral_section": parsed}


def generate_insights_section(state: dict[str, Any]) -> dict[str, Any]:
    if settings.llm_provider == "ollama":
        system = """HR insights analyst. Return valid JSON only.

Use reviewer evidence text for narratives — NOT bare dimension names.
strengths titles like "Strong Technical Judgment & Knowledge" with evidence[] quotes.
peerPatterns.positive: 3-4 paraphrased themes from high-score evidence.
developmentPlan: fill next30Days, next60Days, next90Days with actionable steps.
Include rule_based_risks in riskPatterns when present.

Keys:
- strengths: [{title, evidence: [string], relatedDimensions: [string]}]
- riskPatterns: [{risk, severity, evidence: [string], managerActionRequired: bool}]
- improvementAreas: [{title, evidence: [string], suggestedAction: string}]
- peerPatterns: {positive: [string], negative: [string], sentiment: string}
- biasWarnings: [{text, reason, suggestedRewrite}]
- developmentPlan: {focusAreas: [string], next30Days: [string], next60Days: [string], next90Days: [string], recommendedTraining: [string], managerSupportNeeded: [string]}
- managerTalkingPoints: [string]

No markdown."""
    else:
        system = """You are an HR insights analyst. Return ONLY valid JSON for the AI Insights tab.

Keys:
- strengths (array of {title, evidence[], relatedDimensions[]})
- riskPatterns (array of {risk, severity, evidence[], managerActionRequired})
- improvementAreas (array of {title, evidence[], suggestedAction})
- peerPatterns ({positive: string[], negative: string[], sentiment: string})
- biasWarnings (array of {text, reason, suggestedRewrite})
- developmentPlan ({focusAreas[], next30Days[], next60Days[], next90Days[], recommendedTraining[], managerSupportNeeded[]})
- managerTalkingPoints (string array)

Each strength/risk must include evidence[] with at least one non-empty string from submissions. No duplicate boilerplate across employees.

No markdown. No extra keys."""

    if settings.llm_provider == "ollama":
        ctx = _insights_context_ollama(state)
        parsed = _invoke_json_ollama(
            system,
            ctx,
            num_predict=settings.ollama_num_predict_insights,
        )
    else:
        ctx = _analysis_context(state)
        ctx["rule_based_risks"] = state.get("risk_patterns") or []
        ctx["rule_based_bias"] = state.get("bias_warnings") or []
        parsed = _invoke_json(system, ctx)

    if settings.llm_provider == "ollama":
        normalized = enrich_insights_section(parsed, state)
    else:
        normalized = _normalize_insights(parsed, state)

    return {
        **state,
        "insights_section": normalized,
        "strengths": normalized["strengths"],
        "improvement_areas": normalized["improvementAreas"],
        "risk_patterns": normalized["riskPatterns"],
        "bias_warnings": normalized["biasWarnings"],
        "development_plan": normalized["developmentPlan"],
        "manager_talking_points": normalized["managerTalkingPoints"],
        "peer_patterns": normalized["peerPatterns"],
        "manager_summary": (state.get("performance_section") or {}).get("summary", ""),
        "employee_summary": (state.get("performance_section") or {}).get("employeeFacingSummary", ""),
        "_manager_only_summary": (state.get("performance_section") or {}).get("managerOnlySummary", ""),
    }
