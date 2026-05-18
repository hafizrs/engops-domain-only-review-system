# -*- coding: utf-8 -*-
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "src" / "pages"

def fix(s: str) -> str:
    return s.replace("<<D>>", "div").replace("<</D>>", "motionDim").replace("<</D>>", "motionDim")

# Use explicit placeholders
O, C = "<<OPEN>>", "<<CLOSE>>"

def w(name: str, content: str):
    text = content.replace(O, "<div").replace(C, "</div>")
    path = BASE / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    print("wrote", path)

w("ai-evaluation/BehavioralPanel.tsx", '''
import { BEHAVIORAL_PROFILES, type AiEvaluationRecord, type BehavioralProfile } from '../../data/aiEvaluationDummy';

export function BehavioralPanel({ employee }: { employee: AiEvaluationRecord }) {
  const profile = BEHAVIORAL_PROFILES[employee.behavioralProfile];
  return (
    <>
      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-profile-hero">
          <<OPEN>> className="ai-eval-profile-emoji">{profile.emoji}<<CLOSE>>
          <<OPEN>> style={{ flex: 1 }}>
            <<OPEN>> className="ai-eval-card-title" style={{ marginBottom: 4 }}>
              {profile.label}
              <span className={`badge ${profile.badge}`}>Primary profile</span>
            <<CLOSE>>
            <p style={{ margin: '0 0 12px', color: 'var(--text2)', fontSize: 13 }}>{profile.description}</p>
            <p style={{ margin: 0, color: 'var(--text3)', fontSize: 13 }}>
              <strong style={{ color: 'var(--text2)' }}>Manager note:</strong> {employee.behavioralSummary}
            </p>
            <<OPEN>> style={{ marginTop: 14 }}>
              {profile.bestFor.map((t) => (
                <span key={t} className="ai-eval-pill">{t}</span>
              ))}
            <<CLOSE>>
          <<CLOSE>>
        <<CLOSE>>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-section-label">All behavioral profiles (reference)<<CLOSE>>
      <<OPEN>> className="ai-eval-grid2">
        {(Object.entries(BEHAVIORAL_PROFILES) as [BehavioralProfile, (typeof BEHAVIORAL_PROFILES)[BehavioralProfile]][]).map(
          ([key, p]) => (
            <<OPEN>> key={key} className="ai-eval-card">
              <<OPEN>> className="ai-eval-card-title">
                {p.emoji} {p.label}
                {key === employee.behavioralProfile && <span className="badge bg">Current</span>}
              <<CLOSE>>
              <p style={{ margin: 0, color: 'var(--text3)', fontSize: 12 }}>{p.description}</p>
            <<CLOSE>>
          )
        )}
      <<CLOSE>>

      <<OPEN>> className="ai-eval-info purple">
        <strong>Placement rule:</strong> Wrong placement is not always a performance problem. Match behavioral profile to project shape before judging delivery gaps.
      <<CLOSE>>
    </>
  );
}
''')

w("ai-evaluation/AllocationPanel.tsx", '''
import React from 'react';
import {
  BEHAVIORAL_PROFILES,
  PROJECT_TYPES,
  computeAllocationCandidates,
  type AiEvaluationRecord,
  type ProjectScopeInput,
} from '../../data/aiEvaluationDummy';
import { ROLE_LABELS } from './constants';

function ScopeField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <<OPEN>> className="ai-eval-field" style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label>{label}</label>
      {children}
    <<CLOSE>>
  );
}

type Props = {
  projectScope: ProjectScopeInput;
  updateScope: <K extends keyof ProjectScopeInput>(key: K, value: ProjectScopeInput[K]) => void;
  candidates: ReturnType<typeof computeAllocationCandidates>;
  selectedAssignee: string | null;
  setSelectedAssignee: (id: string) => void;
  employee: AiEvaluationRecord;
};

export function AllocationPanel({ projectScope, updateScope, candidates, selectedAssignee, setSelectedAssignee, employee }: Props) {
  const aiPick = candidates.find((c) => c.aiRecommended);
  const effectiveId = selectedAssignee ?? aiPick?.employeeId ?? null;

  return (
    <>
      <<OPEN>> className="ai-eval-info purple">
        Define project scope and shape. AI ranks candidates by behavioral fit, skills, and role — you select the final assignee.
      <<CLOSE>>

      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-card-title">Project scope & details<<CLOSE>>
        <<OPEN>> className="ai-eval-form-grid">
          <ScopeField label="Project name">
            <input value={projectScope.projectName} onChange={(e) => updateScope('projectName', e.target.value)} />
          </ScopeField>
          <ScopeField label="Project type">
            <select value={projectScope.projectType} onChange={(e) => updateScope('projectType', e.target.value as ProjectScopeInput['projectType'])}>
              {Object.entries(PROJECT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </ScopeField>
          <ScopeField label="Complexity">
            <select value={projectScope.complexity} onChange={(e) => updateScope('complexity', e.target.value as ProjectScopeInput['complexity'])}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Uncertainty">
            <select value={projectScope.uncertainty} onChange={(e) => updateScope('uncertainty', e.target.value as ProjectScopeInput['uncertainty'])}>
              <option value="clear">Clear</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Criticality">
            <select value={projectScope.criticality} onChange={(e) => updateScope('criticality', e.target.value as ProjectScopeInput['criticality'])}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Timeline">
            <select value={projectScope.timeline} onChange={(e) => updateScope('timeline', e.target.value as ProjectScopeInput['timeline'])}>
              <option value="normal">Normal</option><option value="aggressive">Aggressive</option><option value="critical">Critical</option>
            </select>
          </ScopeField>
          <ScopeField label="Domain">
            <select value={projectScope.domain} onChange={(e) => updateScope('domain', e.target.value as ProjectScopeInput['domain'])}>
              <option value="fe">Frontend</option><option value="be">Backend</option><option value="fullstack">Fullstack</option>
              <option value="infra">Infra</option><option value="support">Support</option>
            </select>
          </ScopeField>
          <ScopeField label="Cross-team">
            <select value={projectScope.crossTeam ? 'yes' : 'no'} onChange={(e) => updateScope('crossTeam', e.target.value === 'yes')}>
              <option value="no">No</option><option value="yes">Yes</option>
            </select>
          </ScopeField>
          <ScopeField label="Estimated weeks">
            <input type="number" min={1} max={52} value={projectScope.estimatedWeeks} onChange={(e) => updateScope('estimatedWeeks', Number(e.target.value))} />
          </ScopeField>
        <<CLOSE>>
        <ScopeField label="Scope summary" full>
          <textarea value={projectScope.scopeSummary} onChange={(e) => updateScope('scopeSummary', e.target.value)} />
        </ScopeField>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text3)' }}>{PROJECT_TYPES[projectScope.projectType].description}</p>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-section-label">AI-ranked candidates · click to override AI pick<<CLOSE>>
      {candidates.map((c) => {
        const isSelected = effectiveId === c.employeeId;
        const isAi = c.aiRecommended;
        return (
          <label key={c.employeeId} className={`ai-eval-candidate ${isSelected ? 'selected' : ''} ${isAi ? 'ai-pick' : ''}`} style={{ display: 'block', cursor: 'pointer' }}>
            <input type="radio" name="assignee" value={c.employeeId} checked={isSelected} onChange={() => setSelectedAssignee(c.employeeId)} style={{ marginRight: 10 }} />
            <<OPEN>> className="ai-eval-candidate-head">
              <<OPEN>>
                <strong>{c.employeeName}</strong>
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)' }}>
                  {ROLE_LABELS[c.role]} · {BEHAVIORAL_PROFILES[c.behavioralProfile].label}
                </span>
                <<OPEN>> style={{ marginTop: 6 }}>
                  {isAi && <span className="badge bt">AI #1 pick</span>}
                  {isSelected && <span className="badge bp">Selected</span>}
                  {c.employeeId === employee.employeeId && <span className="badge ba">Viewing employee</span>}
                <<CLOSE>>
              <<CLOSE>>
              <<OPEN>> className="ai-eval-fit-score">{c.fitScore}%<<CLOSE>>
            <<CLOSE>>
            <<OPEN>> style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
              {c.fitReasons.map((r) => (
                <<OPEN>> key={r} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: 'var(--green)' }} />{r}<<CLOSE>>
              ))}
              {c.warnings.map((w) => (
                <<OPEN>> key={w} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: 'var(--amber)' }} />{w}<<CLOSE>>
              ))}
            <<CLOSE>>
          </label>
        );
      })}

      {aiPick && effectiveId && effectiveId !== aiPick.employeeId && (
        <<OPEN>> className="ai-eval-info amber">
          Manager override: AI recommended <strong>{aiPick.employeeName}</strong> — you selected{' '}
          <strong>{candidates.find((x) => x.employeeId === effectiveId)?.employeeName}</strong>.
        <<CLOSE>>
      )}
    </>
  );
}
''')

w("ai-evaluation/AiInsightsPanel.tsx", '''
import type { AiEvaluationRecord } from '../../data/aiEvaluationDummy';

export function AiInsightsPanel({ employee }: { employee: AiEvaluationRecord }) {
  return (
    <>
      <<OPEN>> className="ai-eval-grid2">
        <<OPEN>> className="ai-eval-card">
          <<OPEN>> className="ai-eval-card-title">Strengths<<CLOSE>>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.aiStrengths.map((s) => <li key={s}>{s}</li>)}
          </ul>
        <<CLOSE>>
        <<OPEN>> className="ai-eval-card">
          <<OPEN>> className="ai-eval-card-title">Risks / concerns<<CLOSE>>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.aiRisks.map((s) => <li key={s}>{s}</li>)}
          </ul>
        <<CLOSE>>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-card-title">360° peer patterns <span className="badge bt">{employee.peerPatterns.sentiment}</span><<CLOSE>>
        <<OPEN>> className="ai-eval-grid2">
          <<OPEN>>
            <<OPEN>> className="ai-eval-section-label" style={{ marginTop: 0 }}>Positive<<CLOSE>>
            {employee.peerPatterns.positive.map((p) => (
              <<OPEN>> key={p} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: 'var(--green)' }} />{p}<<CLOSE>>
            ))}
          <<CLOSE>>
          <<OPEN>>
            <<OPEN>> className="ai-eval-section-label" style={{ marginTop: 0 }}>Friction<<CLOSE>>
            {employee.peerPatterns.negative.length ? (
              employee.peerPatterns.negative.map((p) => (
                <<OPEN>> key={p} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: 'var(--amber)' }} />{p}<<CLOSE>>
              ))
            ) : (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No recurring friction patterns.</p>
            )}
          <<CLOSE>>
        <<CLOSE>>
        <<OPEN>> className="ai-eval-info amber" style={{ marginTop: 14 }}>
          Raw anonymous peer comments are not shown here — manager-approved summaries only.
        <<CLOSE>>
      <<CLOSE>>

      {employee.aiBiasFlags.length > 0 && (
        <<OPEN>> className="ai-eval-card">
          <<OPEN>> className="ai-eval-card-title">Bias checker <span className="badge br">Flagged</span><<CLOSE>>
          {employee.aiBiasFlags.map((f) => (
            <<OPEN>> key={f.text} className="ai-eval-info red" style={{ marginBottom: 10 }}>
              <<OPEN>><strong>Issue:</strong> {f.reason}<<CLOSE>>
              <<OPEN>> style={{ marginTop: 6, fontSize: 12 }}>Flagged: &quot;{f.text}&quot;<<CLOSE>>
              <<OPEN>> style={{ marginTop: 4, fontSize: 12 }}><strong>Suggestion:</strong> {f.suggestion}<<CLOSE>>
            <<CLOSE>>
          ))}
        <<CLOSE>>
      )}

      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-card-title">Development plan<<CLOSE>>
        <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
          {employee.aiDevelopmentPlan.map((step) => <li key={step} style={{ marginBottom: 6 }}>{step}</li>)}
        </ol>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-card-title">Manager talking points<<CLOSE>>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
          {employee.aiTalkingPoints.map((s) => <li key={s}>{s}</li>)}
        </ul>
      <<CLOSE>>
    </>
  );
}
''')

w("ai-evaluation/DecisionPanel.tsx", '''
import type { AiEvaluationRecord } from '../../data/aiEvaluationDummy';

type Props = {
  employee: AiEvaluationRecord;
  managerDecision: 'pending' | 'approved' | 'override';
  setManagerDecision: (v: 'pending' | 'approved' | 'override') => void;
  overrideReason: string;
  setOverrideReason: (v: string) => void;
  effectiveAssigneeName?: string;
  aiPickName?: string;
  hasOverride: boolean;
};

export function DecisionPanel({ employee, managerDecision, setManagerDecision, overrideReason, setOverrideReason, effectiveAssigneeName, aiPickName, hasOverride }: Props) {
  return (
    <>
      <<OPEN>> className="ai-eval-info purple">
        <strong>Rule:</strong> AI recommends — manager validates evidence and makes the final decision. AI does not decide promotion, salary, or PIP outcomes.
      <<CLOSE>>
      <<OPEN>> className="ai-eval-card">
        <<OPEN>> className="ai-eval-card-title">Review decision · {employee.employeeName}<<CLOSE>>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Calibrated score <strong>{employee.calibratedScore}</strong> · Band <strong>{employee.performanceBand}</strong>
          {effectiveAssigneeName && (
            <> · Allocation: <strong>{effectiveAssigneeName}</strong>{hasOverride && aiPickName ? ` (AI suggested ${aiPickName})` : ''}</>
          )}
        </p>
        <<OPEN>> style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" className={managerDecision === 'approved' ? 'primary-btn' : 'secondary-btn'} onClick={() => setManagerDecision('approved')}>Approve AI summary</button>
          <button type="button" className={managerDecision === 'override' ? 'primary-btn' : 'secondary-btn'} onClick={() => setManagerDecision('override')}>Override with edits</button>
        <<CLOSE>>
        {(managerDecision === 'override' || hasOverride) && (
          <<OPEN>> className="ai-eval-field" style={{ marginTop: 16 }}>
            <label>Override reason (required for allocation or score changes)</label>
            <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why you changed the AI recommendation…" />
          <<CLOSE>>
        )}
        {managerDecision === 'approved' && (
          <<OPEN>> className="ai-eval-info teal" style={{ marginTop: 14 }}>
            Ready to publish employee-facing summary after 1:1. Internal risks and bias flags stay manager-only.
          <<CLOSE>>
        )}
      <<CLOSE>>
    </>
  );
}
''')

w("AdminAiEvaluation.tsx", '''
import { useMemo, useState } from 'react';
import { computeAllocationCandidates, DEFAULT_PROJECT_SCOPE, DUMMY_EMPLOYEES, type ProjectScopeInput } from '../data/aiEvaluationDummy';
import { AllocationPanel } from './ai-evaluation/AllocationPanel';
import { AiInsightsPanel } from './ai-evaluation/AiInsightsPanel';
import { BehavioralPanel } from './ai-evaluation/BehavioralPanel';
import { DecisionPanel } from './ai-evaluation/DecisionPanel';
import { PerformancePanel } from './ai-evaluation/PerformancePanel';
import { ROLE_LABELS } from './ai-evaluation/constants';
import './ai-evaluation/ai-evaluation.css';

type TabId = 'performance' | 'behavioral' | 'allocation' | 'ai-insights' | 'decision';

const TABS: { id: TabId; label: string }[] = [
  { id: 'performance', label: 'Performance Summary' },
  { id: 'behavioral', label: 'Behavioral Profile' },
  { id: 'allocation', label: 'Resource Allocation' },
  { id: 'ai-insights', label: 'AI Insights' },
  { id: 'decision', label: 'Manager Decision' },
];

export function AdminAiEvaluation() {
  const [selectedId, setSelectedId] = useState(DUMMY_EMPLOYEES[0].employeeId);
  const [tab, setTab] = useState<TabId>('performance');
  const [projectScope, setProjectScope] = useState<ProjectScopeInput>(DEFAULT_PROJECT_SCOPE);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [managerDecision, setManagerDecision] = useState<'pending' | 'approved' | 'override'>('pending');
  const [overrideReason, setOverrideReason] = useState('');

  const employee = DUMMY_EMPLOYEES.find((e) => e.employeeId === selectedId) ?? DUMMY_EMPLOYEES[0];
  const candidates = useMemo(() => computeAllocationCandidates(projectScope), [projectScope]);
  const aiPick = candidates.find((c) => c.aiRecommended);
  const effectiveId = selectedAssignee ?? aiPick?.employeeId;
  const hasOverride = Boolean(selectedAssignee && aiPick && selectedAssignee !== aiPick.employeeId);

  const updateScope = <K extends keyof ProjectScopeInput>(key: K, value: ProjectScopeInput[K]) => {
    setProjectScope((s) => ({ ...s, [key]: value }));
    setSelectedAssignee(null);
    setManagerDecision('pending');
  };

  return (
    <<OPEN>> className="anim">
      <<OPEN>> className="ai-eval-header">
        <<OPEN>> style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
          AI-assisted review · Dummy data
        <<CLOSE>>
        <h1>Performance & Resource Allocation</h1>
        <p>AI summarizes evidence and suggests allocation — managers validate and make the final decision. Python service integration planned; UI uses local dummy data for now.</p>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-flow">
        <span>Review data</span><span className="arrow">→</span><span>AI summary</span><span className="arrow">→</span>
        <span>Calibration</span><span className="arrow">→</span><span>Manager dashboard</span><span className="arrow">→</span>
        <span style={{ color: 'var(--green)', borderColor: 'var(--gborder)' }}>Final decision</span>
      <<CLOSE>>

      <<OPEN>> className="ai-eval-page">
        <aside className="ai-eval-sidebar">
          <<OPEN>> className="ai-eval-sidebar-head">
            <h2>Employees</h2>
            <<OPEN>> style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{DUMMY_EMPLOYEES.length} · 2026-Q2<<CLOSE>>
          <<CLOSE>>
          {DUMMY_EMPLOYEES.map((e) => (
            <button key={e.employeeId} type="button" className={`ai-eval-emp-btn ${selectedId === e.employeeId ? 'active' : ''}`} onClick={() => setSelectedId(e.employeeId)}>
              <<OPEN>> className="ai-eval-emp-name">{e.employeeName}<<CLOSE>>
              <<OPEN>> className="ai-eval-emp-meta">{ROLE_LABELS[e.role]} · {e.performanceBand} · {e.calibratedScore}<<CLOSE>>
            </button>
          ))}
        </aside>

        <<OPEN>> className="ai-eval-main">
          <<OPEN>> style={{ marginBottom: 16, padding: '14px 18px', background: 'var(--s2)', borderRadius: 12, border: '1px solid var(--border2)' }}>
            <<OPEN>> style={{ fontWeight: 700, fontSize: 16 }}>{employee.employeeName}<<CLOSE>>
            <<OPEN>> style={{ fontSize: 13, color: 'var(--text3)' }}>{employee.title} · {employee.department} · {employee.tenure}<<CLOSE>>
            <<OPEN>> style={{ marginTop: 8 }}>{employee.techStack.map((t) => <span key={t} className="ai-eval-pill">{t}</span>)}<<CLOSE>>
          <<CLOSE>>

          <<OPEN>> className="ai-eval-tabs">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={`ai-eval-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          <<CLOSE>>

          <<OPEN>> className={`ai-eval-panel ${tab === 'performance' ? 'active' : ''}`}><PerformancePanel employee={employee} /><<CLOSE>>
          <<OPEN>> className={`ai-eval-panel ${tab === 'behavioral' ? 'active' : ''}`}><BehavioralPanel employee={employee} /><<CLOSE>>
          <<OPEN>> className={`ai-eval-panel ${tab === 'allocation' ? 'active' : ''}`}>
            <AllocationPanel projectScope={projectScope} updateScope={updateScope} candidates={candidates} selectedAssignee={selectedAssignee} setSelectedAssignee={setSelectedAssignee} employee={employee} />
          <<CLOSE>>
          <<OPEN>> className={`ai-eval-panel ${tab === 'ai-insights' ? 'active' : ''}`}><AiInsightsPanel employee={employee} /><<CLOSE>>
          <<OPEN>> className={`ai-eval-panel ${tab === 'decision' ? 'active' : ''}`}>
            <DecisionPanel employee={employee} managerDecision={managerDecision} setManagerDecision={setManagerDecision} overrideReason={overrideReason} setOverrideReason={setOverrideReason} effectiveAssigneeName={candidates.find((c) => c.employeeId === effectiveId)?.employeeName} aiPickName={aiPick?.employeeName} hasOverride={hasOverride} />
          <<CLOSE>>

          <<OPEN>> className="ai-eval-decision-bar">
            <<OPEN>> style={{ fontSize: 12, color: 'var(--text3)' }}><strong style={{ color: 'var(--text2)' }}>Quick action:</strong> Approve or override before closing review<<CLOSE>>
            <textarea placeholder="Optional note for HR record…" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
            <button type="button" className="primary-btn" onClick={() => setManagerDecision('approved')}>Save manager decision</button>
          <<CLOSE>>
        <<CLOSE>>
      <<CLOSE>>
    <<CLOSE>>
  );
}
''')
