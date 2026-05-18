from typing import Any, Optional, TypedDict


class PerformanceEvaluationState(TypedDict, total=False):
    employee: dict[str, Any]
    cycle: Optional[dict[str, Any]]
    submissions: list[dict[str, Any]]
    role_weights: dict[str, int]
    normalized_scores: dict[str, float]
    dimension_aggregates: dict[str, float]
    evidence: list[str]
    feedback_patterns: dict[str, Any]
    bias_warnings: list[dict[str, Any]]
    risk_patterns: list[dict[str, Any]]
    above_role_signals: list[dict[str, Any]]
    role_based_score: float
    calibrated_score: float
    recommended_band: str
    confidence_score: float
    evidence_strength: str
    missing_evidence: list[str]
    score_inconsistencies: list[str]
    performance_section: dict[str, Any]
    behavioral_section: dict[str, Any]
    insights_section: dict[str, Any]
    peer_patterns: dict[str, Any]
    manager_summary: str
    employee_summary: str
    strengths: list[dict[str, Any]]
    improvement_areas: list[dict[str, Any]]
    development_plan: dict[str, Any]
    manager_talking_points: list[str]
    final_decision: dict[str, Any]
    safety_flags: list[str]
    output: dict[str, Any]
