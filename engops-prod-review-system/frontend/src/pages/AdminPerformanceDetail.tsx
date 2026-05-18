import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BAND_LABELS,
  DUMMY_REVIEW_CYCLES,
  getPerformanceState,
  getSampleAiEvaluation,
  ROLE_LABELS,
} from '../data/performanceDummy';
import { BandBadge, StepBadge, statusVariant } from './performance/StatusBadge';
import './performance/performance.css';

type Tab = 'overview' | 'reviews' | 'ai' | 'evidence' | 'bias' | 'development' | 'decision';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reviews', label: 'Submitted reviews' },
  { id: 'ai', label: 'AI summary' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'bias', label: 'Bias flags' },
  { id: 'development', label: 'Development plan' },
  { id: 'decision', label: 'Manager decision' },
];

export function AdminPerformanceDetail() {
  const { employeeId = '', cycleId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [managerNote, setManagerNote] = useState('');
  const [decision, setDecision] = useState<'pending' | 'approved' | 'override'>('pending');

  const state = getPerformanceState(employeeId, cycleId);
  const cycle = DUMMY_REVIEW_CYCLES.find((c) => c.id === cycleId);
  const ai = getSampleAiEvaluation(employeeId, cycleId);

  if (!state) {
    return (
      <div className="anim">
        <div className="ai-eval-info amber">Employee performance state not found.</div>
        <Link to="/admin/performance">Back to dashboard</Link>
      </div>
    );
  }

  const emp = state.employee;

  return (
    <div className="anim">
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/performance" style={{ fontSize: 12, color: 'var(--text3)' }}>
          ← Performance dashboard
        </Link>
      </div>

      <div className="perf-header" style={{ marginBottom: 16 }}>
        <h1>{emp.fullName}</h1>
        <p>
          {ROLE_LABELS[emp.currentRoleLevel]} · {emp.department} · {emp.designation} · Manager: {emp.managerName}
        </p>
        <p style={{ marginTop: 6 }}>
          Cycle: <strong>{cycle?.name ?? cycleId}</strong> · <BandBadge band={state.performanceBand} />
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link to={`/admin/employees/${emp.id}`} className="secondary-btn" style={{ textDecoration: 'none', fontSize: 12 }}>
          Employee profile
        </Link>
        <Link to="/admin/ai-evaluation" className="primary-btn" style={{ textDecoration: 'none', fontSize: 12 }}>
          Open AI evaluation (submission scope)
        </Link>
        <button type="button" className="secondary-btn" style={{ fontSize: 12 }} onClick={() => alert('Run AI — Phase 2 backend')}>
          Run AI analysis
        </button>
      </div>

      <div className="perf-detail-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`perf-detail-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="perf-detail-grid">
          <Card title="Review status">
            <Row label="Self review" value={state.reviewStatus.selfReview} />
            <Row
              label="Peer reviews"
              value={`${state.reviewStatus.peerReviews.submitted}/${state.reviewStatus.peerReviews.total} (overdue ${state.reviewStatus.peerReviews.overdue})`}
            />
            <Row label="Manager review" value={state.reviewStatus.managerReview} />
            <Row label="AI analysis" value={state.reviewStatus.aiAnalysis} />
            <Row label="Final decision" value={state.reviewStatus.finalDecision} />
          </Card>
          <Card title="Score summary">
            <Row label="Raw score" value={state.scoreSummary.rawScore ?? '—'} />
            <Row label="Role-based score" value={state.scoreSummary.roleBasedScore ?? '—'} />
            <Row label="Calibrated score" value={state.scoreSummary.calibratedScore ?? '—'} />
            <Row label="Confidence" value={state.scoreSummary.confidenceScore ?? '—'} />
            <Row label="Evidence strength" value={state.scoreSummary.evidenceStrength} />
            <Row label="Band" value={BAND_LABELS[state.performanceBand]} />
            <Row label="Trend" value={`${state.trend.direction} (${state.trend.scoreChange ?? '—'})`} />
          </Card>
        </div>
      )}

      {tab === 'reviews' && (
        <Card title="Review assignments (demo)">
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>
            Self, manager, and peer links would list here with token status. Scores feed AI only after submission.
          </p>
          <ul style={{ fontSize: 13, color: 'var(--text2)' }}>
            <li>Self review — {state.reviewStatus.selfReview}</li>
            <li>Manager review — {state.reviewStatus.managerReview}</li>
            <li>
              Peer reviews — {state.reviewStatus.peerReviews.submitted} submitted, {state.reviewStatus.peerReviews.pending}{' '}
              pending
            </li>
          </ul>
          <Link to="/admin/submissions" className="secondary-btn" style={{ marginTop: 12, textDecoration: 'none', fontSize: 12 }}>
            View form submissions
          </Link>
        </Card>
      )}

      {tab === 'ai' && (
        <>
          <div className="ai-eval-info purple" style={{ marginBottom: 12 }}>
            Manager-only sections are not shown to employees. AI does not decide salary, PIP, or termination.
          </div>
          <Card title="AI summary (manager + employee versions)">
            <p style={{ fontSize: 13 }}>{ai.summary}</p>
            <h4 style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)' }}>Manager-only</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{ai.managerOnlySummary}</p>
            <h4 style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)' }}>Employee-facing (after approval)</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{ai.employeeFacingSummary}</p>
            <p style={{ marginTop: 10, fontSize: 12 }}>
              Confidence: {ai.confidenceScore}% · Recommended band: {BAND_LABELS[ai.recommendedBand]}
            </p>
          </Card>
        </>
      )}

      {tab === 'evidence' && (
        <Card title="Evidence used">
          {ai.strengths.map((s) => (
            <div key={s.title} style={{ marginBottom: 10 }}>
              <strong>{s.title}</strong>
              <ul style={{ margin: '4px 0', paddingLeft: 18, fontSize: 13 }}>
                {s.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ))}
          {ai.missingEvidence.length > 0 && (
            <div className="ai-eval-info amber" style={{ marginTop: 10 }}>
              Missing: {ai.missingEvidence.join(', ')}
            </div>
          )}
        </Card>
      )}

      {tab === 'bias' && (
        <Card title="Bias & language checks">
          {ai.biasWarnings.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>No bias warnings in demo data.</p>
          ) : (
            ai.biasWarnings.map((b) => (
              <div key={b.text} className="ai-eval-flag">
                {b.reason} — Suggested: {b.suggestedRewrite}
              </div>
            ))
          )}
          {ai.riskPatterns.map((r) => (
            <div key={r.risk} className="ai-eval-info amber" style={{ marginTop: 8 }}>
              {r.risk} ({r.severity}) {r.managerActionRequired && '· Manager action required'}
            </div>
          ))}
        </Card>
      )}

      {tab === 'development' && (
        <Card title="Development plan (AI draft)">
          {ai.improvementAreas.map((a) => (
            <div key={a.title} style={{ marginBottom: 12 }}>
              <strong>{a.title}</strong>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{a.suggestedAction}</p>
            </div>
          ))}
        </Card>
      )}

      {tab === 'decision' && (
        <Card title="Manager final decision">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
            Approve AI summary or override with reason. Finalized reviews become read-only (audit logged in production).
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={decision === 'approved' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setDecision('approved')}
            >
              Approve AI summary
            </button>
            <button
              type="button"
              className={decision === 'override' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setDecision('override')}
            >
              Override
            </button>
          </div>
          {decision === 'override' && (
            <div className="ai-eval-field" style={{ marginTop: 14 }}>
              <label>Override reason</label>
              <textarea value={managerNote} onChange={(e) => setManagerNote(e.target.value)} placeholder="Required for override…" />
            </div>
          )}
          <button type="button" className="primary-btn" style={{ marginTop: 14 }} onClick={() => alert('Finalize — Phase 3')}>
            Finalize review
          </button>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="perf-card">
      <div className="perf-card-title">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <StepBadge label={String(value)} variant={statusVariant(String(value))} />
    </div>
  );
}
