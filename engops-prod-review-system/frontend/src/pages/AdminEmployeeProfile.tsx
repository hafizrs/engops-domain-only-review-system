import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ACTIVE_CYCLE_ID, getEmployee, ROLE_LABELS } from '../data/performanceDummy';
import { BandBadge } from './performance/StatusBadge';
import './performance/performance.css';

type Tab = 'basic' | 'skills' | 'history' | 'goals' | 'reviews' | 'allocation';

export function AdminEmployeeProfile() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('basic');
  const emp = getEmployee(id);

  if (!emp) {
    return (
      <div className="anim">
        <p>Employee not found.</p>
        <Link to="/admin/performance">Back</Link>
      </div>
    );
  }

  return (
    <div className="anim">
      <Link to="/admin/performance" style={{ fontSize: 12, color: 'var(--text3)' }}>
        ← Performance dashboard
      </Link>
      <div className="perf-header" style={{ marginTop: 12, marginBottom: 16 }}>
        <h1>{emp.fullName}</h1>
        <p>
          {emp.employeeCode} · {emp.email} · {ROLE_LABELS[emp.currentRoleLevel]} · {emp.department}
        </p>
      </div>

      <div className="perf-detail-tabs">
        {(
          [
            ['basic', 'Basic info'],
            ['skills', 'Skills'],
            ['history', 'Performance history'],
            ['goals', 'Goals'],
            ['reviews', 'Reviews'],
            ['allocation', 'Allocation'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} type="button" className={`perf-detail-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="perf-card">
          <div className="perf-card-title">Profile</div>
          <dl style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
            <dt style={{ color: 'var(--text3)' }}>Manager</dt>
            <dd>{emp.managerName}</dd>
            <dt style={{ color: 'var(--text3)' }}>Track</dt>
            <dd>{emp.track}</dd>
            <dt style={{ color: 'var(--text3)' }}>Behavioral profile</dt>
            <dd>{emp.behavioralProfile.replace(/_/g, ' ')}</dd>
            <dt style={{ color: 'var(--text3)' }}>Allocation</dt>
            <dd>{emp.allocationPercent}%</dd>
            <dt style={{ color: 'var(--text3)' }}>Status</dt>
            <dd>{emp.employmentStatus}</dd>
          </dl>
          <Link
            to={`/admin/performance/${emp.id}/${ACTIVE_CYCLE_ID}`}
            className="primary-btn"
            style={{ marginTop: 14, display: 'inline-block', textDecoration: 'none', fontSize: 12 }}
          >
            Open performance detail
          </Link>
        </div>
      )}

      {tab === 'skills' && (
        <div className="perf-card">
          <div className="perf-card-title">Skills & domain</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {emp.skills.map((s) => (
              <span key={s} className="ai-eval-pill">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="perf-card">
          <div className="perf-card-title">Performance history (demo)</div>
          <table className="perf-table">
            <thead>
              <tr>
                <th>Cycle</th>
                <th>Band</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Q1 2026</td>
                <td>
                  <BandBadge band="good" />
                </td>
                <td>76</td>
              </tr>
              <tr>
                <td>Q2 2026</td>
                <td>
                  <BandBadge band="strong" />
                </td>
                <td>82</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'goals' && (
        <div className="perf-card">
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Goals visible to employee after manager approval (Phase 2+).</p>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="perf-card">
          <Link to="/admin/submissions" className="secondary-btn" style={{ textDecoration: 'none' }}>
            View linked submissions
          </Link>
        </div>
      )}

      {tab === 'allocation' && (
        <div className="perf-card">
          <Link to="/admin/resource-allocation" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Resource allocation requests
          </Link>
        </div>
      )}
    </div>
  );
}
