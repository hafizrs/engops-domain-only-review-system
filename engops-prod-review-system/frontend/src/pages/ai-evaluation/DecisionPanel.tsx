
import type { AiEvaluationRecord } from '../../types/aiEvaluation';

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
      <div className="ai-eval-info purple">
        <strong>Rule:</strong> AI recommends — manager validates evidence and makes the final decision. AI does not decide promotion, salary, or PIP outcomes.
      </div>
      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Review decision · {employee.employeeName}</div>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Calibrated score <strong>{employee.calibratedScore}</strong> · Band <strong>{employee.performanceBand}</strong>
          {effectiveAssigneeName && (
            <> · Allocation: <strong>{effectiveAssigneeName}</strong>{hasOverride && aiPickName ? ` (AI suggested ${aiPickName})` : ''}</>
          )}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button type="button" className={managerDecision === 'approved' ? 'primary-btn' : 'secondary-btn'} onClick={() => setManagerDecision('approved')}>Approve AI summary</button>
          <button type="button" className={managerDecision === 'override' ? 'primary-btn' : 'secondary-btn'} onClick={() => setManagerDecision('override')}>Override with edits</button>
        </div>
        {(managerDecision === 'override' || hasOverride) && (
          <div className="ai-eval-field" style={{ marginTop: 16 }}>
            <label>Override reason (required for allocation or score changes)</label>
            <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why you changed the AI recommendation…" />
          </div>
        )}
        {managerDecision === 'approved' && (
          <div className="ai-eval-info teal" style={{ marginTop: 14 }}>
            Ready to publish employee-facing summary after 1:1. Internal risks and bias flags stay manager-only.
          </div>
        )}
      </div>
    </>
  );
}
