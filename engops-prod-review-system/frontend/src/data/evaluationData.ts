import { PERFORMANCE_DIMENSION_KEYS } from '../dims';
import {
  RECOMMENDED_BAND_LABELS,
  type AiEvaluationRecord,
  type BehavioralProfile,
  type DimensionScores,
  type EmployeeRole,
} from '../types/aiEvaluation';

export type ReviewFormRef = {
  id: string;
  code: string;
  title: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  submissionCount: number;
};

export type SubmissionDimensionScore = {
  dimensionKey: string;
  averageOutOf5?: number;
};

export type SubmissionRef = {
  id: string;
  formId: string;
  formCode: string;
  formTitle: string;
  reviewerName: string;
  reviewerEmail: string;
  revieweeName: string;
  revieweeEmail?: string;
  totalScore: number;
  submittedAt: string;
  answersPreview: string;
  dimensionScores?: SubmissionDimensionScore[];
};

export type EvaluationConfig = {
  selectedFormIds: string[];
  dateFrom: string;
  dateTo: string;
};

export type AiEvalStatus = 'not_generated' | 'generated' | 'approved' | 'override';

export type StoredAiEvaluation = {
  evaluationId: string;
  employeeKey: string;
  revieweeName?: string;
  revieweeEmail?: string;
  status: AiEvalStatus;
  generatedAt?: string;
  approvedAt?: string;
  includedSubmissionIds: string[];
  sourceFormCodes: string[];
  aiSummary?: string;
  aiStrengths?: string[];
  aiRisks?: string[];
  aiBiasFlags?: AiEvaluationRecord['aiBiasFlags'];
  aiDevelopmentPlan?: string[];
  aiTalkingPoints?: string[];
  employeeFacingSummary?: string;
  managerNote?: string;
  calibratedScore?: number;
  roleBasedScore?: number;
  recommendedBand?: string;
  evidenceStrength?: string;
  aboveRoleSignals?: string[];
  achievements?: string[];
  improvementAreas?: string[];
  performanceSection?: Record<string, unknown>;
  behavioralSection?: Record<string, unknown>;
  insightsSection?: Record<string, unknown>;
};

export type StreamProgressItem = {
  node: string;
  label: string;
  done: boolean;
  active: boolean;
};

const BEHAVIORAL_KEYS = new Set([
  'autonomous_executor',
  'guided_reliable',
  'collaborator',
  'crisis_anchor',
  'async_specialist',
  'steady_executor',
  'technical_specialist',
  'quiet_contributor',
  'process_champion',
]);

function parseBehavioralProfile(v?: string): BehavioralProfile {
  if (v && BEHAVIORAL_KEYS.has(v)) return v as BehavioralProfile;
  return 'collaborator';
}

function parseAboveRoleSignal(v?: string): AiEvaluationRecord['aboveRoleSignal'] {
  const allowed = new Set(['none', 'emerging', 'consistent', 'strong']);
  if (v && allowed.has(v)) return v as AiEvaluationRecord['aboveRoleSignal'];
  return 'none';
}

function parseTrend(v?: string): AiEvaluationRecord['trend'] {
  if (v === 'up' || v === 'down' || v === 'stable') return v;
  return 'stable';
}

export type ScopedEmployee = AiEvaluationRecord & {
  employeeKey: string;
  submissionIds: string[];
  submissionCount: number;
  avgSubmissionScore: number;
  formsInvolved: string[];
  storedEval?: StoredAiEvaluation;
};

export const DEFAULT_EVAL_CONFIG: EvaluationConfig = {
  selectedFormIds: [],
  dateFrom: '',
  dateTo: '',
};

export function sortReviewFormsByCreatedDesc(forms: ReviewFormRef[]): ReviewFormRef[] {
  return [...forms].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export function employeeKey(name: string, email?: string) {
  const e = (email || name).trim().toLowerCase();
  return e.includes('@') ? e : name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function filterSubmissionsByConfig(
  submissions: SubmissionRef[],
  config: EvaluationConfig,
  forms: ReviewFormRef[]
): SubmissionRef[] {
  if (!config.selectedFormIds.length) return [];

  const selectedCodes = new Set(
    forms.filter((f) => config.selectedFormIds.includes(f.id)).map((f) => f.code)
  );

  const fromMs = config.dateFrom ? new Date(config.dateFrom).getTime() : null;
  const toMs = config.dateTo ? new Date(config.dateTo + 'T23:59:59').getTime() : null;

  return submissions.filter((s) => {
    if (!selectedCodes.has(s.formCode)) return false;
    const t = new Date(s.submittedAt).getTime();
    if (fromMs != null && t < fromMs) return false;
    if (toMs != null && t > toMs) return false;
    return true;
  });
}

function parseRole(role?: string): EmployeeRole {
  const r = (role ?? 'mid').toLowerCase();
  if (r === 'junior' || r === 'mid' || r === 'senior' || r === 'lead' || r === 'manager') return r;
  return 'mid';
}

function avgDimensionScores(subs: SubmissionRef[]): DimensionScores {
  const sums: Partial<Record<string, number>> = {};
  const counts: Partial<Record<string, number>> = {};
  for (const s of subs) {
    for (const d of s.dimensionScores ?? []) {
      if (d.averageOutOf5 == null) continue;
      sums[d.dimensionKey] = (sums[d.dimensionKey] ?? 0) + d.averageOutOf5;
      counts[d.dimensionKey] = (counts[d.dimensionKey] ?? 0) + 1;
    }
  }
  const scores = {} as DimensionScores;
  for (const key of PERFORMANCE_DIMENSION_KEYS) {
    const n = counts[key];
    scores[key] = n ? Math.round(((sums[key] ?? 0) / n) * 10) / 10 : 3;
  }
  return scores;
}

function scoreToBand(avg: number): AiEvaluationRecord['performanceBand'] {
  if (avg >= 85) return 'Excellent';
  if (avg >= 70) return 'Good';
  if (avg >= 55) return 'Needs Focus';
  return 'At Risk';
}

function buildBaseEmployee(
  key: string,
  subs: SubmissionRef[],
  forms: ReviewFormRef[]
): AiEvaluationRecord {
  const first = subs[0];
  const email = (first.revieweeEmail || '').trim().toLowerCase();
  const avg = Math.round(subs.reduce((a, s) => a + s.totalScore, 0) / subs.length);
  const formRole = forms.find((f) => subs.some((s) => s.formCode === f.code))?.role;
  const managerScores = avgDimensionScores(subs);

  return {
    employeeId: key,
    employeeName: first.revieweeName,
    email: email || `${key}@unknown.local`,
    title: 'Engineer',
    department: 'Engineering',
    tenure: '—',
    techStack: [],
    role: parseRole(formRole),
    reviewPeriod: 'Current scope',
    behavioralProfile: 'collaborator',
    behavioralLabel: 'Collaborator',
    behavioralSummary: 'Derived from submission evidence; behavioral profile will refine with more AI signals.',
    aboveRoleSignal: 'none',
    managerScores,
    rawScore: avg,
    calibratedScore: avg,
    performanceBand: scoreToBand(avg),
    teamAverage: avg,
    roleAverage: avg,
    trend: 'stable',
    aiSummary: '',
    aiStrengths: [],
    aiRisks: [],
    aiBiasFlags: [],
    aiDevelopmentPlan: [],
    aiTalkingPoints: [],
    employeeFacingSummary: '',
    peerPatterns: { positive: [], negative: [], sentiment: 'pending' },
    achievements: [],
    blockers: [],
    aboveRoleSignals: [],
    evidenceStrength: subs.length >= 2 ? 'strong' : 'medium',
    allocationFitScore: avg,
    recommendedProjectTypes: [],
  };
}

function mapEvidenceStrength(v?: string): AiEvaluationRecord['evidenceStrength'] {
  if (v === 'high' || v === 'strong') return 'strong';
  if (v === 'low' || v === 'weak') return 'weak';
  return 'medium';
}

export function mapApiEvaluationToStored(doc: Record<string, unknown>, employeeKey: string): StoredAiEvaluation {
  const perf = (doc.performanceSection as Record<string, unknown>) ?? {};
  const beh = (doc.behavioralSection as Record<string, unknown>) ?? {};
  const ins = (doc.insightsSection as Record<string, unknown>) ?? {};

  type StrengthRow = { title?: string; evidence?: string[] };
  type RiskRow = { risk?: string };
  type ImprovementRow = { title?: string };

  const strengths: StrengthRow[] =
    (doc.strengths as StrengthRow[]) ?? (ins.strengths as StrengthRow[]) ?? [];
  const risks: RiskRow[] = (doc.riskPatterns as RiskRow[]) ?? (ins.riskPatterns as RiskRow[]) ?? [];
  const bias = (doc.biasWarnings as { text?: string; reason?: string; suggestedRewrite?: string }[]) ?? [];
  const devPlan = (doc.developmentPlan ?? ins.developmentPlan) as
    | { next30Days?: string[]; next60Days?: string[]; next90Days?: string[] }
    | undefined;
  const improvements: ImprovementRow[] =
    (doc.improvementAreas as ImprovementRow[]) ?? (ins.improvementAreas as ImprovementRow[]) ?? [];

  const status: AiEvalStatus = doc.approvedByManager ? 'approved' : 'generated';
  const achievementsFromPerf = (perf.achievements as string[]) ?? [];
  const achievementsFromStrengths = strengths.flatMap((s) => s.evidence ?? []).slice(0, 6);

  return {
    evaluationId: String(doc._id ?? doc.id ?? ''),
    employeeKey,
    revieweeName: String(doc.revieweeName ?? ''),
    revieweeEmail: String(doc.revieweeEmail ?? ''),
    status,
    generatedAt: String(doc.updatedAt ?? doc.createdAt ?? new Date().toISOString()),
    approvedAt: doc.approvedAt ? String(doc.approvedAt) : undefined,
    includedSubmissionIds: ((doc.includedSubmissionIds as unknown[]) ?? []).map(String),
    sourceFormCodes: (doc.sourceFormCodes as string[]) ?? [],
    aiSummary: String(perf.summary ?? doc.aiSummary ?? ''),
    aiStrengths: strengths.map((s) => s.title ?? '').filter(Boolean),
    aiRisks: risks.map((r) => r.risk ?? '').filter(Boolean),
    aiBiasFlags: bias.map((b) => ({
      text: b.text ?? '',
      reason: b.reason ?? '',
      suggestion: b.suggestedRewrite ?? '',
    })),
    aiDevelopmentPlan: [
      ...(devPlan?.next30Days ?? []),
      ...(devPlan?.next60Days ?? []),
      ...(devPlan?.next90Days ?? []),
    ],
    aiTalkingPoints: (doc.managerTalkingPoints as string[]) ?? (ins.managerTalkingPoints as string[]) ?? [],
    employeeFacingSummary: String(perf.employeeFacingSummary ?? doc.employeeFacingSummary ?? ''),
    calibratedScore: typeof (perf.calibratedScore ?? doc.calibratedScore) === 'number' ? Number(perf.calibratedScore ?? doc.calibratedScore) : undefined,
    roleBasedScore: typeof doc.roleBasedScore === 'number' ? doc.roleBasedScore : undefined,
    recommendedBand: String(perf.recommendedBand ?? doc.recommendedBand ?? ''),
    evidenceStrength: doc.evidenceStrength ? String(doc.evidenceStrength) : undefined,
    aboveRoleSignals: (perf.aboveRoleSignals as string[]) ?? ((doc.aboveRoleSignals as { signal?: string }[]) ?? []).map((s) => s.signal ?? '').filter(Boolean),
    achievements: achievementsFromPerf.length ? achievementsFromPerf : achievementsFromStrengths,
    improvementAreas: (perf.blockers as string[])?.length ? (perf.blockers as string[]) : improvements.map((i) => i.title ?? '').filter(Boolean),
    performanceSection: Object.keys(perf).length ? perf : (doc.performanceSection as Record<string, unknown>),
    behavioralSection: Object.keys(beh).length ? beh : (doc.behavioralSection as Record<string, unknown>),
    insightsSection: Object.keys(ins).length ? ins : (doc.insightsSection as Record<string, unknown>),
  };
}

export function applyStoredEval(employee: AiEvaluationRecord, stored?: StoredAiEvaluation): AiEvaluationRecord {
  if (!stored || stored.status === 'not_generated') return employee;

  const perf = stored.performanceSection ?? {};
  const beh = stored.behavioralSection ?? {};
  const ins = stored.insightsSection ?? {};
  const peer = (ins.peerPatterns ?? {}) as { positive?: string[]; negative?: string[]; sentiment?: string };

  const dimScores = (perf.dimensionScores as DimensionScores) ?? employee.managerScores;
  const calibrated = stored.calibratedScore ?? Number(perf.calibratedScore) ?? employee.calibratedScore;
  const band =
    (stored.recommendedBand && RECOMMENDED_BAND_LABELS[stored.recommendedBand]) ||
    employee.performanceBand;

  const devPlan = ins.developmentPlan as
    | { next30Days?: string[]; next60Days?: string[]; next90Days?: string[] }
    | undefined;

  return {
    ...employee,
    rawScore: stored.roleBasedScore ?? employee.rawScore,
    calibratedScore: Math.round(calibrated),
    performanceBand: band,
    evidenceStrength: mapEvidenceStrength(stored.evidenceStrength) ?? employee.evidenceStrength,
    managerScores: { ...employee.managerScores, ...dimScores },
    aiSummary: stored.aiSummary ?? String(perf.summary ?? employee.aiSummary),
    aiStrengths: stored.aiStrengths ?? employee.aiStrengths,
    aiRisks: stored.aiRisks ?? employee.aiRisks,
    aiBiasFlags: stored.aiBiasFlags ?? employee.aiBiasFlags,
    aiDevelopmentPlan:
      stored.aiDevelopmentPlan?.length
        ? stored.aiDevelopmentPlan
        : [
            ...(devPlan?.next30Days ?? []),
            ...(devPlan?.next60Days ?? []),
            ...(devPlan?.next90Days ?? []),
          ].length
          ? [...(devPlan?.next30Days ?? []), ...(devPlan?.next60Days ?? []), ...(devPlan?.next90Days ?? [])]
          : employee.aiDevelopmentPlan,
    aiTalkingPoints: stored.aiTalkingPoints ?? employee.aiTalkingPoints,
    employeeFacingSummary: stored.employeeFacingSummary ?? String(perf.employeeFacingSummary ?? employee.employeeFacingSummary),
    aboveRoleSignal: parseAboveRoleSignal(String(perf.aboveRoleSignal ?? employee.aboveRoleSignal)),
    aboveRoleSignals: stored.aboveRoleSignals ?? (perf.aboveRoleSignals as string[]) ?? employee.aboveRoleSignals,
    achievements: (perf.achievements as string[])?.length ? (perf.achievements as string[]) : stored.achievements ?? employee.achievements,
    blockers: (perf.blockers as string[])?.length ? (perf.blockers as string[]) : stored.improvementAreas ?? employee.blockers,
    trend: parseTrend(String(perf.trend ?? employee.trend)),
    behavioralProfile: parseBehavioralProfile(String(beh.behavioralProfile ?? employee.behavioralProfile)),
    behavioralLabel: String(beh.behavioralLabel ?? employee.behavioralLabel),
    behavioralSummary: String(beh.behavioralSummary ?? employee.behavioralSummary),
    peerPatterns: {
      positive: peer.positive ?? employee.peerPatterns.positive,
      negative: peer.negative ?? employee.peerPatterns.negative,
      sentiment: peer.sentiment ?? employee.peerPatterns.sentiment,
    },
  };
}

export function isEvaluatedStatus(status?: AiEvalStatus | string) {
  return status === 'generated' || status === 'approved' || status === 'override';
}

/** Reviewees that have a saved AI evaluation (not tied to current submission scope). */
export function buildEvaluatedEmployees(stored: Record<string, StoredAiEvaluation>): ScopedEmployee[] {
  const byEmail = new Map<string, ScopedEmployee>();

  for (const [key, evalDoc] of Object.entries(stored)) {
    if (!isEvaluatedStatus(evalDoc.status)) continue;

    const dedupeKey = evalDoc.revieweeEmail?.trim().toLowerCase() || key;
    const existing = byEmail.get(dedupeKey);
    const incoming = employeeFromStoredEvaluation(key, evalDoc);

    if (!existing) {
      byEmail.set(dedupeKey, incoming);
      continue;
    }

    const existingAt = existing.storedEval?.generatedAt ?? '';
    const incomingAt = evalDoc.generatedAt ?? '';
    if (incomingAt >= existingAt) {
      byEmail.set(dedupeKey, incoming);
    }
  }

  return [...byEmail.values()].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export function employeeFromStoredEvaluation(key: string, stored: StoredAiEvaluation): ScopedEmployee {
  const score = Math.round(stored.calibratedScore ?? 0);
  const bandLabel = stored.recommendedBand && RECOMMENDED_BAND_LABELS[stored.recommendedBand];
  const band: AiEvaluationRecord['performanceBand'] =
    bandLabel === 'Excellent' || bandLabel === 'Good' || bandLabel === 'Needs Focus' || bandLabel === 'At Risk'
      ? bandLabel
      : scoreToBand(score);
  const name = stored.revieweeName?.trim() || key;
  const email = stored.revieweeEmail?.trim() || `${key}@unknown.local`;
  const base: AiEvaluationRecord = {
    employeeId: key,
    employeeName: name,
    email,
    title: 'Engineer',
    department: 'Engineering',
    tenure: '—',
    techStack: [],
    role: 'mid',
    reviewPeriod: 'Saved evaluation',
    behavioralProfile: 'collaborator',
    behavioralLabel: 'Collaborator',
    behavioralSummary: '',
    aboveRoleSignal: 'none',
    managerScores: {} as DimensionScores,
    rawScore: score,
    calibratedScore: score,
    performanceBand: band,
    teamAverage: score,
    roleAverage: score,
    trend: 'stable',
    aiSummary: '',
    aiStrengths: [],
    aiRisks: [],
    aiBiasFlags: [],
    aiDevelopmentPlan: [],
    aiTalkingPoints: [],
    employeeFacingSummary: '',
    peerPatterns: { positive: [], negative: [], sentiment: 'neutral' },
    achievements: [],
    blockers: [],
    aboveRoleSignals: [],
    evidenceStrength: 'medium',
    allocationFitScore: score,
    recommendedProjectTypes: [],
  };

  return {
    ...applyStoredEval(base, stored),
    employeeKey: key,
    employeeId: key,
    submissionIds: stored.includedSubmissionIds,
    submissionCount: stored.includedSubmissionIds.length,
    avgSubmissionScore: score,
    formsInvolved: stored.sourceFormCodes,
    storedEval: stored,
  };
}

/** Merge stored evaluations that use a different key (e.g. email) onto scope reviewee keys. */
export function reconcileStoredKeys(
  stored: Record<string, StoredAiEvaluation>,
  scopeEmployees: Pick<ScopedEmployee, 'employeeKey' | 'employeeName' | 'email'>[]
): Record<string, StoredAiEvaluation> {
  let changed = false;
  const next = { ...stored };

  for (const emp of scopeEmployees) {
    for (const [key, evalDoc] of Object.entries(stored)) {
      if (key === emp.employeeKey) continue;

      const emailMatch =
        !!evalDoc.revieweeEmail &&
        !!emp.email &&
        evalDoc.revieweeEmail.toLowerCase() === emp.email.toLowerCase();
      const nameMatch =
        !!evalDoc.revieweeName &&
        evalDoc.revieweeName.trim().toLowerCase() === emp.employeeName.trim().toLowerCase();

      if (!emailMatch && !nameMatch) continue;

      const existing = next[emp.employeeKey];
      const useIncoming =
        !existing?.generatedAt ||
        !!(evalDoc.generatedAt && evalDoc.generatedAt >= (existing.generatedAt ?? ''));

      if (useIncoming) {
        next[emp.employeeKey] = { ...evalDoc, employeeKey: emp.employeeKey };
      }
      delete next[key];
      changed = true;
    }
  }

  return changed ? next : stored;
}

export function buildScopedEmployees(
  scopedSubs: SubmissionRef[],
  stored: Record<string, StoredAiEvaluation>,
  forms: ReviewFormRef[]
): ScopedEmployee[] {
  const byKey = new Map<string, { subs: SubmissionRef[] }>();

  for (const s of scopedSubs) {
    const key = employeeKey(s.revieweeName, s.revieweeEmail);
    if (!byKey.has(key)) byKey.set(key, { subs: [] });
    byKey.get(key)!.subs.push(s);
  }

  const result: ScopedEmployee[] = [];

  for (const [key, { subs }] of byKey) {
    const storedEval = stored[key];
    const base = buildBaseEmployee(key, subs, forms);
    const merged = applyStoredEval(base, storedEval);
    const avg = Math.round(subs.reduce((a, s) => a + s.totalScore, 0) / subs.length);
    const formsInvolved = [...new Set(subs.map((s) => s.formCode))];

    result.push({
      ...merged,
      employeeKey: key,
      employeeId: key,
      submissionIds: subs.map((s) => s.id),
      submissionCount: subs.length,
      avgSubmissionScore: avg,
      formsInvolved,
      storedEval,
    });
  }

  return result.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}
