import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function AdminSubmissions() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    api.get('/review-forms').then((r) => setForms(r.data)).catch(() => setForms([]));
  }, []);

  return (
    <div className="anim">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Submissions</p>
          <h1 className="page-title">Review submission list</h1>
          <p className="page-desc">Select a review link to open its submissions on a dedicated detail page.</p>
        </div>
        <div className="page-actions">
          <Link to="/admin/create" className="secondary-btn">
            Create review form
          </Link>
          <Link to="/admin/dashboard" className="secondary-btn">
            Back to dashboard
          </Link>
        </div>
      </header>

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
                    Open submissions
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
                    No review links yet. Create one on the Create Review Form page.
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
