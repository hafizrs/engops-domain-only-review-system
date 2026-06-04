import React from 'react';

export function AdminUsers() {
  return (
    <div>
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <p className="page-eyebrow">Users</p>
          <h1 className="page-title">User management</h1>
          <p className="page-desc">Placeholder for future user management features.</p>
        </div>
      </header>
      <div style={{ padding: 24, background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Coming soon</div>
        <div style={{ color: 'var(--text3)' }}>
          Admin user management is not implemented yet. This placeholder keeps the admin navigation consistent while the rest of the review flow is separated.
        </div>
      </div>
    </div>
  );
}
