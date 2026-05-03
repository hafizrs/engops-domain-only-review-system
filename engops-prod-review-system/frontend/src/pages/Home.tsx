import React from 'react';
import { Link } from 'react-router-dom';
import { getUser, logout } from '../auth/auth';

export function Home() {
  const u = getUser();
  return (
    <div className="screen-login">
      <div className="login-blob lb1" />
      <div className="login-blob lb2" />
      <div className="login-grid" />
      <div className="login-card anim" style={{ maxWidth: 440 }}>
        <div className="login-logo">
          <div className="logo-mark">EO</div>
          <div>
            <div className="logo-text">EngOps</div>
            <div className="logo-sub">REVIEW SYSTEM</div>
          </div>
        </div>
        <div className="login-title">Welcome</div>
        <div className="login-desc">
          {u ? (
            <>
              Signed in as <strong>{u.name}</strong> ({u.role}).
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {u.role === 'admin' ? (
                  <Link to="/admin/dashboard" className="primary-btn" style={{ textDecoration: 'none' }}>
                    Go to Dashboard →
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text3)' }}>Open a review link from your admin to complete a review.</span>
                )}
                <button type="button" className="secondary-btn" onClick={() => logout()}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="primary-btn" style={{ textDecoration: 'none' }}>
                Sign in
              </Link>{' '}
              to create links (admin) or submit reviews (manager).
            </>
          )}
        </div>
      </div>
    </div>
  );
}
