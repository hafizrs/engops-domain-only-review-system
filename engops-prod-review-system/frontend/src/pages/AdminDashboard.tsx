import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function AdminDashboard() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    api.get('/review-forms').then((r) => setForms(r.data)).catch(() => setForms([]));
  }, []);

  return (
    <div className="anim">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Admin dashboard</p>
          <h1 className="page-title">Review management</h1>
          <p className="page-desc">
            Manage review forms, track submissions, and run AI-assisted evaluations from dedicated workflows.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/admin/create" className="primary-btn">
            Create review form
          </Link>
          <Link to="/admin/submissions" className="secondary-btn">
            View submissions
          </Link>
          <Link to="/admin/ai-evaluation" className="secondary-btn">
            AI evaluation
          </Link>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Review forms</div>
          <div className="kpi-value">{forms.length}</div>
          <div className="kpi-hint">Total generated review links</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Last created</div>
          <div className="kpi-value kpi-value-sm">{forms[0]?.title || '—'}</div>
          <div className="kpi-hint">
            {forms[0] ? new Date(forms[0].createdAt).toLocaleString() : 'Create your first review link.'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">AI evaluation</div>
          <div className="kpi-value kpi-value-sm">Scope → Generate</div>
          <div className="kpi-hint">Select forms + date range, then approve manager drafts.</div>
        </div>
      </div>

      <h2 className="section-title">Existing review links</h2>
      <div className="data-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Title</th>
              <th scope="col">Role</th>
              <th scope="col">Created</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f._id}>
                <td className="mono">{f.code}</td>
                <td>{f.title}</td>
                <td>{f.role}</td>
                <td className="muted">{new Date(f.createdAt).toLocaleString()}</td>
                <td>
                  <Link to={`/admin/submissions/${f.code}`} className="secondary-btn">
                    Submissions
                  </Link>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr className="data-table-empty">
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon" aria-hidden="true">
                      ◇
                    </div>
                    No review links yet. Create a form to generate a shareable reviewer link.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
