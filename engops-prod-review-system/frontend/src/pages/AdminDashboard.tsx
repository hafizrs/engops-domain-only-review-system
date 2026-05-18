import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ReviewFormsTable } from '../components/ReviewFormsTable';

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
          <Link to="/admin/create" className="btn btn-primary btn-md">
            Create review form
          </Link>
          <Link to="/admin/submissions" className="btn btn-outline btn-md">
            View submissions
          </Link>
          <Link to="/admin/ai-evaluation" className="btn btn-outline btn-md">
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

      <ReviewFormsTable
        forms={forms}
        panelTitle="Existing review links"
        primaryActionLabel="Submissions"
        showCopyLink
        emptyMessage="No review links yet. Create a form to generate a shareable reviewer link."
      />
    </div>
  );
}
