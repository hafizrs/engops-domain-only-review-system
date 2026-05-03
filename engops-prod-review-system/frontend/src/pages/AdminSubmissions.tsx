import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function AdminSubmissions() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    api.get('/review-forms').then((r) => setForms(r.data)).catch(() => setForms([]));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
            Submissions
          </div>
          <h1 style={{ margin: 0, fontSize: 34 }}>Review submission list</h1>
          <p style={{ marginTop: 10, color: 'var(--text3)', maxWidth: 620 }}>
            Select a review link to open its submissions list on a dedicated page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/admin/create" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Create review form
          </Link>
          <Link to="/admin/dashboard" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Back to dashboard
          </Link>
        </div>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border2)', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono' }}>
              <th style={{ padding: 14 }}>Code</th>
              <th style={{ padding: 14 }}>Title</th>
              <th style={{ padding: 14 }}>Role</th>
              <th style={{ padding: 14 }}>Created</th>
              <th style={{ padding: 14 }} />
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 14, fontFamily: 'DM Mono', fontSize: 12 }}>{f.code}</td>
                <td style={{ padding: 14 }}>{f.title}</td>
                <td style={{ padding: 14 }}>{f.role}</td>
                <td style={{ padding: 14, fontSize: 12, color: 'var(--text3)' }}>{new Date(f.createdAt).toLocaleString()}</td>
                <td style={{ padding: 14 }}>
                  <Link to={`/admin/submissions/${f.code}`} className="secondary-btn" style={{ textDecoration: 'none' }}>
                    Open submissions
                  </Link>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 18, color: 'var(--text3)' }}>
                  No review links available yet. Create one on the Create Review Form page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
