import json
from typing import Any, Iterator

from langgraph.graph import END, StateGraph

from app.graph import nodes
from app.graph.state import PerformanceEvaluationState

NODE_LABELS: dict[str, str] = {
    "load_context": "Loading employee context and role weights",
    "load_submissions": "Reviewing submissions in scope",
    "normalize": "Normalizing dimension scores",
    "evidence": "Extracting review evidence",
    "analyze_360": "Analyzing 360° feedback patterns",
    "bias": "Running bias checks",
    "above_role": "Detecting above-role signals",
    "risks": "Identifying risk patterns",
    "evidence_strength": "Calculating evidence strength",
    "calibrate": "Calibrating performance score",
    "ai_performance": "Generating Performance tab (AI)",
    "ai_behavioral": "Generating Behavioral tab (AI)",
    "ai_insights": "Generating AI Insights tab (AI)",
    "safety": "Running safety validation",
    "format": "Finalizing structured evaluation",
}

SECTION_BY_NODE: dict[str, str] = {
    "ai_performance": "performance",
    "ai_behavioral": "behavioral",
    "ai_insights": "insights",
}


def build_performance_graph():
    graph = StateGraph(PerformanceEvaluationState)

    graph.add_node("load_context", nodes.load_employee_context)
    graph.add_node("load_submissions", nodes.load_review_submissions)
    graph.add_node("normalize", nodes.normalize_scores)
    graph.add_node("evidence", nodes.extract_evidence)
    graph.add_node("analyze_360", nodes.analyze_360_feedback)
    graph.add_node("bias", nodes.detect_bias_and_language_risk)
    graph.add_node("above_role", nodes.detect_above_role_signals)
    graph.add_node("risks", nodes.detect_risk_patterns)
    graph.add_node("evidence_strength", nodes.calculate_evidence_strength)
    graph.add_node("calibrate", nodes.calibrate_score)
    graph.add_node("ai_performance", nodes.generate_performance_section_llm)
    graph.add_node("ai_behavioral", nodes.generate_behavioral_section_llm)
    graph.add_node("ai_insights", nodes.generate_insights_section_llm)
    graph.add_node("safety", nodes.safety_validator)
    graph.add_node("format", nodes.format_output)

    graph.set_entry_point("load_context")
    graph.add_edge("load_context", "load_submissions")
    graph.add_edge("load_submissions", "normalize")
    graph.add_edge("normalize", "evidence")
    graph.add_edge("evidence", "analyze_360")
    graph.add_edge("analyze_360", "bias")
    graph.add_edge("bias", "above_role")
    graph.add_edge("above_role", "risks")
    graph.add_edge("risks", "evidence_strength")
    graph.add_edge("evidence_strength", "calibrate")
    graph.add_edge("calibrate", "ai_performance")
    graph.add_edge("ai_performance", "ai_behavioral")
    graph.add_edge("ai_behavioral", "ai_insights")
    graph.add_edge("ai_insights", "safety")
    graph.add_edge("safety", "format")
    graph.add_edge("format", END)

    return graph.compile()


_performance_graph = None


def get_graph():
    global _performance_graph
    if _performance_graph is None:
        _performance_graph = build_performance_graph()
    return _performance_graph


def _initial_state(payload: dict) -> PerformanceEvaluationState:
    return {
        "employee": payload.get("employee", {}),
        "cycle": payload.get("cycle"),
        "submissions": payload.get("submissions", []),
    }


def run_evaluation(payload: dict) -> dict:
    result = get_graph().invoke(_initial_state(payload))
    return result.get("output", {})


def _section_payload(node: str, update: dict[str, Any]) -> dict[str, Any] | None:
    if node == "ai_performance":
        return update.get("performance_section")
    if node == "ai_behavioral":
        return update.get("behavioral_section")
    if node == "ai_insights":
        return update.get("insights_section")
    return None


def stream_evaluation(payload: dict) -> Iterator[dict[str, Any]]:
    """Yield SSE-friendly events for each LangGraph node and AI section."""
    graph = get_graph()
    initial = _initial_state(payload)

    yield {"event": "started", "message": "Evaluation pipeline started"}

    merged: dict[str, Any] = dict(initial)
    try:
        for chunk in graph.stream(initial, stream_mode="updates"):
            for node_name, update in chunk.items():
                merged.update(update)
                label = NODE_LABELS.get(node_name, node_name)
                yield {
                    "event": "node_complete",
                    "node": node_name,
                    "label": label,
                    "message": f"Completed: {label}",
                }

                section_key = SECTION_BY_NODE.get(node_name)
                section_data = _section_payload(node_name, update)
                if section_key and section_data:
                    yield {
                        "event": "section",
                        "section": section_key,
                        "data": section_data,
                        "message": f"{label} ready",
                    }

        final_output = merged.get("output") or {}
        yield {"event": "complete", "data": final_output, "message": "Evaluation complete"}
    except Exception as exc:
        yield {"event": "error", "message": str(exc)}
        raise


def format_sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event, default=str)}\n\n"
