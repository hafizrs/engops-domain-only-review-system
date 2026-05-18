import type { EvaluationConfig, ReviewFormRef, SubmissionRef } from '../../data/evaluationData';

type Props = {
  forms: ReviewFormRef[];
  config: EvaluationConfig;
  setConfig: (c: EvaluationConfig) => void;
  scopedSubmissions: SubmissionRef[];
  scopedEmployeeCount: number;
  loadingForms: boolean;
  loadingSubs: boolean;
  onContinue: () => void;
};

export function SetupPanel({
  forms,
  config,
  setConfig,
  scopedSubmissions,
  scopedEmployeeCount,
  loadingForms,
  loadingSubs,
  onContinue,
}: Props) {
  const selectedCount = config.selectedFormIds.length;

  const toggleForm = (id: string) => {
    const has = config.selectedFormIds.includes(id);
    setConfig({
      ...config,
      selectedFormIds: has
        ? config.selectedFormIds.filter((x) => x !== id)
        : [...config.selectedFormIds, id],
    });
  };

  const selectAll = () => setConfig({ ...config, selectedFormIds: forms.map((f) => f.id) });
  const clearAll = () => setConfig({ ...config, selectedFormIds: [] });

  return (
    <>
      <div className="ai-eval-card">
        <div className="ai-eval-card-title">
          Evaluation scope <span className="badge bp">Step 1</span>
        </div>
        <p style={{ margin: '0 0 16px', color: 'var(--text3)', fontSize: 13 }}>
          Select one or more review forms and an optional submission date range. Only reviewees with submissions in
          that scope appear for AI evaluation.
        </p>

        {loadingForms ? (
          <div className="ai-eval-info">Loading review forms…</div>
        ) : forms.length === 0 ? (
          <div className="ai-eval-info amber">No review forms found. Create a form under Create Review Form first.</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={selectAll}>
                Select all ({forms.length})
              </button>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '6px 12px', fontSize: 11 }}
                onClick={clearAll}
                disabled={selectedCount === 0}
              >
                Clear selection
              </button>
            </div>
            <div className="ai-eval-form-pick-grid">
              {forms.map((f) => {
                const checked = config.selectedFormIds.includes(f.id);
                return (
                  <label key={f.id} className={`ai-eval-form-pick ${checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleForm(f.id)} />
                    <div>
                      <strong>{f.title}</strong>
                      <div className="ai-eval-form-pick-meta">
                        {f.code} · {f.role} · created {new Date(f.createdAt).toLocaleDateString()}
                        {f.submissionCount ? ` · ${f.submissionCount} subs` : ''}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}

        <div className="ai-eval-filter-grid" style={{ marginTop: 18 }}>
          <div className="ai-eval-field">
            <label>Submitted from</label>
            <input
              type="date"
              value={config.dateFrom}
              onChange={(e) => setConfig({ ...config, dateFrom: e.target.value })}
            />
          </div>
          <div className="ai-eval-field">
            <label>Submitted to</label>
            <input
              type="date"
              value={config.dateTo}
              onChange={(e) => setConfig({ ...config, dateTo: e.target.value })}
            />
          </div>
        </div>

        <div className="ai-eval-flow-hint">
          <strong>What happens next</strong>
          <ol>
            <li>Submissions from selected forms (and date range) are grouped by reviewee.</li>
            <li>AI summarizes only those responses — evidence, patterns, bias flags (draft).</li>
            <li>Manager reviews, approves or overrides; profile + summary stored per employee.</li>
          </ol>
        </div>

        <div className="ai-eval-gen-actions" style={{ marginTop: 16 }}>
          <div className="ai-eval-gen-meta">
            <span className="badge bt">
              {selectedCount} form{selectedCount === 1 ? '' : 's'} selected
            </span>
            <span className="badge ba">{loadingSubs ? '…' : scopedSubmissions.length} submissions</span>
            <span className="badge bg">{scopedEmployeeCount} employees</span>
          </div>
          <button
            type="button"
            className="primary-btn"
            disabled={selectedCount === 0 || scopedEmployeeCount === 0}
            onClick={onContinue}
          >
            Continue to generate
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="ai-eval-card">
          <div className="ai-eval-card-title">Submissions in scope</div>
          <div className="ai-eval-table-wrap">
            <table className="ai-eval-table">
              <thead>
                <tr>
                  <th>Reviewee</th>
                  <th>Form</th>
                  <th>Reviewer</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {scopedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>
                      No submissions match selected forms and date range
                    </td>
                  </tr>
                ) : (
                  scopedSubmissions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.revieweeName}</strong>
                      </td>
                      <td>{s.formCode}</td>
                      <td>{s.reviewerName}</td>
                      <td style={{ fontFamily: 'DM Mono' }}>{s.totalScore}</td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
