import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { setSession } from '../auth/auth';

export function LoginPage() {
  const [search] = useSearchParams();
  const next = search.get('next') || '/admin/review-forms';
  const [email, setEmail] = useState('admin@selisegroup.com');
  const [name, setName] = useState('Admin');
  const [role, setRole] = useState<'admin' | 'manager'>('admin');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function submit() {
    setErr('');
    try {
      const { data } = await api.post('/auth/email-login', { email, name, role });
      setSession(data);
      nav(next);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="screen-login">
      <div className="login-blob lb1" />
      <div className="login-blob lb2" />
      <div className="login-grid" />
      <div className="login-card anim">
        <div className="login-logo">
          <div className="logo-mark">EO</div>
          <div>
            <div className="logo-text">EngOps</div>
            <div className="logo-sub">COMPANY EMAIL · DOMAIN LOGIN</div>
          </div>
        </div>
        <div className="login-title">Sign In</div>
        <div className="login-desc">Use your @selisegroup.com email. Choose Admin to build review links, or Manager to submit reviews.</div>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}>
            <option value="admin">Admin — create review links</option>
            <option value="manager">Manager — submit reviews</option>
          </select>
        </div>
        <button type="button" className="primary-btn" onClick={submit}>
          Sign In →
        </button>
        {err && (
          <div className="err-box" style={{ display: 'block' }}>
            {err}
          </div>
        )}
        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          After signing in as admin, open <Link to="/admin/review-forms">Review Forms</Link> from the navigation.
        </p>
      </div>
    </div>
  );
}
