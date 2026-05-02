import React from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../auth/auth';

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
              Signed in as <strong>{u.name}</strong> ({u.role}).{' '}
              {u.role === 'admin' ? (
                <Link to="/admin/review-forms">Go to Review Forms →</Link>
              ) : (
                <>Open a review link from your admin to complete a review.</>
              )}
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link> to create links (admin) or submit reviews (manager).
            </>
          )}
        </div>
      </div>
    </div>
  );
}
