import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getUser, logout } from '../auth/auth';

function navActive(path: string, current: string) {
  return current === path || current.startsWith(path + '/');
}

export function AdminLayout() {
  const user = getUser();
  const location = useLocation();

  if (user?.role !== 'admin') {
    return (
      <div className="screen-login">
        <div className="login-blob lb1" />
        <div className="login-blob lb2" />
        <div className="login-grid" />
        <div className="login-card anim">
          <p className="login-desc">Admin access required.</p>
          <Link to="/login?next=/admin/dashboard" className="primary-btn" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            Sign in as admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <nav className="nav-eo">
        <div className="nav-left-eo">
          <div className="nav-mark-sm">EO</div>
          <div className="nav-name-eo">EngOps</div>
          <div className="nav-sep" />
          <div className="nav-links">
            <Link className={navActive('/admin/dashboard', location.pathname) ? 'active' : ''} to="/admin/dashboard">
              Dashboard
            </Link>
            <Link className={navActive('/admin/create', location.pathname) ? 'active' : ''} to="/admin/create">
              Create Review Form
            </Link>
            <Link className={navActive('/admin/submissions', location.pathname) ? 'active' : ''} to="/admin/submissions">
              Submissions
            </Link>
            <Link className={navActive('/admin/users', location.pathname) ? 'active' : ''} to="/admin/users">
              Users
            </Link>
          </div>
        </div>
        <div className="nav-user-chip">
          <div className="user-dot">{(user.name || user.email)[0].toUpperCase()}</div>
          <span className="user-nm">{user.name || user.email}</span>
          <button type="button" className="signout-btn" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
