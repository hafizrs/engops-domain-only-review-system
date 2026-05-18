import type { ScopedEmployee, StreamProgressItem } from '../../data/evaluationData';
import { BAND_CLASS, ROLE_LABELS } from './constants';

export type GenerateScope = 'single' | 'all';

type Props = {
  scope: GenerateScope;
  setScope: (s: GenerateScope) => void;
  targetEmployees: ScopedEmployee[];
  generating: boolean;
  streamProgress: StreamProgressItem[];
  streamMessage: string | null;
  onGenerate: () => void;
  selectedKey: string;
  selectedName?: string;
  onViewReview: (key: string) => void;
};

function evalStatus(emp: ScopedEmployee) {
  return emp.storedEval?.status ?? 'not_generated';
}

export function GeneratePanel({
  scope,
  setScope,
  targetEmployees,
  generating,
  streamProgress,
  streamMessage,
  onGenerate,
  selectedKey,
  selectedName,
  onViewReview,
}: Props) {
  const generatedCount = targetEmployees.filter((e) => {
    const s = e.storedEval?.status;
    return s === 'generated' || s === 'approved' || s === 'override';
  }).length;

  return (
    <>
      <div className="ai-eval-card">
        <div className="ai-eval-card-title">
          Generate AI evaluation <span className="badge bp">Submission-based</span>
        </div>
        <p style={{ margin: '0 0 16px', color: 'var(--text3)', fontSize: 13 }}>
          Run AI on review form responses already in scope. Each employee is built from their submission(s) only.
          Output is draft until the manager approves.
        </p>
        <div className="ai-eval-gen-scope">
          <ScopeBtn
            active={scope === 'single'}
            title="One employee"
            desc="Sidebar selection"
            onClick={() => setScope('single')}
          />
          <ScopeBtn
            active={scope === 'all'}
            title="All in scope"
            desc="Every reviewee with submissions"
            onClick={() => setScope('all')}
          />
        </div>
        {scope === 'single' && (
          <div className="ai-eval-info purple" style={{ marginTop: 14 }}>
            Target: <strong>{selectedName ?? 'Select employee in sidebar'}</strong>
          </div>
        )}
        {generating && streamProgress.length > 0 && (
          <div className="ai-eval-card" style={{ marginTop: 16, padding: 14 }}>
            <div className="ai-eval-card-title" style={{ marginBottom: 10 }}>
              Pipeline progress <span className="badge bp">Event stream</span>
            </div>
            {streamMessage && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text3)' }}>{streamMessage}</p>
            )}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {streamProgress.map((step) => (
                <li
                  key={step.node}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border2)',
                    fontSize: 13,
                    color: step.done ? 'var(--green)' : step.active ? 'var(--text1)' : 'var(--text3)',
                  }}
                >
                  <span style={{ fontFamily: 'DM Mono', fontSize: 11, minWidth: 18 }}>
                    {step.done ? '✓' : step.active ? '…' : '○'}
                  </span>
                  <span>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="ai-eval-gen-actions">
          <div className="ai-eval-gen-meta">
            <span className="badge bt">{targetEmployees.length} targeted</span>
            <span className="badge bg">{generatedCount} generated</span>
          </div>
          <button
            type="button"
            className="primary-btn"
            disabled={generating || targetEmployees.length === 0}
            onClick={onGenerate}
          >
            {generating ? 'Generating…' : 'Generate AI evaluation'}
          </button>
        </div>
      </div>

      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Batch status</div>
        <div className="ai-eval-table-wrap">
          <table className="ai-eval-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Submissions</th>
                <th>Avg score</th>
                <th>Forms</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {targetEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>
                    No employees in scope — adjust forms or date range in Setup
                  </td>
                </tr>
              ) : (
                targetEmployees.map((e) => {
                  const status = evalStatus(e);
                  const done = status === 'generated' || status === 'approved' || status === 'override';
                  return (
                    <tr key={e.employeeKey}>
                      <td>
                        <strong>{e.employeeName}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.email}</div>
                      </td>
                      <td>{e.submissionCount}</td>
                      <td style={{ fontFamily: 'DM Mono' }}>{e.avgSubmissionScore}</td>
                      <td style={{ fontSize: 11 }}>{e.formsInvolved.join(', ')}</td>
                      <td>
                        {done ? (
                          <span className="badge bg">{status}</span>
                        ) : (
                          <span className="badge ba">pending</span>
                        )}
                      </td>
                      <td>
                        {done && (
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => onViewReview(e.employeeKey)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ScopeBtn({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`ai-eval-scope-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <strong>{title}</strong>
      <span>{desc}</span>
    </button>
  );
}
