import type { ScopedEmployee, StoredAiEvaluation, SubmissionRef } from '../../data/evaluationData';

type Props = {
  employee: ScopedEmployee;
  submissions: SubmissionRef[];
  storedEval?: StoredAiEvaluation;
};

export function SubmissionEvidencePanel({ employee, submissions, storedEval }: Props) {
  const included = new Set(storedEval?.includedSubmissionIds ?? employee.submissionIds);

  return (
    <div className="ai-eval-card" style={{ marginBottom: 16 }}>
      <div className="ai-eval-card-title">
        Evidence from review submissions
        <span className="badge bt" style={{ marginLeft: 8 }}>
          {submissions.length} in scope
        </span>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text3)' }}>
        AI evaluation uses only responses from the forms and date range you selected. Avg score from submissions:{' '}
        <strong>{employee.avgSubmissionScore}</strong> · Forms: {employee.formsInvolved.join(', ')}
      </p>
      {storedEval && (
        <div className="ai-eval-info purple" style={{ marginBottom: 12 }}>
          Stored evaluation · status <strong>{storedEval.status}</strong>
          {storedEval.generatedAt && (
            <span style={{ marginLeft: 8 }}>
              · generated {new Date(storedEval.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className="ai-eval-evidence-list">
        {submissions.length === 0 ? (
          <div className="ai-eval-info amber">No submissions for this employee in current scope.</div>
        ) : (
          submissions.map((s) => (
            <article key={s.id} className={`ai-eval-evidence-item ${included.has(s.id) ? '' : 'dim'}`}>
              <div className="ai-eval-evidence-head">
                <strong>{s.formTitle}</strong>
                <span className="badge ba">{s.totalScore}</span>
              </div>
              <div className="ai-eval-evidence-meta">
                Reviewer: {s.reviewerName} · {new Date(s.submittedAt).toLocaleDateString()}
              </div>
              <p className="ai-eval-evidence-preview">{s.answersPreview}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
