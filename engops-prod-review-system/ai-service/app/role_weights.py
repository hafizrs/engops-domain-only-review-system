"""Role-based dimension weights (5 review dimensions, must sum to 100)."""

DIMENSION_KEYS = [
    "technical_judgment",
    "delivery_execution",
    "quality",
    "communication",
    "ownership_growth",
]

DIMENSION_LABELS = {
    "technical_judgment": "Technical Judgment & Knowledge",
    "delivery_execution": "Delivery & Execution Discipline",
    "quality": "Quality & Maintainability",
    "communication": "Communication & Alignment",
    "ownership_growth": "Ownership, Teamwork & Growth",
}

# Weights sum to 100 per role. IC roles weight technical/quality over visibility (communication).
# Juniors: fundamentals (technical, delivery, quality) over ownership — growth is tracked, not the primary bar.
ROLE_WEIGHTS: dict[str, dict[str, int]] = {
    "junior": {
        "technical_judgment": 28,
        "delivery_execution": 24,
        "quality": 24,
        "communication": 8,
        "ownership_growth": 16,
    },
    "mid": {
        "technical_judgment": 24,
        "delivery_execution": 22,
        "quality": 22,
        "communication": 10,
        "ownership_growth": 22,
    },
    "senior": {
        "technical_judgment": 26,
        "delivery_execution": 20,
        "quality": 22,
        "communication": 12,
        "ownership_growth": 20,
    },
    "lead": {
        "technical_judgment": 22,
        "delivery_execution": 18,
        "quality": 18,
        "communication": 18,
        "ownership_growth": 24,
    },
    "manager": {
        "technical_judgment": 14,
        "delivery_execution": 18,
        "quality": 16,
        "communication": 26,
        "ownership_growth": 26,
    },
}


def weights_for_role(role: str) -> dict[str, int]:
    return ROLE_WEIGHTS.get(role, ROLE_WEIGHTS["mid"])
