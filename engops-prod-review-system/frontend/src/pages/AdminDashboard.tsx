import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function AdminDashboard() {
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    api.get('/review-forms').then((r) => setForms(r.data)).catch(() => setForms([]));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
            Admin dashboard
          </div>
          <h1 style={{ margin: 0, fontSize: 34 }}>Review management</h1>
          <p style={{ marginTop: 10, color: 'var(--text3)', maxWidth: 620 }}>
            Manage review forms, access submission lists, and take action from separate pages instead of one combined screen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/admin/create" className="primary-btn" style={{ textDecoration: 'none' }}>
            Create review form
          </Link>
          <Link to="/admin/submissions" className="secondary-btn" style={{ textDecoration: 'none' }}>
            View submissions
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Review forms</div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{forms.length}</div>
          <div style={{ marginTop: 8, color: 'var(--text3)' }}>Total generated review links</div>
        </div>
        <div style={{ padding: 20, background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Last created</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{forms[0]?.title || 'No review forms yet'}</div>
          <div style={{ marginTop: 8, color: 'var(--text3)' }}>{forms[0] ? new Date(forms[0].createdAt).toLocaleString() : 'Create your first review link.'}</div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: 'Syne', fontSize: 18, marginBottom: 12 }}>Existing review links</h3>
        <div style={{ minHeight: 220, background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18, overflow: 'hidden' }}>
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
                <tr key={f._id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                  <td style={{ padding: 14, fontFamily: 'DM Mono', fontSize: 12 }}>{f.code}</td>
                  <td style={{ padding: 14 }}>{f.title}</td>
                  <td style={{ padding: 14 }}>{f.role}</td>
                  <td style={{ padding: 14, fontSize: 12, color: 'var(--text3)' }}>{new Date(f.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 14 }}>
                    <Link to={`/admin/submissions/${f.code}`} className="secondary-btn" style={{ textDecoration: 'none' }}>
                      Submissions
                    </Link>
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: 'var(--text3)' }}>
                    No review links created yet. Start by creating a new review form.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
