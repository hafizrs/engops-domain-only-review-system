import { getUser } from '../../auth/auth';

type Props = {
  scopedSubmissionCount: number;
  scopedEmployeeCount: number;
  selectedFormCount: number;
  formsError?: string | null;
  subsError?: string | null;
};

export function AdminContextBar({
  scopedSubmissionCount,
  scopedEmployeeCount,
  selectedFormCount,
  formsError,
  subsError,
}: Props) {
  const user = getUser();

  return (
    <div className="ai-eval-admin-bar">
      <div>
        <div className="ai-eval-admin-bar-label">Logged in as</div>
        <strong>{user?.name ?? 'Admin'}</strong>
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text3)' }}>{user?.email}</span>
        <span className={`badge ${user?.role === 'admin' ? 'bp' : 'bt'}`} style={{ marginLeft: 8 }}>
          {user?.role ?? 'admin'}
        </span>
      </div>
      <div className="ai-eval-admin-bar-stats">
        <span className="badge bt">{selectedFormCount} form(s) selected</span>
        <span className="badge ba">{scopedSubmissionCount} submission(s) in scope</span>
        <span className="badge bg">{scopedEmployeeCount} employee(s) to evaluate</span>
        {!formsError && !subsError && <span className="badge bb">API</span>}
        {(formsError || subsError) && (
          <span className="badge br" title={[formsError, subsError].filter(Boolean).join(' · ')}>
            API error
          </span>
        )}
      </div>
    </div>
  );
}
