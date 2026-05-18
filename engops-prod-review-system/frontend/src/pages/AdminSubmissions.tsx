import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ReviewFormsTable } from '../components/ReviewFormsTable';

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
          <Link to="/admin/create" className="btn btn-outline btn-md">
            Create review form
          </Link>
          <Link to="/admin/dashboard" className="btn btn-ghost btn-md">
            Back to dashboard
          </Link>
        </div>
      </header>

      <ReviewFormsTable
        forms={forms}
        panelTitle="All review links"
        primaryActionLabel="Open submissions"
        emptyMessage="No review links yet. Create one on the Create Review Form page."
      />
    </div>
  );
}
