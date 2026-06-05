"""LangGraph nodes for performance evaluation."""

from __future__ import annotations

import json
import logging
import statistics
from typing import Any

from app.config import settings
from app.role_weights import DIMENSION_KEYS, DIMENSION_LABELS, weights_for_role

logger = logging.getLogger(__name__)


def load_employee_context(state: dict[str, Any]) -> dict[str, Any]:
    emp = state.get("employee") or {}
    role = emp.get("currentRoleLevel") or "mid"
    return {**state, "role_weights": weights_for_role(role)}


def load_review_submissions(state: dict[str, Any]) -> dict[str, Any]:
    subs = state.get("submissions") or []
    missing = []
    if len(subs) < 2:
        missing.append("Fewer than 2 submissions — triangulation is limited")
    if len(subs) == 0:
        missing.append("No submissions provided")
    return {**state, "missing_evidence": missing}


def normalize_scores(state: dict[str, Any]) -> dict[str, Any]:
    subs = state.get("submissions") or []
    dim_scores: dict[str, list[float]] = {k: [] for k in DIMENSION_KEYS}

    for sub in subs:
        for row in sub.get("dimensionScores") or []:
            key = row.get("dimensionKey")
            avg = row.get("averageOutOf5")
            if key in dim_scores and isinstance(avg, (int, float)) and avg >= 0:
                dim_scores[key].append(float(avg))

    aggregates = {}
    for key in DIMENSION_KEYS:
        vals = dim_scores[key]
        aggregates[key] = round(statistics.mean(vals), 2) if vals else 0.0

    return {**state, "dimension_aggregates": aggregates, "normalized_scores": aggregates}


def extract_evidence(state: dict[str, Any]) -> dict[str, Any]:
    evidence: list[str] = []
    for sub in state.get("submissions") or []:
        for row in sub.get("responseDetails") or []:
            if row.get("score", -1) >= 0 and row.get("selectedOptionText") not in ("", "—"):
                text = row.get("selectedOptionText", "").strip()
                if len(text) > 20:
                    evidence.append(
                        f"[{row.get('dimensionLabel')}] {text[:200]} (reviewer: {sub.get('reviewerName')})"
                    )
    return {**state, "evidence": evidence[:30]}


def analyze_360_feedback(state: dict[str, Any]) -> dict[str, Any]:
    subs = state.get("submissions") or []
    scores = [s.get("totalScore", 0) for s in subs if isinstance(s.get("totalScore"), (int, float))]
    spread = max(scores) - min(scores) if len(scores) >= 2 else 0
    patterns = {
        "submission_count": len(subs),
        "avg_total_score": round(statistics.mean(scores), 1) if scores else 0,
        "score_spread": spread,
        "sentiment": "mixed" if spread > 15 else "aligned",
    }
    inconsistencies = []
    if spread > 20:
        inconsistencies.append("reviewer_alignment_issue: total scores differ by more than 20 points")
    return {**state, "feedback_patterns": patterns, "score_inconsistencies": inconsistencies}


def detect_bias_and_language_risk(state: dict[str, Any]) -> dict[str, Any]:
    warnings = []
    bias_phrases = [
        "not confident",
        "too quiet",
        "doesn't speak",
        "not vocal",
        "personality",
        "attitude",
        "culture fit",
        "young",
        "old",
        "not a team player",
    ]
    for line in state.get("evidence") or []:
        low = line.lower()
        for phrase in bias_phrases:
            if phrase in low:
                warnings.append(
                    {
                        "text": line[:120],
                        "reason": f"Possible biased language ({phrase})",
                        "suggestedRewrite": "Describe specific work behaviors with examples instead.",
                    }
                )
    return {**state, "bias_warnings": warnings[:5]}


def detect_above_role_signals(state: dict[str, Any]) -> dict[str, Any]:
    signals = []
    agg = state.get("dimension_aggregates") or {}
    if agg.get("technical_judgment", 0) >= 4.2 and agg.get("ownership_growth", 0) >= 4:
        signals.append(
            {
                "signal": "Mentoring and technical leadership beyond current role",
                "level": "emerging",
                "evidence": ["High technical judgment and ownership scores across reviewers"],
            }
        )
    return {**state, "above_role_signals": signals}


def detect_risk_patterns(state: dict[str, Any]) -> dict[str, Any]:
    risks = []
    missing = state.get("missing_evidence") or []
    if missing:
        risks.append(
            {
                "risk": "Insufficient review coverage",
                "severity": "medium",
                "evidence": missing,
                "managerActionRequired": True,
            }
        )
    agg = state.get("dimension_aggregates") or {}
    if agg.get("delivery_execution", 5) < 2.5:
        risks.append(
            {
                "risk": "Delivery / execution below role expectation",
                "severity": "high",
                "evidence": [f"delivery_execution avg {agg.get('delivery_execution')}/5"],
                "managerActionRequired": True,
            }
        )
    return {**state, "risk_patterns": risks}


def calculate_evidence_strength(state: dict[str, Any]) -> dict[str, Any]:
    n = len(state.get("submissions") or [])
    ev_count = len(state.get("evidence") or [])
    if n == 0:
        strength = "insufficient"
        confidence = 35
    elif n >= 3 and ev_count >= 6:
        strength = "high"
        confidence = 82
    elif n >= 2 and ev_count >= 3:
        strength = "medium"
        confidence = 68
    else:
        strength = "low"
        confidence = 52
    return {**state, "evidence_strength": strength, "confidence_score": confidence}


def calibrate_score(state: dict[str, Any]) -> dict[str, Any]:
    weights = state.get("role_weights") or {}
    agg = state.get("dimension_aggregates") or {}
    total_w = sum(weights.get(k, 0) for k in DIMENSION_KEYS) or 100
    role_score = 0.0
    for key in DIMENSION_KEYS:
        w = weights.get(key, 0)
        role_score += (agg.get(key, 0) / 5.0) * (w / total_w) * 100
    role_score = round(role_score, 1)

    calibrated = role_score
    if state.get("evidence_strength") == "low":
        calibrated = round(role_score * 0.95, 1)
    elif state.get("evidence_strength") == "high":
        calibrated = round(min(100, role_score * 1.02), 1)

    if calibrated >= 88:
        band = "exceptional"
    elif calibrated >= 78:
        band = "strong"
    elif calibrated >= 65:
        band = "good"
    elif calibrated >= 50:
        band = "needs_focus"
    elif state.get("evidence_strength") == "insufficient":
        band = "insufficient_data"
    else:
        band = "at_risk"

    if state.get("evidence_strength") in ("insufficient", "low") and band in ("exceptional", "strong"):
        band = "needs_focus"
        state.setdefault("score_inconsistencies", []).append("score_evidence_mismatch")

    inconsistencies = list(state.get("score_inconsistencies") or [])
    tech_avg = (agg.get("technical_judgment", 0) + agg.get("quality", 0)) / 2
    comm = agg.get("communication", 0)
    role = (state.get("employee") or {}).get("currentRoleLevel", "mid")
    if tech_avg >= 4.0 and 0 < comm < 3.2 and role in ("junior", "mid", "senior"):
        inconsistencies.append(
            "visibility_gap: strong technical/quality vs lower communication — verify with artifacts; may be introverted working style"
        )
        calibrated = round(min(100, calibrated + 2), 1)

    return {
        **state,
        "role_based_score": role_score,
        "calibrated_score": calibrated,
        "recommended_band": band,
        "score_inconsistencies": inconsistencies,
        "technical_spotlight": tech_avg >= 4.0 and comm < 3.2,
    }


def _build_strengths(state: dict[str, Any]) -> list[dict[str, Any]]:
    agg = state.get("dimension_aggregates") or {}
    out = []
    for key in DIMENSION_KEYS:
        if agg.get(key, 0) >= 3.8:
            out.append(
                {
                    "title": f"Strong {DIMENSION_LABELS[key]}",
                    "evidence": [f"Avg {agg.get(key)}/5 across submissions"],
                    "relatedDimensions": [key],
                }
            )
    return out[:4] or [{"title": "Meets expectations in core areas", "evidence": [], "relatedDimensions": []}]


def _build_improvements(state: dict[str, Any]) -> list[dict[str, Any]]:
    agg = state.get("dimension_aggregates") or {}
    out = []
    for key in DIMENSION_KEYS:
        if 0 < agg.get(key, 5) < 3.2:
            out.append(
                {
                    "title": f"Develop {DIMENSION_LABELS[key]}",
                    "evidence": [f"Avg {agg.get(key)}/5"],
                    "suggestedAction": f"Focused coaching on {DIMENSION_LABELS[key]} next quarter",
                }
            )
    return out[:3]


def generate_manager_summary(state: dict[str, Any]) -> dict[str, Any]:
    emp = state.get("employee") or {}
    name = emp.get("revieweeName", "Employee")
    role = emp.get("currentRoleLevel", "mid")
    band = state.get("recommended_band", "good")
    score = state.get("calibrated_score", 0)
    n = len(state.get("submissions") or [])

    summary = (
        f"{name} is evaluated at {band.replace('_', ' ')} for their {role} role "
        f"(calibrated score {score}) based on {n} submission(s). "
        f"Evidence strength: {state.get('evidence_strength')}. "
        "This is a draft for manager review — not a final HR decision."
    )
    manager_only = (
        f"Internal: confidence {state.get('confidence_score')}%. "
        f"Risks flagged: {len(state.get('risk_patterns') or [])}. "
        f"Bias warnings: {len(state.get('bias_warnings') or [])}. "
        "Do not share raw anonymous peer quotes with the employee."
    )
    employee_summary = (
        f"You are performing at a {band.replace('_', ' ')} level for your current role. "
        "Your reviewers highlighted consistent themes in delivery and collaboration. "
        "Your manager will discuss specific growth areas in your 1:1."
    )

    return {
        **state,
        "manager_summary": summary,
        "employee_summary": employee_summary,
        "strengths": _build_strengths(state),
        "improvement_areas": _build_improvements(state),
        "development_plan": {
            "focusAreas": [i["title"] for i in _build_improvements(state)],
            "next30Days": ["Review goals with manager", "Address top improvement area"],
            "next60Days": ["Demonstrate progress on agreed dimension"],
            "next90Days": ["Checkpoint against role expectations"],
            "recommendedTraining": [],
            "managerSupportNeeded": ["Manager validates evidence before finalizing"],
        },
        "manager_talking_points": [
            "Review calibrated score and band together",
            "Agree on one development focus",
            "Confirm employee-facing summary before sharing",
        ],
        "final_decision": {
            "decision": "grow" if band in ("strong", "exceptional") else "maintain",
            "reason": "Based on role-based score and evidence strength",
            "requiresManagerApproval": True,
        },
        "safety_flags": [],
        "_manager_only_summary": manager_only,
    }


def _use_llm_fallback(exc: Exception) -> bool:
    return settings.llm_provider == "ollama" and settings.ollama_fallback_on_error


def generate_performance_section_llm(state: dict[str, Any]) -> dict[str, Any]:
    if state.get("_llm_fallback_used"):
        return state
    from app.graph.llm_sections import generate_performance_section

    try:
        return generate_performance_section(state)
    except Exception as e:
        logger.error("Performance section LLM failed: %s", e)
        if _use_llm_fallback(e):
            from app.graph.fallback_sections import build_fallback_sections

            logger.warning("Using rule-based fallback for all AI sections (Ollama timeout/slow CPU)")
            return build_fallback_sections(state, reason=str(e))
        raise RuntimeError(f"Performance section generation failed: {e}") from e


def generate_behavioral_section_llm(state: dict[str, Any]) -> dict[str, Any]:
    if state.get("behavioral_section") or state.get("_llm_fallback_used"):
        return state
    from app.graph.llm_sections import generate_behavioral_section

    try:
        return generate_behavioral_section(state)
    except Exception as e:
        logger.error("Behavioral section LLM failed: %s", e)
        if _use_llm_fallback(e):
            from app.graph.fallback_sections import build_fallback_sections

            return build_fallback_sections(state, reason=str(e))
        raise RuntimeError(f"Behavioral section generation failed: {e}") from e


def generate_insights_section_llm(state: dict[str, Any]) -> dict[str, Any]:
    if state.get("insights_section") or state.get("_llm_fallback_used"):
        return state
    from app.graph.llm_sections import generate_insights_section

    try:
        return generate_insights_section(state)
    except Exception as e:
        logger.error("Insights section LLM failed: %s", e)
        if _use_llm_fallback(e):
            from app.graph.fallback_sections import build_fallback_sections, build_insights_fallback_only

            if state.get("performance_section") and state.get("behavioral_section"):
                logger.warning("Using insights-only rule fallback (keeping performance + behavioral LLM output)")
                return build_insights_fallback_only(state, reason=str(e))
            return build_fallback_sections(state, reason=str(e))
        raise RuntimeError(f"Insights section generation failed: {e}") from e


def safety_validator(state: dict[str, Any]) -> dict[str, Any]:
    flags = list(state.get("safety_flags") or [])
    flags.append("manager_review_required")
    if state.get("recommended_band") == "insufficient_data":
        flags.append("insufficient_data")
    band = state.get("recommended_band", "good")
    decision = {
        "decision": "grow" if band in ("strong", "exceptional") else "maintain",
        "reason": "Based on calibrated score, evidence strength, and AI analysis",
        "requiresManagerApproval": True,
    }
    return {**state, "safety_flags": flags, "final_decision": decision}


def format_output(state: dict[str, Any]) -> dict[str, Any]:
    emp = state.get("employee") or {}
    cycle = state.get("cycle") or {}
    perf = state.get("performance_section") or {}
    beh = state.get("behavioral_section") or {}
    ins = state.get("insights_section") or {}
    peer = state.get("peer_patterns") or ins.get("peerPatterns") or {}

    above_signals = perf.get("aboveRoleSignals") or [
        s.get("signal", "") for s in (state.get("above_role_signals") or []) if isinstance(s, dict)
    ]

    output = {
        "employeeId": emp.get("revieweeEmail", ""),
        "cycleId": cycle.get("id", "") if cycle else "",
        "recommendedBand": state.get("recommended_band"),
        "roleBasedScore": state.get("role_based_score"),
        "calibratedScore": state.get("calibrated_score"),
        "confidenceScore": state.get("confidence_score"),
        "evidenceStrength": state.get("evidence_strength"),
        "summary": perf.get("summary") or state.get("manager_summary", ""),
        "managerOnlySummary": perf.get("managerOnlySummary") or state.get("_manager_only_summary", ""),
        "employeeFacingSummary": perf.get("employeeFacingSummary") or state.get("employee_summary", ""),
        "strengths": state.get("strengths", []),
        "improvementAreas": state.get("improvement_areas", []),
        "aboveRoleSignals": above_signals,
        "riskPatterns": state.get("risk_patterns", []),
        "biasWarnings": state.get("bias_warnings", []),
        "missingEvidence": state.get("missing_evidence", []),
        "scoreInconsistencies": state.get("score_inconsistencies", []),
        "developmentPlan": state.get("development_plan", {}),
        "managerTalkingPoints": state.get("manager_talking_points", []),
        "finalDecisionRecommendation": state.get("final_decision", {}),
        "safetyFlags": state.get("safety_flags", []),
        "performanceSection": {
            **perf,
            "dimensionScores": state.get("dimension_aggregates") or {},
            "calibratedScore": state.get("calibrated_score"),
            "recommendedBand": state.get("recommended_band"),
        },
        "behavioralSection": beh,
        "insightsSection": {
            **ins,
            "peerPatterns": peer,
            "strengths": state.get("strengths", []),
            "riskPatterns": state.get("risk_patterns", []),
            "improvementAreas": state.get("improvement_areas", []),
            "biasWarnings": state.get("bias_warnings", []),
            "developmentPlan": state.get("development_plan", {}),
            "managerTalkingPoints": state.get("manager_talking_points", []),
        },
    }
    return {**state, "output": output}
