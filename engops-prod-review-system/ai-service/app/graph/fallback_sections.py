"""Rule-based section builder when local Ollama is too slow or times out."""

from __future__ import annotations

from typing import Any

from app.role_weights import DIMENSION_KEYS, DIMENSION_LABELS


def build_fallback_sections(state: dict[str, Any], *, reason: str) -> dict[str, Any]:
    emp = state.get("employee") or {}
    name = emp.get("revieweeName", "Employee")
    role = emp.get("currentRoleLevel", "mid")
    band = state.get("recommended_band", "good")
    score = state.get("calibrated_score", 0)
    n = len(state.get("submissions") or [])
    agg = state.get("dimension_aggregates") or {}
    evidence = (state.get("evidence") or [])[:4]

    summary = (
        f"{name} is rated {band.replace('_', ' ')} for {role} role "
        f"(score {score}) from {n} submission(s). "
        f"Evidence strength: {state.get('evidence_strength', 'moderate')}. "
        "Draft for manager review."
    )
    employee_summary = (
        f"You are performing at {band.replace('_', ' ')} level for your role. "
        "Your manager will review detailed feedback in your 1:1."
    )
    manager_only = (
        f"Rule-based draft (LLM unavailable: {reason}). "
        f"Confidence {state.get('confidence_score', 0)}%. "
        "Manager must validate before sharing."
    )

    strengths = []
    for key in DIMENSION_KEYS:
        if agg.get(key, 0) >= 3.8:
            strengths.append(
                {
                    "title": f"Strong {DIMENSION_LABELS[key]}",
                    "evidence": evidence[:2] or [f"Average {agg.get(key)}/5"],
                    "relatedDimensions": [key],
                }
            )
    if not strengths:
        strengths = [{"title": "Meets core expectations", "evidence": evidence[:2], "relatedDimensions": []}]

    improvements = []
    for key in DIMENSION_KEYS:
        val = agg.get(key, 0)
        if 0 < val < 3.2:
            improvements.append(
                {
                    "title": f"Improve {DIMENSION_LABELS[key]}",
                    "evidence": [f"Average {val}/5"],
                    "suggestedAction": f"Coaching on {DIMENSION_LABELS[key]}",
                }
            )

    profile = "technical_specialist" if agg.get("technical_judgment", 0) >= 4 and agg.get("communication", 5) < 3.2 else "collaborator"

    performance_section = {
        "summary": summary,
        "employeeFacingSummary": employee_summary,
        "managerOnlySummary": manager_only,
        "dimensionNarratives": {
            k: f"{DIMENSION_LABELS[k]}: average {agg.get(k, 0)}/5 from reviewer submissions."
            for k in DIMENSION_KEYS
        },
        "achievements": [s["title"] for s in strengths[:3]],
        "blockers": [],
        "aboveRoleSignal": "none",
        "aboveRoleSignals": [],
        "trend": "stable",
        "trendRationale": "Based on current submission scores",
        "teamContext": f"Evaluated against {role} expectations with {n} reviewer input(s).",
    }

    behavioral_section = {
        "behavioralProfile": profile,
        "behavioralLabel": profile.replace("_", " ").title(),
        "behavioralSummary": f"{name} shows a {profile.replace('_', ' ')} working style based on review patterns.",
        "placementNotes": "Best on structured delivery work with clear goals.",
        "bestForProjects": ["Feature delivery", "Maintenance", "Bug fixing"],
        "workingStyleTraits": ["Task-focused", "Team-oriented"],
    }

    insights_section = {
        "strengths": strengths,
        "riskPatterns": state.get("risk_patterns") or [],
        "improvementAreas": improvements,
        "peerPatterns": {"positive": [], "negative": [], "sentiment": "mixed"},
        "biasWarnings": state.get("bias_warnings") or [],
        "developmentPlan": {
            "focusAreas": [i["title"] for i in improvements[:3]],
            "next30Days": ["Review goals with manager"],
            "next60Days": ["Show progress on top improvement area"],
            "next90Days": ["Re-check against role expectations"],
            "recommendedTraining": [],
            "managerSupportNeeded": ["Manager validates evidence"],
        },
        "managerTalkingPoints": [
            "Review calibrated score and band",
            "Agree one development focus",
            "Confirm employee-facing summary",
        ],
    }

    return _attach_sections(
        state,
        performance_section=performance_section,
        behavioral_section=behavioral_section,
        insights_section=insights_section,
        strengths=strengths,
        improvements=improvements,
        summary=summary,
        employee_summary=employee_summary,
        manager_only=manager_only,
        mark_full_fallback=True,
    )


def build_insights_fallback_only(state: dict[str, Any], *, reason: str) -> dict[str, Any]:
    """Keep existing performance/behavioral LLM output; fill insights from rules."""
    base = build_fallback_sections(state, reason=reason)
    insights_section = base["insights_section"]
    return {
        **state,
        "insights_section": insights_section,
        "strengths": base.get("strengths") or [],
        "improvement_areas": base.get("improvement_areas") or [],
        "risk_patterns": insights_section.get("riskPatterns") or state.get("risk_patterns") or [],
        "bias_warnings": insights_section.get("biasWarnings") or state.get("bias_warnings") or [],
        "development_plan": insights_section.get("developmentPlan") or {},
        "manager_talking_points": insights_section.get("managerTalkingPoints") or [],
        "peer_patterns": insights_section.get("peerPatterns") or {},
    }


def _attach_sections(
    state: dict[str, Any],
    *,
    performance_section: dict,
    behavioral_section: dict,
    insights_section: dict,
    strengths: list,
    improvements: list,
    summary: str,
    employee_summary: str,
    manager_only: str,
    mark_full_fallback: bool,
) -> dict[str, Any]:
    out = {
        **state,
        "performance_section": performance_section,
        "behavioral_section": behavioral_section,
        "insights_section": insights_section,
        "strengths": strengths,
        "improvement_areas": improvements,
        "risk_patterns": insights_section["riskPatterns"],
        "bias_warnings": insights_section["biasWarnings"],
        "development_plan": insights_section["developmentPlan"],
        "manager_talking_points": insights_section["managerTalkingPoints"],
        "manager_summary": summary,
        "employee_summary": employee_summary,
        "_manager_only_summary": manager_only,
    }
    if mark_full_fallback:
        out["_llm_fallback_used"] = True
    return out
