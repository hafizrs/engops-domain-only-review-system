import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { getUser, logout } from '../auth/auth';

export function Home() {
  const u = getUser();

  if (u?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="screen-login">
      <div className="login-ambient" aria-hidden="true" />
      <div className="login-mesh" aria-hidden="true" />
      <div className="login-card anim" style={{ maxWidth: 440 }}>
        <div className="login-logo">
          <BrandLogo variant="full" tagline="Performance reviews · Selise" />
        </div>
        <div className="login-title">Welcome</div>
        {u ? (
          <>
            <p className="login-desc login-desc-block">
              Signed in as <strong>{u.name}</strong> ({u.role}).
            </p>
            <p className="login-desc login-desc-block" style={{ marginTop: 0 }}>
              Open a review link from your admin to complete a review.
            </p>
            <div className="login-cta">
              <button type="button" className="secondary-btn" onClick={() => logout()}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="login-desc login-desc-block">
              Sign in to create review links (admin) or submit reviews (manager).
            </p>
            <div className="login-cta">
              <Link to="/login?next=/admin/dashboard" className="primary-btn login-primary-link">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
