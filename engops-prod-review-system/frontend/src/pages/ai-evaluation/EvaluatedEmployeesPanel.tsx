import { useMemo } from 'react';
import type { ScopedEmployee } from '../../data/evaluationData';
import { BAND_CLASS, ROLE_LABELS } from './constants';

type Props = {
  employees: ScopedEmployee[];
  loading?: boolean;
  onViewResults: (employeeKey: string) => void;
};

export function EvaluatedEmployeesPanel({ employees, loading, onViewResults }: Props) {
  const evaluated = useMemo(
    () => [...employees].sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    [employees]
  );

  if (loading) {
    return (
      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Completed AI evaluations</div>
        <div className="ai-eval-info">Loading saved evaluations…</div>
      </div>
    );
  }

  if (evaluated.length === 0) {
    return null;
  }

  return (
    <div className="ai-eval-card ai-eval-evaluated-card">
      <div className="ai-eval-card-title">
        Completed AI evaluations <span className="badge bg">{evaluated.length} ready to view</span>
      </div>
      <p style={{ margin: '0 0 14px', color: 'var(--text3)', fontSize: 13 }}>
        These reviewees already have AI-generated results saved. Open any row to see performance, behavioral, and
        insights tabs — the same view you get right after running evaluate.
      </p>
      <div className="ai-eval-table-wrap">
        <table className="ai-eval-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Calibrated score</th>
              <th>Band</th>
              <th>Status</th>
              <th>Generated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {evaluated.map((e) => {
              const st = e.storedEval?.status ?? 'generated';
              const generatedAt = e.storedEval?.generatedAt;
              return (
                <tr key={e.employeeKey}>
                  <td>
                    <strong>{e.employeeName}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{e.email}</div>
                  </td>
                  <td>{ROLE_LABELS[e.role]}</td>
                  <td style={{ fontFamily: 'DM Mono', fontWeight: 600 }}>{e.calibratedScore}%</td>
                  <td>
                    <span className={`badge ${BAND_CLASS[e.performanceBand] ?? 'bp'}`}>{e.performanceBand}</span>
                  </td>
                  <td>
                    <span className={`badge ${st === 'approved' ? 'bg' : 'bt'}`}>{st}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {generatedAt ? new Date(generatedAt).toLocaleString() : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '6px 14px', fontSize: 12 }}
                      onClick={() => onViewResults(e.employeeKey)}
                    >
                      View results
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
