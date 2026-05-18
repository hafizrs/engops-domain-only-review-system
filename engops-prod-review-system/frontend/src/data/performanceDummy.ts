import type {
  AiEvaluationRecord,
  AllocationRecommendation,
  AllocationRequest,
  Employee,
  EmployeePerformanceState,
  PerformanceBand,
  ReviewCycle,
  RoleLevel,
  Track,
} from '../types/performance';

const FIRST = ['James', 'Sarah', 'Priya', 'Hafiz', 'Alex', 'Maria', 'David', 'Emma', 'Omar', 'Lisa', 'Raj', 'Nina', 'Chris', 'Aisha', 'Tom'];
const LAST = ['Chen', 'Rahman', 'Nair', 'Okonkwo', 'Patel', 'Kim', 'Garcia', 'Wilson', 'Hassan', 'Nguyen', 'Singh', 'Brown', 'Lee', 'Ali', 'Martin'];
const DEPTS = ['Engineering', 'Platform', 'Product Engineering', 'QA', 'DevOps', 'Design'];
const TRACKS: Track[] = ['frontend', 'backend', 'fullstack', 'qa', 'devops', 'product', 'design'];
const ROLES: RoleLevel[] = ['junior', 'mid', 'senior', 'lead', 'manager'];
const BANDS: PerformanceBand[] = ['exceptional', 'strong', 'good', 'needs_focus', 'at_risk', 'insufficient_data'];
const BEHAVIORS = [
  'autonomous_executor',
  'guided_reliable',
  'collaborator',
  'crisis_anchor',
  'async_specialist',
  'steady_executor',
] as const;

export const ACTIVE_CYCLE_ID = 'cycle-q2-2026';

export const DUMMY_REVIEW_CYCLES: ReviewCycle[] = [
  {
    id: ACTIVE_CYCLE_ID,
    name: 'Q2 2026 Engineering Performance Review',
    type: 'quarterly',
    periodStart: '2026-04-01',
    periodEnd: '2026-06-30',
    status: 'collecting_feedback',
    targetEmployeeCount: 100,
    dueDate: '2026-06-15',
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'cycle-q1-2026',
    name: 'Q1 2026 Engineering Performance Review',
    type: 'quarterly',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    status: 'finalized',
    targetEmployeeCount: 98,
    dueDate: '2026-03-20',
    createdAt: '2025-12-15T09:00:00Z',
  },
  {
    id: 'cycle-prob-2026',
    name: 'Probation Reviews · H1 2026',
    type: 'probation',
    periodStart: '2026-01-15',
    periodEnd: '2026-07-15',
    status: 'active',
    targetEmployeeCount: 12,
    dueDate: '2026-07-01',
    createdAt: '2026-01-10T08:00:00Z',
  },
];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateEmployees(count = 100): Employee[] {
  const managers: Employee[] = [];
  for (let m = 0; m < 8; m++) {
    const id = `mgr-${m + 1}`;
    managers.push({
      id,
      employeeCode: `EO-M${100 + m}`,
      fullName: `${pick(FIRST, m)} ${pick(LAST, m + 3)}`,
      email: `manager${m + 1}@selisegroup.com`,
      department: pick(DEPTS, m),
      designation: 'Engineering Manager',
      currentRoleLevel: 'manager',
      track: 'other',
      managerId: 'admin-1',
      managerName: 'EngOps Admin',
      skills: ['leadership', 'delivery', 'hiring'],
      behavioralProfile: 'collaborator',
      allocationPercent: 90,
      employmentStatus: 'active',
    });
  }

  const employees: Employee[] = [...managers];
  for (let i = 0; i < count - managers.length; i++) {
    const r = seededRand(i + 42);
    const role = pick(ROLES, Math.floor(r * 10) % 4);
    const mgr = pick(managers, i % managers.length);
    const fn = pick(FIRST, i);
    const ln = pick(LAST, i + 5);
    employees.push({
      id: `emp-${String(i + 1).padStart(3, '0')}`,
      employeeCode: `EO-${2000 + i}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@selisegroup.com`,
      department: pick(DEPTS, i),
      designation:
        role === 'junior'
          ? 'Junior Engineer'
          : role === 'mid'
            ? 'Software Engineer'
            : role === 'senior'
              ? 'Senior Engineer'
              : role === 'lead'
                ? 'Tech Lead'
                : 'Staff Engineer',
      currentRoleLevel: role,
      track: pick(TRACKS, i),
      managerId: mgr.id,
      managerName: mgr.fullName,
      skills: [pick(TRACKS, i), pick(['typescript', 'react', 'nestjs', 'python', 'aws'], i), 'agile'].filter(
        (v, idx, a) => a.indexOf(v) === idx
      ),
      behavioralProfile: pick([...BEHAVIORS], i),
      allocationPercent: 60 + Math.floor(seededRand(i) * 40),
      employmentStatus: i === 97 ? 'resigned' : 'active',
    });
  }
  return employees;
}

export const DUMMY_EMPLOYEES = generateEmployees(100);

function buildPerformanceState(emp: Employee, cycleId: string, seed: number): EmployeePerformanceState {
  const r = seededRand(seed);
  const peerTotal = 3 + Math.floor(r * 3);
  const peerSubmitted = Math.floor(peerTotal * (0.3 + r * 0.7));
  const peerOverdue = Math.max(0, peerTotal - peerSubmitted - Math.floor((1 - r) * 2));
  const peerPending = Math.max(0, peerTotal - peerSubmitted - peerOverdue);

  const selfStatuses = ['submitted', 'pending', 'overdue', 'not_sent'] as const;
  const mgrStatuses = ['submitted', 'draft', 'not_started', 'approved'] as const;
  const aiStatuses = ['completed', 'processing', 'not_started', 'failed'] as const;
  const finalStatuses = ['finalized', 'in_review', 'not_started'] as const;

  const selfReview = pick(selfStatuses, Math.floor(r * 10));
  const managerReview = pick(mgrStatuses, Math.floor(r * 20));
  const aiAnalysis = pick(aiStatuses, Math.floor(r * 30));
  const finalDecision = pick(finalStatuses, Math.floor(r * 40));

  const hasScore = selfReview === 'submitted' && peerSubmitted >= 2;
  const rawScore = hasScore ? Math.round(55 + r * 40) : null;
  const calibratedScore = hasScore && aiAnalysis === 'completed' ? Math.round((rawScore ?? 0) + (r - 0.5) * 8) : rawScore;
  const band = !hasScore
    ? 'insufficient_data'
    : pick(BANDS, Math.floor((calibratedScore ?? 70) / 20));

  const riskFlag = band === 'at_risk' || band === 'needs_focus' || peerOverdue > 1;
  const aboveRoleSignal = (calibratedScore ?? 0) >= 88 && emp.currentRoleLevel !== 'lead' && emp.currentRoleLevel !== 'manager';
  const promotionReady = aboveRoleSignal && band === 'exceptional';
  const missingReviews = peerPending > 0 || selfReview === 'pending' || selfReview === 'overdue';

  return {
    id: `ps-${emp.id}-${cycleId}`,
    employeeId: emp.id,
    cycleId,
    employee: emp,
    reviewStatus: {
      selfReview,
      peerReviews: { total: peerTotal, pending: peerPending, submitted: peerSubmitted, overdue: peerOverdue },
      managerReview,
      aiAnalysis,
      finalDecision,
    },
    scoreSummary: {
      rawScore,
      calibratedScore,
      roleBasedScore: rawScore,
      confidenceScore: hasScore ? Math.round(60 + r * 35) : null,
      evidenceStrength: !hasScore ? 'insufficient' : peerSubmitted >= 3 ? 'high' : peerSubmitted >= 2 ? 'medium' : 'low',
    },
    performanceBand: band,
    trend: {
      direction: pick(['improving', 'stable', 'declining', 'unknown'], Math.floor(r * 4)),
      scoreChange: hasScore ? Math.round((r - 0.5) * 12) : null,
    },
    riskFlag,
    aboveRoleSignal,
    promotionReady,
    missingReviews,
    lastUpdatedAt: new Date(Date.now() - Math.floor(r * 14 * 86400000)).toISOString(),
  };
}

export const DUMMY_PERFORMANCE_STATES: EmployeePerformanceState[] = DUMMY_EMPLOYEES.filter(
  (e) => e.employmentStatus === 'active' || e.id.startsWith('emp-')
).map((emp, i) => buildPerformanceState(emp, ACTIVE_CYCLE_ID, i + 1));

export function getPerformanceState(employeeId: string, cycleId: string): EmployeePerformanceState | undefined {
  return DUMMY_PERFORMANCE_STATES.find((s) => s.employeeId === employeeId && s.cycleId === cycleId);
}

export function getEmployee(id: string): Employee | undefined {
  return DUMMY_EMPLOYEES.find((e) => e.id === id);
}

export function getDashboardKpis(states: EmployeePerformanceState[]) {
  const active = states.filter((s) => s.employee.employmentStatus === 'active');
  return {
    total: active.length,
    reviewsCompleted: active.filter(
      (s) =>
        s.reviewStatus.selfReview === 'submitted' &&
        s.reviewStatus.managerReview === 'submitted' &&
        s.reviewStatus.peerReviews.submitted >= s.reviewStatus.peerReviews.total - 1
    ).length,
    pendingReviews: active.filter((s) => s.missingReviews).length,
    aiCompleted: active.filter((s) => s.reviewStatus.aiAnalysis === 'completed').length,
    atRisk: active.filter((s) => s.performanceBand === 'at_risk' || s.performanceBand === 'needs_focus').length,
    promotionReady: active.filter((s) => s.promotionReady).length,
    insufficientData: active.filter((s) => s.performanceBand === 'insufficient_data').length,
  };
}

export function getSampleAiEvaluation(employeeId: string, cycleId: string): AiEvaluationRecord {
  const emp = getEmployee(employeeId);
  const state = getPerformanceState(employeeId, cycleId);
  return {
    id: `ai-${employeeId}-${cycleId}`,
    employeeId,
    cycleId,
    recommendedBand: state?.performanceBand ?? 'good',
    roleBasedScore: state?.scoreSummary.roleBasedScore ?? 72,
    calibratedScore: state?.scoreSummary.calibratedScore ?? 74,
    confidenceScore: state?.scoreSummary.confidenceScore ?? 68,
    evidenceStrength: state?.scoreSummary.evidenceStrength ?? 'medium',
    summary: `${emp?.fullName ?? 'Employee'} shows consistent delivery for their ${emp?.currentRoleLevel ?? 'current'} role with peer alignment on collaboration.`,
    managerOnlySummary:
      'Risk: one overdue peer review. Score-evidence alignment is medium. No validated severe incidents. Reviewer spread within acceptable range.',
    employeeFacingSummary:
      'You are meeting expectations for your role. Peers highlight reliable delivery and clear communication. Focus areas: estimation discipline and proactive stakeholder updates.',
    strengths: [
      { title: 'Delivery reliability', evidence: ['Manager review Q2', '2 peer submissions'] },
      { title: 'Collaboration', evidence: ['360 feedback themes'] },
    ],
    improvementAreas: [
      {
        title: 'Estimation discipline',
        evidence: ['Manager note on sprint planning'],
        suggestedAction: 'Pair with tech lead on breakdown for next epic',
      },
    ],
    aboveRoleSignals: state?.aboveRoleSignal
      ? [{ signal: 'Mentoring juniors informally', level: 'emerging', evidence: ['Peer comment'] }]
      : [],
    riskPatterns: state?.riskFlag
      ? [{ risk: 'Incomplete peer coverage', severity: 'medium', managerActionRequired: true }]
      : [],
    biasWarnings: [],
    missingEvidence: state?.missingReviews ? ['Pending peer review #2'] : [],
    approvedByManager: state?.reviewStatus.finalDecision === 'finalized',
    approvedAt: state?.reviewStatus.finalDecision === 'finalized' ? '2026-05-10T12:00:00Z' : undefined,
  };
}

export const DUMMY_ALLOCATION_REQUESTS: AllocationRequest[] = [
  {
    id: 'alloc-req-1',
    projectName: 'EngOps Platform v2',
    domain: 'fullstack',
    complexity: 'high',
    criticality: 'high',
    timeline: 'aggressive',
    teamSizeRequired: 4,
    status: 'ai_generated',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'alloc-req-2',
    projectName: 'Client Portal Maintenance',
    domain: 'frontend',
    complexity: 'low',
    criticality: 'medium',
    timeline: 'normal',
    teamSizeRequired: 2,
    status: 'draft',
    createdAt: '2026-05-12T14:00:00Z',
  },
];

export const DUMMY_ALLOCATION_RECOMMENDATIONS: Record<string, AllocationRecommendation> = {
  'alloc-req-1': {
    requestId: 'alloc-req-1',
    teamCompositionSummary:
      'Senior-led squad with crisis-capable backend and collaborative mid frontend. Behavioral fit prioritized over raw skill match.',
    recommendedEmployees: DUMMY_EMPLOYEES.filter((e) => e.currentRoleLevel === 'senior' || e.currentRoleLevel === 'lead')
      .slice(0, 4)
      .map((e, i) => ({
        employeeId: e.id,
        employeeName: e.fullName,
        fitScore: 92 - i * 4,
        skillFit: 88 - i * 3,
        behavioralFit: 90 - i * 2,
        reason: i === 0 ? 'Strong ownership + prior platform work' : 'Skill + availability match',
        risks: i === 2 ? ['Currently at 95% allocation'] : [],
      })),
    missingSkills: ['LangGraph experience'],
    aiConfidence: 78,
  },
};

export const BAND_LABELS: Record<PerformanceBand, string> = {
  exceptional: 'Exceptional',
  strong: 'Strong',
  good: 'Good',
  needs_focus: 'Needs focus',
  at_risk: 'At risk',
  insufficient_data: 'Insufficient data',
};

export const BAND_BADGE: Record<PerformanceBand, string> = {
  exceptional: 'bp',
  strong: 'bg',
  good: 'bt',
  needs_focus: 'ba',
  at_risk: 'br',
  insufficient_data: 'bb',
};

export const ROLE_LABELS: Record<RoleLevel, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
  manager: 'Manager',
};
