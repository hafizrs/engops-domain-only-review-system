import React from 'react';
import { Link } from 'react-router-dom';

export function AdminUsers() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
            Users
          </div>
          <h1 style={{ margin: 0, fontSize: 34 }}>User management</h1>
          <p style={{ marginTop: 10, color: 'var(--text3)', maxWidth: 620 }}>
            This section is a placeholder for future user management features.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/admin/dashboard" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Return to dashboard
          </Link>
          <Link to="/admin/create" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Create review form
          </Link>
        </div>
      </div>
      <div style={{ padding: 24, background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Coming soon</div>
        <div style={{ color: 'var(--text3)' }}>
          Admin user management is not implemented yet. This placeholder keeps the admin navigation consistent while the rest of the review flow is separated.
        </div>
      </div>
    </div>
  );
}
