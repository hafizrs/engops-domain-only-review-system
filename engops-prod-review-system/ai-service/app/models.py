from typing import Any, Optional

from pydantic import BaseModel, Field


class EmployeeInput(BaseModel):
    revieweeName: str
    revieweeEmail: str
    currentRoleLevel: str = "mid"
    track: str = "fullstack"


class CycleInput(BaseModel):
    id: str
    name: str


class DimensionScoreInput(BaseModel):
    dimensionKey: str
    dimensionLabel: str
    averageOutOf5: float = 0
    percentOfScale: float = 0


class ResponseDetailInput(BaseModel):
    dimensionKey: str
    dimensionLabel: str
    questionText: str
    score: int = -1
    selectedOptionText: str = ""


class SubmissionInput(BaseModel):
    id: str
    formCode: str
    formTitle: str
    reviewerName: str
    reviewerEmail: str
    totalScore: float = 0
    submittedAt: str
    dimensionScores: list[DimensionScoreInput] = Field(default_factory=list)
    responseDetails: list[ResponseDetailInput] = Field(default_factory=list)


class EvaluateRequest(BaseModel):
    employee: EmployeeInput
    cycle: Optional[CycleInput] = None
    submissions: list[SubmissionInput] = Field(default_factory=list)


class StrengthItem(BaseModel):
    title: str
    evidence: list[str] = Field(default_factory=list)
    relatedDimensions: list[str] = Field(default_factory=list)


class ImprovementItem(BaseModel):
    title: str
    evidence: list[str] = Field(default_factory=list)
    suggestedAction: str = ""


class AboveRoleItem(BaseModel):
    signal: str
    level: str = "emerging"
    evidence: list[str] = Field(default_factory=list)


class RiskItem(BaseModel):
    risk: str
    severity: str = "medium"
    evidence: list[str] = Field(default_factory=list)
    managerActionRequired: bool = True


class BiasWarning(BaseModel):
    text: str
    reason: str
    suggestedRewrite: str = ""


class DevelopmentPlan(BaseModel):
    focusAreas: list[str] = Field(default_factory=list)
    next30Days: list[str] = Field(default_factory=list)
    next60Days: list[str] = Field(default_factory=list)
    next90Days: list[str] = Field(default_factory=list)
    recommendedTraining: list[str] = Field(default_factory=list)
    managerSupportNeeded: list[str] = Field(default_factory=list)


class FinalDecisionRecommendation(BaseModel):
    decision: str = "maintain"
    reason: str = ""
    requiresManagerApproval: bool = True


class EvaluateResponse(BaseModel):
    employeeId: str = ""
    cycleId: str = ""
    recommendedBand: str
    roleBasedScore: float
    calibratedScore: float
    confidenceScore: float
    evidenceStrength: str
    summary: str
    managerOnlySummary: str
    employeeFacingSummary: str
    strengths: list[StrengthItem]
    improvementAreas: list[ImprovementItem]
    aboveRoleSignals: list[AboveRoleItem]
    riskPatterns: list[RiskItem]
    biasWarnings: list[BiasWarning]
    missingEvidence: list[str]
    scoreInconsistencies: list[str]
    developmentPlan: DevelopmentPlan
    managerTalkingPoints: list[str]
    finalDecisionRecommendation: FinalDecisionRecommendation
    safetyFlags: list[str]
