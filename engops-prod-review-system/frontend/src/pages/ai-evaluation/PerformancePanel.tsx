import { DIMENSION_ORDER, type AiEvaluationRecord } from '../../types/aiEvaluation';
import { PERFORMANCE_DIMENSION_LABELS } from '../../dims';
import { BAND_CLASS, ROLE_LABELS } from './constants';
import { DimensionRow } from './DimensionRow';

export function PerformancePanel({ employee }: { employee: AiEvaluationRecord }) {
  const dims = DIMENSION_ORDER;

  return (
    <>
      <div className="ai-eval-score-hero">
        <div>
          <div
            style={{
              fontFamily: 'DM Mono',
              fontSize: 10,
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}
          >
            {employee.reviewPeriod} · {ROLE_LABELS[employee.role]}
          </div>
          <div className="ai-eval-big-score">{employee.calibratedScore}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono' }}>
            Calibrated · Raw {employee.rawScore} · Team avg {employee.teamAverage}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge ${BAND_CLASS[employee.performanceBand] ?? 'bp'}`} style={{ fontSize: 12, padding: '6px 14px' }}>
            {employee.performanceBand}
          </span>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
            Trend:{' '}
            <span
              style={{
                color:
                  employee.trend === 'up' ? 'var(--green)' : employee.trend === 'down' ? 'var(--red)' : 'var(--text2)',
              }}
            >
              {employee.trend}
            </span>
            {' · '}Evidence: {employee.evidenceStrength}
          </div>
        </div>
      </div>

      <div className="ai-eval-grid2">
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">
            AI Summary <span className="badge bp">Draft</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 13, lineHeight: 1.65 }}>{employee.aiSummary}</p>
        </div>
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Above-role signal</div>
          <span className="badge bt">{employee.aboveRoleSignal.replace('_', ' ')}</span>
          {employee.aboveRoleSignals.length > 0 ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
              {employee.aboveRoleSignals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: '10px 0 0', color: 'var(--text3)', fontSize: 13 }}>No above-role signals recorded this period.</p>
          )}
        </div>
      </div>

      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Role-based dimension scores</div>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text3)' }}>
          Five review dimensions (20% weight each) — scored against current role, not a senior bar.
        </p>
        {dims.map((k) => (
          <DimensionRow key={k} label={PERFORMANCE_DIMENSION_LABELS[k]} score={employee.managerScores[k] ?? 0} />
        ))}
      </div>

      <div className="ai-eval-grid2">
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Achievements</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.achievements.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Blockers</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.blockers.length ? (
              employee.blockers.map((b) => <li key={b}>{b}</li>)
            ) : (
              <li style={{ color: 'var(--text3)' }}>None reported</li>
            )}
          </ul>
        </div>
      </div>

      <div className="ai-eval-info teal" style={{ marginTop: 12 }}>
        <strong>Employee-facing summary:</strong> {employee.employeeFacingSummary}
      </div>
    </>
  );
}
