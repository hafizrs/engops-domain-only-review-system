"""Evidence-based enrichment for Ollama — fills thin LLM output with submission narratives."""

from __future__ import annotations

import re
from typing import Any

from app.role_weights import DIMENSION_KEYS, DIMENSION_LABELS

_DIM_LABEL_SET = {v.lower() for v in DIMENSION_LABELS.values()}
_DIM_KEY_SET = set(DIMENSION_KEYS)


def _clean_option_text(text: str) -> str:
    t = (text or "").strip()
    if not t or t in ("—", "-"):
        return ""
    return t


def _parse_evidence_line(line: str) -> tuple[str, str]:
    """Return (dimension_label, option_text) from stored evidence string."""
    m = re.match(r"^\[([^\]]+)\]\s*(.+?)(?:\s*\(reviewer:[^)]+\))?\s*$", (line or "").strip())
    if not m:
        return "", (line or "").strip()
    return m.group(1).strip(), m.group(2).strip()


def collect_snippets(state: dict[str, Any]) -> list[dict[str, Any]]:
    """Gather scored option text from submissions (best source for narratives)."""
    out: list[dict[str, Any]] = []
    for sub in state.get("submissions") or []:
        reviewer = sub.get("reviewerName") or "Reviewer"
        for row in sub.get("responseDetails") or []:
            text = _clean_option_text(row.get("selectedOptionText", ""))
            if len(text) < 12:
                continue
            score = row.get("score", -1)
            if not isinstance(score, (int, float)) or score < 0:
                continue
            dim_key = row.get("dimensionKey") or ""
            dim_label = row.get("dimensionLabel") or DIMENSION_LABELS.get(dim_key, dim_key)
            out.append(
                {
                    "dimensionKey": dim_key,
                    "dimensionLabel": dim_label,
                    "text": text,
                    "score": float(score),
                    "reviewer": reviewer,
                }
            )
    return out


def _is_thin_line(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return True
    if t.lower() in ("none reported", "none", "n/a"):
        return True
    # bare dimension label or score only
    if t.lower() in _DIM_LABEL_SET or t.lower().replace(" ", "_") in _DIM_KEY_SET:
        return True
    if re.fullmatch(r"\d+(\.\d+)?", t):
        return True
    if re.fullmatch(r"\[[^\]]+\]\s*\d+(\.\d+)?", t):
        return True
    return False


def _is_thin_strength_title(title: str) -> bool:
    t = (title or "").strip()
    if not t or _is_thin_line(t):
        return True
    if t.lower() in _DIM_LABEL_SET:
        return True
    if t.startswith("Strong ") and t[7:].lower() in _DIM_LABEL_SET:
        return False  # acceptable fallback title
    return len(t) < 18


def _strengths_from_state(state: dict[str, Any]) -> list[dict[str, Any]]:
    agg = state.get("dimension_aggregates") or {}
    evidence = state.get("evidence") or []
    snippets = collect_snippets(state)
    high = sorted([s for s in snippets if s["score"] >= 4], key=lambda x: -x["score"])

    strengths: list[dict[str, Any]] = []
    seen_titles: set[str] = set()

    for snip in high[:4]:
        dim_key = snip["dimensionLabel"]
        for k, label in DIMENSION_LABELS.items():
            if label == snip["dimensionLabel"]:
                dim_key = k
                break
        title = f"Strong {snip['dimensionLabel']}" if snip["score"] >= 4.5 else snip["dimensionLabel"]
        if title in seen_titles:
            continue
        seen_titles.add(title)
        strengths.append(
            {
                "title": title,
                "evidence": [snip["text"]],
                "relatedDimensions": [snip["dimensionKey"]] if snip["dimensionKey"] else [],
            }
        )

    if not strengths:
        for key in DIMENSION_KEYS:
            if agg.get(key, 0) >= 3.8:
                title = f"Strong {DIMENSION_LABELS[key]}"
                if title in seen_titles:
                    continue
                seen_titles.add(title)
                strengths.append(
                    {
                        "title": title,
                        "evidence": evidence[:2] or [f"Average {agg.get(key)}/5 across reviewers"],
                        "relatedDimensions": [key],
                    }
                )

    if not strengths and evidence:
        for line in evidence[:3]:
            _, text = _parse_evidence_line(line)
            if text and not _is_thin_line(text):
                strengths.append({"title": text[:72], "evidence": [text], "relatedDimensions": []})

    return strengths[:4]


def _improvements_from_state(state: dict[str, Any]) -> list[dict[str, Any]]:
    agg = state.get("dimension_aggregates") or {}
    snippets = collect_snippets(state)
    low = sorted([s for s in snippets if s["score"] <= 2.5], key=lambda x: x["score"])

    improvements: list[dict[str, Any]] = []
    seen: set[str] = set()

    for snip in low[:3]:
        title = f"Improve {snip['dimensionLabel']}"
        if title in seen:
            continue
        seen.add(title)
        improvements.append(
            {
                "title": title,
                "evidence": [snip["text"]],
                "suggestedAction": f"Coaching and clearer goals on {snip['dimensionLabel'].lower()}",
            }
        )

    for key in DIMENSION_KEYS:
        val = agg.get(key, 0)
        if 0 < val < 3.2:
            title = f"Improve {DIMENSION_LABELS[key]}"
            if title in seen:
                continue
            seen.add(title)
            improvements.append(
                {
                    "title": title,
                    "evidence": [f"Average {val}/5 across reviewers"],
                    "suggestedAction": f"Pair with mentor on {DIMENSION_LABELS[key].lower()}",
                }
            )

    return improvements[:4]


def _achievements_from_state(state: dict[str, Any]) -> list[str]:
    snippets = collect_snippets(state)
    high = sorted([s for s in snippets if s["score"] >= 4], key=lambda x: -x["score"])
    lines = [s["text"] for s in high[:4] if s["text"] and not _is_thin_line(s["text"])]
    if lines:
        return lines

    for line in state.get("evidence") or []:
        _, text = _parse_evidence_line(line)
        if text and not _is_thin_line(text):
            lines.append(text)
        if len(lines) >= 3:
            break
    return lines[:4]


def _blockers_from_state(state: dict[str, Any]) -> list[str]:
    snippets = collect_snippets(state)
    low = sorted([s for s in snippets if s["score"] <= 2.5], key=lambda x: x["score"])
    lines = [s["text"] for s in low[:3] if s["text"]]
    if lines:
        return lines

    agg = state.get("dimension_aggregates") or {}
    for key in DIMENSION_KEYS:
        val = agg.get(key, 0)
        if 0 < val < 3.2:
            lines.append(f"Needs focus on {DIMENSION_LABELS[key]} (avg {val}/5)")
    return lines[:3]


def _peer_patterns_from_state(state: dict[str, Any]) -> dict[str, Any]:
    snippets = collect_snippets(state)
    positive = [s["text"] for s in sorted(snippets, key=lambda x: -x["score"]) if s["score"] >= 4][:4]
    negative = [s["text"] for s in sorted(snippets, key=lambda x: x["score"]) if s["score"] <= 2.5][:3]

    if not positive:
        for line in state.get("evidence") or []:
            _, text = _parse_evidence_line(line)
            if text and not _is_thin_line(text):
                positive.append(text)
            if len(positive) >= 3:
                break

    sentiment = "aligned"
    patterns = state.get("feedback_patterns") or {}
    if patterns.get("sentiment") == "mixed" or (patterns.get("score_spread") or 0) > 15:
        sentiment = "mixed"
    elif negative:
        sentiment = "mixed"
    elif positive:
        sentiment = "positive"

    return {"positive": positive[:4], "negative": negative[:3], "sentiment": sentiment}


def _development_plan_from_state(state: dict[str, Any], improvements: list[dict[str, Any]]) -> dict[str, Any]:
    focus = [i.get("title", "") for i in improvements if i.get("title")][:3]
    if not focus:
        agg = state.get("dimension_aggregates") or {}
        for key in DIMENSION_KEYS:
            if 0 < agg.get(key, 0) < 3.5:
                focus.append(f"Improve {DIMENSION_LABELS[key]}")
    if not focus:
        focus = ["Sustain current delivery and deepen technical impact"]

    primary = focus[0]
    emp = (state.get("employee") or {}).get("revieweeName", "Employee")
    return {
        "focusAreas": focus,
        "next30Days": [
            f"Review goals with manager on {primary.lower()}",
            "Pick one visible win to share with the team",
        ],
        "next60Days": [
            f"Show measurable progress on {primary.lower()}",
            "Seek feedback from a peer on collaboration habits",
        ],
        "next90Days": [
            "Re-check scores against role expectations",
            f"Discuss stretch scope for {emp} in next cycle",
        ],
        "recommendedTraining": [f"Workshop or pairing on {focus[0].lower()}"] if focus else [],
        "managerSupportNeeded": [
            "Manager validates evidence and agrees one priority focus",
            "Clear sprint goals and feedback cadence",
        ],
    }


def _talking_points_from_state(state: dict[str, Any], perf: dict[str, Any]) -> list[str]:
    emp = (state.get("employee") or {}).get("revieweeName", "Employee")
    band = (state.get("recommended_band") or "good").replace("_", " ")
    score = state.get("calibrated_score", 0)
    points = [
        f"{emp} is rated {band} ({score}%) based on reviewer submissions - walk through evidence together",
    ]
    achievements = perf.get("achievements") or _achievements_from_state(state)
    if achievements:
        points.append(f"Highlight strength: {achievements[0][:100]}")
    risks = state.get("risk_patterns") or []
    if risks:
        r0 = risks[0] if isinstance(risks[0], dict) else {}
        risk_text = r0.get("risk", "") if isinstance(r0, dict) else str(risks[0])
        if risk_text:
            points.append(f"Discuss risk: {risk_text}")
    missing = state.get("missing_evidence") or []
    if missing:
        points.append("Note limited review coverage — avoid over-interpreting thin evidence")
    points.append("Agree one development focus for the next quarter")
    return points[:5]


def enrich_performance_section(parsed: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    """Merge LLM performance JSON with evidence-backed achievements/blockers."""
    out = dict(parsed)
    achievements = _normalize_string_list(out.get("achievements"))
    blockers = _normalize_string_list(out.get("blockers"))

    if not achievements or all(_is_thin_line(a) for a in achievements):
        achievements = _achievements_from_state(state)
    else:
        achievements = [a for a in achievements if not _is_thin_line(a)] or _achievements_from_state(state)

    if not blockers:
        blockers = _blockers_from_state(state)

    out["achievements"] = achievements[:4]
    out["blockers"] = blockers[:3]

    summary = (out.get("summary") or "").strip()
    if len(summary) < 80:
        emp = (state.get("employee") or {}).get("revieweeName", "Employee")
        band = (state.get("recommended_band") or "good").replace("_", " ")
        score = state.get("calibrated_score", 0)
        n = len(state.get("submissions") or [])
        out["summary"] = (
            f"{emp} demonstrates {band} performance for their role (calibrated {score}%) "
            f"based on {n} reviewer submission(s). "
            + (achievements[0] if achievements else "Evidence supports consistent contribution.")
        )

    if not (out.get("employeeFacingSummary") or "").strip():
        out["employeeFacingSummary"] = (
            "You are performing well for your role. Your manager will review detailed feedback in your 1:1."
        )

    return out


def enrich_insights_section(parsed: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    """Fill gaps in insights JSON so UI matches Azure-quality depth."""
    out = dict(parsed)
    rule_strengths = _strengths_from_state(state)
    rule_improvements = _improvements_from_state(state)

    strengths = out.get("strengths") or []
    if not isinstance(strengths, list):
        strengths = []
    normalized_strengths: list[dict[str, Any]] = []
    for item in strengths:
        if isinstance(item, str):
            if not _is_thin_strength_title(item):
                normalized_strengths.append({"title": item, "evidence": [], "relatedDimensions": []})
        elif isinstance(item, dict):
            title = str(item.get("title") or item.get("name") or "")
            evidence = item.get("evidence") if isinstance(item.get("evidence"), list) else []
            if title and not _is_thin_strength_title(title):
                normalized_strengths.append(
                    {
                        "title": title,
                        "evidence": [str(e) for e in evidence if e],
                        "relatedDimensions": item.get("relatedDimensions") or [],
                    }
                )
            elif title and evidence:
                normalized_strengths.append(
                    {"title": f"Strong {title}" if title in _DIM_LABEL_SET else title, "evidence": evidence, "relatedDimensions": []}
                )

    thin_count = sum(1 for s in normalized_strengths if _is_thin_strength_title(s.get("title", "")))
    if not normalized_strengths or thin_count >= len(normalized_strengths):
        normalized_strengths = rule_strengths
    elif len(normalized_strengths) < 2:
        seen = {s["title"] for s in normalized_strengths}
        for rs in rule_strengths:
            if rs["title"] not in seen:
                normalized_strengths.append(rs)
            if len(normalized_strengths) >= 3:
                break

    risks = out.get("riskPatterns") or out.get("risk_patterns") or []
    if not risks:
        risks = state.get("risk_patterns") or []

    improvements = out.get("improvementAreas") or out.get("improvement_areas") or []
    if not isinstance(improvements, list) or len(improvements) < 1:
        improvements = rule_improvements

    peer = out.get("peerPatterns") or out.get("peer_patterns") or {}
    if not isinstance(peer, dict):
        peer = {}
    rule_peer = _peer_patterns_from_state(state)
    if not (peer.get("positive") or []):
        peer["positive"] = rule_peer["positive"]
    if not peer.get("sentiment"):
        peer["sentiment"] = rule_peer["sentiment"]
    if "negative" not in peer:
        peer["negative"] = rule_peer["negative"]

    dev_plan = out.get("developmentPlan") or out.get("development_plan") or {}
    if not isinstance(dev_plan, dict) or not any(
        dev_plan.get(k) for k in ("next30Days", "next60Days", "next90Days", "focusAreas")
    ):
        dev_plan = _development_plan_from_state(state, improvements if isinstance(improvements, list) else rule_improvements)

    talking = out.get("managerTalkingPoints") or out.get("manager_talking_points") or []
    if not isinstance(talking, list):
        talking = []
    talking = [str(t) for t in talking if t]
    if len(talking) < 3:
        perf = state.get("performance_section") or {}
        talking = _talking_points_from_state(state, perf)

    bias = out.get("biasWarnings") or out.get("bias_warnings") or state.get("bias_warnings") or []

    return {
        "strengths": normalized_strengths[:4],
        "riskPatterns": risks,
        "improvementAreas": improvements if isinstance(improvements, list) else rule_improvements,
        "peerPatterns": {
            "positive": _normalize_string_list(peer.get("positive")),
            "negative": _normalize_string_list(peer.get("negative")),
            "sentiment": str(peer.get("sentiment") or "mixed"),
        },
        "biasWarnings": bias if isinstance(bias, list) else [],
        "developmentPlan": dev_plan,
        "managerTalkingPoints": talking[:5],
    }


def _normalize_string_list(items: Any) -> list[str]:
    if not isinstance(items, list):
        return []
    return [str(i).strip() for i in items if i and str(i).strip()]
