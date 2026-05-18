export type RoleLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';
export type Track = 'frontend' | 'backend' | 'fullstack' | 'qa' | 'devops' | 'product' | 'design' | 'support' | 'other';
export type BehavioralProfile =
  | 'autonomous_executor'
  | 'guided_reliable'
  | 'collaborator'
  | 'crisis_anchor'
  | 'async_specialist'
  | 'steady_executor'
  | 'unknown';

export type PerformanceBand = 'exceptional' | 'strong' | 'good' | 'needs_focus' | 'at_risk' | 'insufficient_data';
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'unknown';
export type ReviewStepStatus = 'not_sent' | 'pending' | 'submitted' | 'overdue' | 'not_started' | 'draft' | 'approved';
export type AiAnalysisStatus = 'not_started' | 'processing' | 'completed' | 'failed';
export type FinalDecisionStatus = 'not_started' | 'in_review' | 'finalized';
export type CycleStatus = 'draft' | 'active' | 'collecting_feedback' | 'ai_processing' | 'manager_review' | 'finalized' | 'archived';
export type CycleType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'project_based' | 'probation' | 'promotion';

export type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  currentRoleLevel: RoleLevel;
  track: Track;
  managerId: string;
  managerName: string;
  skills: string[];
  behavioralProfile: BehavioralProfile;
  allocationPercent: number;
  employmentStatus: 'active' | 'inactive' | 'resigned';
};

export type ReviewCycle = {
  id: string;
  name: string;
  type: CycleType;
  periodStart: string;
  periodEnd: string;
  status: CycleStatus;
  targetEmployeeCount: number;
  dueDate: string;
  createdAt: string;
};

export type PeerReviewProgress = { total: number; pending: number; submitted: number; overdue: number };

export type EmployeePerformanceState = {
  id: string;
  employeeId: string;
  cycleId: string;
  employee: Employee;
  reviewStatus: {
    selfReview: ReviewStepStatus;
    peerReviews: PeerReviewProgress;
    managerReview: ReviewStepStatus;
    aiAnalysis: AiAnalysisStatus;
    finalDecision: FinalDecisionStatus;
  };
  scoreSummary: {
    rawScore: number | null;
    calibratedScore: number | null;
    roleBasedScore: number | null;
    confidenceScore: number | null;
    evidenceStrength: 'high' | 'medium' | 'low' | 'insufficient';
  };
  performanceBand: PerformanceBand;
  trend: { direction: TrendDirection; scoreChange: number | null };
  riskFlag: boolean;
  aboveRoleSignal: boolean;
  promotionReady: boolean;
  missingReviews: boolean;
  lastUpdatedAt: string;
};

export type AiEvaluationRecord = {
  id: string;
  employeeId: string;
  cycleId: string;
  recommendedBand: PerformanceBand;
  roleBasedScore: number;
  calibratedScore: number;
  confidenceScore: number;
  evidenceStrength: string;
  summary: string;
  managerOnlySummary: string;
  employeeFacingSummary: string;
  strengths: { title: string; evidence: string[] }[];
  improvementAreas: { title: string; evidence: string[]; suggestedAction: string }[];
  aboveRoleSignals: { signal: string; level: string; evidence: string[] }[];
  riskPatterns: { risk: string; severity: string; managerActionRequired: boolean }[];
  biasWarnings: { text: string; reason: string; suggestedRewrite: string }[];
  missingEvidence: string[];
  approvedByManager: boolean;
  approvedAt?: string;
};

export type AllocationRequest = {
  id: string;
  projectName: string;
  domain: string;
  complexity: 'low' | 'medium' | 'high';
  criticality: 'low' | 'medium' | 'high';
  timeline: 'normal' | 'aggressive' | 'critical';
  teamSizeRequired: number;
  status: 'draft' | 'ai_generated' | 'manager_review' | 'approved' | 'rejected';
  createdAt: string;
};

export type AllocationRecommendation = {
  requestId: string;
  teamCompositionSummary: string;
  recommendedEmployees: {
    employeeId: string;
    employeeName: string;
    fitScore: number;
    skillFit: number;
    behavioralFit: number;
    reason: string;
    risks: string[];
  }[];
  missingSkills: string[];
  aiConfidence: number;
};

export type PerformanceFilters = {
  cycleId: string;
  department: string;
  managerId: string;
  roleLevel: string;
  band: string;
  aiStatus: string;
  reviewGap: string;
  search: string;
};
