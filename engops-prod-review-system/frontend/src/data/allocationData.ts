import {
  BEHAVIORAL_PROFILES,
  PROJECT_TYPES,
  type AiEvaluationRecord,
  type BehavioralProfile,
  type EmployeeRole,
  type ProjectType,
} from '../types/aiEvaluation';

export type ProjectComplexity = 'low' | 'medium' | 'high';
export type ProjectUncertainty = 'clear' | 'medium' | 'high';
export type ProjectCriticality = 'low' | 'medium' | 'high';
export type ProjectTimeline = 'normal' | 'aggressive' | 'critical';
export type ProjectDomain = 'fe' | 'be' | 'fullstack' | 'infra' | 'support';

export type ProjectScopeInput = {
  projectName: string;
  projectType: ProjectType;
  complexity: ProjectComplexity;
  uncertainty: ProjectUncertainty;
  criticality: ProjectCriticality;
  timeline: ProjectTimeline;
  domain: ProjectDomain;
  crossTeam: boolean;
  scopeSummary: string;
  estimatedWeeks: number;
  requiredSkills: string[];
};

export const DEFAULT_PROJECT_SCOPE: ProjectScopeInput = {
  projectName: 'EngOps Review Platform — Q3 Allocation Module',
  projectType: 'cross_team_integration',
  complexity: 'high',
  uncertainty: 'medium',
  criticality: 'high',
  timeline: 'aggressive',
  domain: 'fullstack',
  crossTeam: true,
  scopeSummary:
    'Build AI-assisted manager dashboard, Python evaluation service integration, calibration workflow, and employee-facing summary views.',
  estimatedWeeks: 8,
  requiredSkills: ['React', 'NestJS', 'Python', 'MongoDB'],
};

export type AllocationCandidate = {
  employeeId: string;
  employeeName: string;
  role: EmployeeRole;
  behavioralProfile: BehavioralProfile;
  fitScore: number;
  fitReasons: string[];
  warnings: string[];
  aiRecommended: boolean;
  aiRank: number;
};

export function computeAllocationCandidates(
  scope: ProjectScopeInput,
  employees: AiEvaluationRecord[]
): AllocationCandidate[] {
  if (!employees.length) return [];

  const profileWeights: Partial<Record<BehavioralProfile, number>> = {};
  if (scope.criticality === 'high' || scope.timeline === 'critical') {
    profileWeights.crisis_anchor = 25;
    profileWeights.autonomous_executor = 15;
  }
  if (scope.uncertainty === 'high') {
    profileWeights.autonomous_executor = (profileWeights.autonomous_executor ?? 0) + 20;
    profileWeights.guided_reliable = -15;
  }
  if (scope.crossTeam) {
    profileWeights.collaborator = (profileWeights.collaborator ?? 0) + 22;
  }
  if (scope.complexity === 'low' && scope.projectType === 'maintenance') {
    profileWeights.steady_executor = 20;
    profileWeights.guided_reliable = 15;
  }
  if (scope.projectType === 'production_incident') {
    profileWeights.crisis_anchor = 30;
  }

  const scored = employees.map((e) => {
    let fit = e.allocationFitScore * 0.4 + e.calibratedScore * 0.35;
    fit += profileWeights[e.behavioralProfile] ?? 0;
    if (scope.domain === 'fe' && e.techStack.some((t) => t.toLowerCase().includes('react'))) fit += 8;
    if (scope.domain === 'be' && e.techStack.some((t) => ['node', 'go', 'nest'].some((x) => t.toLowerCase().includes(x))))
      fit += 8;
    if (scope.domain === 'fullstack') fit += 5;
    if (scope.requiredSkills.some((s) => e.techStack.some((t) => t.toLowerCase().includes(s.toLowerCase())))) fit += 6;
    if (e.role === 'junior' && (scope.complexity === 'high' || scope.uncertainty === 'high')) fit -= 20;
    if (e.role === 'senior' || e.role === 'lead') fit += scope.complexity === 'high' ? 10 : 4;

    const reasons: string[] = [];
    const warnings: string[] = [];
    if (profileWeights[e.behavioralProfile])
      reasons.push(`Behavioral fit: ${BEHAVIORAL_PROFILES[e.behavioralProfile].label}`);
    if (e.calibratedScore >= e.teamAverage + 5) reasons.push('Above team calibrated average');
    if (e.recommendedProjectTypes.includes(scope.projectType))
      reasons.push(`Prior fit for ${PROJECT_TYPES[scope.projectType].label}`);
    if (e.role === 'junior' && scope.complexity === 'high')
      warnings.push('Junior on high-complexity scope — needs senior pairing');
    if (e.behavioralProfile === 'guided_reliable' && scope.uncertainty === 'high')
      warnings.push('Guided profile may struggle with high ambiguity');
    if (e.behavioralProfile === 'autonomous_executor' && scope.projectType === 'maintenance')
      warnings.push('Autonomous profile may disengage on repetitive maintenance');

    return {
      employeeId: e.employeeId,
      employeeName: e.employeeName,
      role: e.role,
      behavioralProfile: e.behavioralProfile,
      fitScore: Math.round(Math.min(99, Math.max(40, fit))),
      fitReasons: reasons.length ? reasons : ['General availability and skill overlap'],
      warnings,
      aiRecommended: false,
      aiRank: 0,
    };
  });

  scored.sort((a, b) => b.fitScore - a.fitScore);
  scored.forEach((c, i) => {
    c.aiRank = i + 1;
    c.aiRecommended = i === 0;
  });
  return scored;
}
