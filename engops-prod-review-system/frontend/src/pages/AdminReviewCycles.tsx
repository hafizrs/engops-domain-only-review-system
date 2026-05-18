import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACTIVE_CYCLE_ID, DUMMY_REVIEW_CYCLES } from '../data/performanceDummy';
import './performance/performance.css';

export function AdminReviewCycles() {
  const [cycles, setCycles] = useState(DUMMY_REVIEW_CYCLES);
  const [name, setName] = useState('');
  const [type, setType] = useState('quarterly');
  const [dueDate, setDueDate] = useState('');

  const addCycle = () => {
    if (!name.trim()) return;
    setCycles([
      {
        id: `cycle-${Date.now()}`,
        name: name.trim(),
        type: type as 'quarterly',
        periodStart: '2026-07-01',
        periodEnd: '2026-09-30',
        status: 'draft',
        targetEmployeeCount: 100,
        dueDate: dueDate || '2026-09-15',
        createdAt: new Date().toISOString(),
      },
      ...cycles,
    ]);
    setName('');
    setDueDate('');
  };

  return (
    <div className="anim">
      <div className="perf-header" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
          Review cycles
        </div>
        <h1>Review cycle management</h1>
        <p>Create cycles, assign employees and forms, send secure review links, and track completion. Demo UI — persists in session only.</p>
      </div>

      <div className="perf-card">
        <div className="perf-card-title">Create cycle (draft)</div>
        <div className="perf-filters" style={{ marginBottom: 0, padding: 0, border: 'none', background: 'transparent' }}>
          <div className="ai-eval-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 2026 Engineering Review" />
          </div>
          <div className="ai-eval-field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="project_based">Project-based</option>
              <option value="probation">Probation</option>
            </select>
          </div>
          <div className="ai-eval-field">
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', margin: '12px 0' }}>
          On start: system creates 100 employeePerformanceStates, assignments (self + manager + 2–5 peers), and unique tokens.
        </p>
        <button type="button" className="primary-btn" onClick={addCycle}>
          Save draft cycle
        </button>
      </div>

      <div className="perf-card">
        <div className="perf-card-title">Active & past cycles</div>
        {cycles.map((c) => (
          <article key={c.id} className={`perf-cycle-card ${c.id === ACTIVE_CYCLE_ID ? 'active-cycle' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <strong>{c.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  {c.type} · {c.periodStart} → {c.periodEnd} · {c.targetEmployeeCount} employees
                </div>
              </div>
              <span className={`badge ${c.status === 'finalized' ? 'bg' : c.status === 'collecting_feedback' ? 'ba' : 'bt'}`}>{c.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button type="button" className="secondary-btn" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => alert('Start cycle — Phase 2')}>
                Start cycle
              </button>
              <button type="button" className="secondary-btn" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => alert('Send links — Phase 2')}>
                Send links
              </button>
              <Link
                to={`/admin/performance?cycle=${c.id}`}
                className="secondary-btn"
                style={{ fontSize: 11, padding: '6px 12px', textDecoration: 'none' }}
              >
                View dashboard
              </Link>
              {c.status !== 'finalized' && (
                <button type="button" className="secondary-btn" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => alert('Finalize — Phase 3')}>
                  Finalize
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Link to="/admin/performance" className="secondary-btn" style={{ textDecoration: 'none' }}>
        ← Performance dashboard
      </Link>
    </div>
  );
}
