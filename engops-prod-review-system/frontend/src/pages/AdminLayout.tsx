import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { getUser, logout } from '../auth/auth';

function navActive(path: string, current: string) {
  return current === path || current.startsWith(path + '/');
}

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/create': 'Create review form',
  '/admin/submissions': 'Submissions',
  '/admin/users': 'Users',
  '/admin/ai-evaluation': 'AI evaluation',
};

function pageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/admin/submissions/')) return 'Submission detail';
  return 'Admin';
}

export function AdminLayout() {
  const user = getUser();
  const location = useLocation();
  const path = location.pathname;

  if (user?.role !== 'admin') {
    return (
      <div className="screen-login">
        <div className="login-ambient" aria-hidden="true" />
        <div className="login-mesh" aria-hidden="true" />
        <div className="login-card anim">
          <p className="login-desc">Admin access required.</p>
          <Link to="/login?next=/admin/dashboard" className="primary-btn" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
            Sign in as admin
          </Link>
        </div>
      </div>
    );
  }

  const link = (to: string, label: string, icon: string, featured?: boolean) => (
    <Link
      key={to}
      to={to}
      className={`admin-nav-link ${navActive(to, path) ? 'active' : ''} ${featured ? 'featured' : ''}`}
    >
      <span className="admin-nav-icon" aria-hidden="true">
        {icon}
      </span>
      {label}
    </Link>
  );

  return (
    <div className="admin-shell-v2">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="nav-mark-sm">
            <BrandLogo variant="mark" />
          </span>
          <div className="nav-sep" />
          <span className="admin-topbar-page">{pageTitle(path)}</span>
        </div>
        <div className="nav-user-chip">
          <div className="user-dot" aria-hidden="true">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <span className="user-nm">{user.name || user.email}</span>
          <button type="button" className="signout-btn" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-frame">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brand-row">
              <BrandLogo variant="compact" tagline="Selise · Engineering Operations" />
            </div>
          </div>

          <nav className="admin-nav-group">
            <div className="admin-nav-label">Operations</div>
            {link('/admin/dashboard', 'Dashboard', 'DB')}
            {link('/admin/create', 'Create review form', 'CF')}
            {link('/admin/submissions', 'Submissions', 'SB')}
            {link('/admin/users', 'Users', 'US')}
          </nav>

          <nav className="admin-nav-group">
            <div className="admin-nav-label">Intelligence</div>
            {link('/admin/ai-evaluation', 'AI evaluation', 'AI', true)}
          </nav>

          <div className="admin-sidebar-foot" title="Scope by form & date · manager approval required">
            Scope by form & date · manager approval required
          </div>
        </aside>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
