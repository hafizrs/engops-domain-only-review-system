import {
  PERFORMANCE_DIMENSION_KEYS,
  PERFORMANCE_DIMENSION_LABELS,
  type PerformanceDimensionKey,
} from '../dims';

export type EmployeeRole = 'junior' | 'mid' | 'senior' | 'lead' | 'manager';
export type AboveRoleSignal = 'none' | 'emerging' | 'consistent' | 'strong';
export type BehavioralProfile =
  | 'autonomous_executor'
  | 'guided_reliable'
  | 'collaborator'
  | 'crisis_anchor'
  | 'async_specialist'
  | 'steady_executor'
  | 'technical_specialist'
  | 'quiet_contributor'
  | 'process_champion';

export type DimensionKey = PerformanceDimensionKey;
export type DimensionScores = Record<DimensionKey, number>;

export type AiEvaluationRecord = {
  employeeId: string;
  employeeName: string;
  email: string;
  title: string;
  department: string;
  tenure: string;
  techStack: string[];
  role: EmployeeRole;
  reviewPeriod: string;
  behavioralProfile: BehavioralProfile;
  behavioralLabel: string;
  behavioralSummary: string;
  aboveRoleSignal: AboveRoleSignal;
  managerScores: DimensionScores;
  rawScore: number;
  calibratedScore: number;
  performanceBand: 'Excellent' | 'Good' | 'Needs Focus' | 'At Risk';
  teamAverage: number;
  roleAverage: number;
  trend: 'up' | 'stable' | 'down';
  aiSummary: string;
  aiStrengths: string[];
  aiRisks: string[];
  aiBiasFlags: { text: string; reason: string; suggestion: string }[];
  aiDevelopmentPlan: string[];
  aiTalkingPoints: string[];
  employeeFacingSummary: string;
  peerPatterns: { positive: string[]; negative: string[]; sentiment: string };
  achievements: string[];
  blockers: string[];
  aboveRoleSignals: string[];
  evidenceStrength: 'strong' | 'medium' | 'weak';
  allocationFitScore: number;
  recommendedProjectTypes: ProjectType[];
};

export type ProjectType =
  | 'greenfield_feature'
  | 'critical_module'
  | 'production_incident'
  | 'maintenance'
  | 'cross_team_integration'
  | 'platform_upgrade';

export const BEHAVIORAL_PROFILES: Record<
  BehavioralProfile,
  { label: string; emoji: string; badge: string; description: string; bestFor: string[] }
> = {
  autonomous_executor: {
    label: 'Autonomous Executor',
    emoji: '🎯',
    badge: 'bp',
    description: 'Self-directed, owns approach and outcome, works well with minimal supervision.',
    bestFor: ['Critical modules', 'High ambiguity', 'Senior / Lead ownership'],
  },
  guided_reliable: {
    label: 'Guided Reliable',
    emoji: '🔒',
    badge: 'bg',
    description: 'Consistent and dependable with clear requirements and regular feedback.',
    bestFor: ['Structured tasks', 'Junior / Mid', 'Maintenance'],
  },
  collaborator: {
    label: 'Collaborator',
    emoji: '🤝',
    badge: 'bt',
    description: 'Strong communication, helps others, best in integration and cross-team work.',
    bestFor: ['Cross-team features', 'FE / Fullstack', 'Stakeholder alignment'],
  },
  crisis_anchor: {
    label: 'Crisis Anchor',
    emoji: '⚡',
    badge: 'ba',
    description: 'Calm in incidents, reliable under pressure, clear communication in crises.',
    bestFor: ['Production critical', 'Incident response', 'Aggressive timelines'],
  },
  async_specialist: {
    label: 'Async Specialist',
    emoji: '🌙',
    badge: 'bb',
    description: 'High output in async or off-hours mode; scheduling constraint, not a flaw.',
    bestFor: ['Long-running tasks', 'Deep focus work', 'Documentation'],
  },
  steady_executor: {
    label: 'Steady Executor',
    emoji: '🧱',
    badge: 'br',
    description: 'Reliable on assigned work; may not seek promotion. Valid profile.',
    bestFor: ['Support', 'Maintenance', 'Predictable execution'],
  },
  technical_specialist: {
    label: 'Technical Specialist',
    emoji: '🔬',
    badge: 'bp',
    description:
      'Deep technical strength; may be quieter in meetings. Judge by code, design docs, and delivery artifacts—not visibility alone.',
    bestFor: ['Complex modules', 'Architecture depth', 'IC-heavy teams'],
  },
  quiet_contributor: {
    label: 'Quiet Contributor',
    emoji: '🌿',
    badge: 'bg',
    description:
      'Consistent, high-quality output with limited self-promotion. Low communication scores may reflect style, not disengagement.',
    bestFor: ['Backend / platform', 'Research spikes', 'Async-first teams'],
  },
  process_champion: {
    label: 'Process Champion',
    emoji: '⚙️',
    badge: 'bt',
    description: 'Improves quality, testing, and team practices. Strong on quality and maintainability dimensions.',
    bestFor: ['Platform hardening', 'QA enablement', 'Release reliability'],
  },
};

export const DIMENSION_LABELS = PERFORMANCE_DIMENSION_LABELS;
export const DIMENSION_ORDER = PERFORMANCE_DIMENSION_KEYS;

export const PROJECT_TYPES: Record<ProjectType, { label: string; description: string }> = {
  greenfield_feature: { label: 'Greenfield Feature', description: 'New module with moderate ambiguity' },
  critical_module: { label: 'Critical Module', description: 'High-impact system area, strong ownership needed' },
  production_incident: { label: 'Production Incident', description: 'Live issue, pressure-tested response' },
  maintenance: { label: 'Maintenance / Support', description: 'Structured, repeatable work' },
  cross_team_integration: { label: 'Cross-team Integration', description: 'Multiple teams, coordination-heavy' },
  platform_upgrade: { label: 'Platform Upgrade', description: 'Infra or framework migration' },
};

export const RECOMMENDED_BAND_LABELS: Record<string, AiEvaluationRecord['performanceBand']> = {
  exceptional: 'Excellent',
  strong: 'Excellent',
  good: 'Good',
  needs_focus: 'Needs Focus',
  at_risk: 'At Risk',
  insufficient_data: 'Needs Focus',
};
