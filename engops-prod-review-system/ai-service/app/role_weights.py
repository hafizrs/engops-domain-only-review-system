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

# Equal weights for all roles until per-role scaling is configured.
_EQUAL_WEIGHTS: dict[str, int] = {key: 20 for key in DIMENSION_KEYS}

ROLE_WEIGHTS: dict[str, dict[str, int]] = {
    role: dict(_EQUAL_WEIGHTS)
    for role in ("junior", "mid", "senior", "lead", "manager")
}


def weights_for_role(role: str) -> dict[str, int]:
    return ROLE_WEIGHTS.get(role, ROLE_WEIGHTS["mid"])
