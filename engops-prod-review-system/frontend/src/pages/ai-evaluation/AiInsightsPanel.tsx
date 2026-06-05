import type { AiEvaluationRecord } from '../../types/aiEvaluation';

export function AiInsightsPanel({ employee }: { employee: AiEvaluationRecord }) {
  const hasInsights =
    employee.aiStrengths.length > 0 ||
    employee.aiRisks.length > 0 ||
    employee.aiDevelopmentPlan.length > 0 ||
    employee.aiTalkingPoints.length > 0 ||
    employee.peerPatterns.positive.length > 0 ||
    employee.peerPatterns.negative.length > 0 ||
    employee.aiBiasFlags.length > 0;

  if (!hasInsights) {
    return (
      <div className="ai-eval-info amber">
        AI insights data not found for this evaluation. Re-run Generate, or check that the insights step completed
        without errors.
      </div>
    );
  }

  return (
    <>
      <div className="ai-eval-grid2">
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Strengths</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.aiStrengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Risks / concerns</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
            {employee.aiRisks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ai-eval-card">
        <div className="ai-eval-card-title">
          360° peer patterns <span className="badge bt">{employee.peerPatterns.sentiment}</span>
        </div>
        <div className="ai-eval-grid2">
          <div>
            <div className="ai-eval-section-label" style={{ marginTop: 0 }}>
              Positive
            </div>
            {employee.peerPatterns.positive.map((p) => (
              <div key={p} className="ai-eval-flag">
                <span className="ai-eval-dot" style={{ background: 'var(--green)' }} />
                {p}
              </div>
            ))}
          </div>
          <div>
            <div className="ai-eval-section-label" style={{ marginTop: 0 }}>
              Friction
            </div>
            {employee.peerPatterns.negative.length ? (
              employee.peerPatterns.negative.map((p) => (
                <div key={p} className="ai-eval-flag">
                  <span className="ai-eval-dot" style={{ background: 'var(--amber)' }} />
                  {p}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No recurring friction patterns.</p>
            )}
          </div>
        </div>
        <div className="ai-eval-info amber" style={{ marginTop: 14 }}>
          Raw anonymous peer comments are not shown here — manager-approved summaries only.
        </div>
      </div>

      {employee.aiBiasFlags.length > 0 && (
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">
            Bias checker <span className="badge br">Flagged</span>
          </div>
          {employee.aiBiasFlags.map((f) => (
            <div key={f.text} className="ai-eval-info red" style={{ marginBottom: 10 }}>
              <div>
                <strong>Issue:</strong> {f.reason}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                Flagged: &quot;{f.text}&quot;
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                <strong>Suggestion:</strong> {f.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Development plan</div>
        <ol style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
          {employee.aiDevelopmentPlan.map((step) => (
            <li key={step} style={{ marginBottom: 6 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Manager talking points</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13 }}>
          {employee.aiTalkingPoints.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
