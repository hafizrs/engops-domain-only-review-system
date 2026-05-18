import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardKpis, ROLE_LABELS } from '../data/performanceDummy';
import { usePerformanceList } from '../hooks/usePerformanceList';
import { BandBadge, statusVariant, StepBadge } from './performance/StatusBadge';
import './performance/performance.css';

export function AdminPerformanceDashboard() {
  const {
    filters,
    setFilters,
    page,
    setPage,
    filtered,
    pageItems,
    totalPages,
    pageSize,
    departments,
    managers,
    cycles,
    selectedIds,
    toggleSelect,
    selectPage,
    clearSelection,
  } = usePerformanceList();

  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const kpis = useMemo(() => getDashboardKpis(filtered), [filtered]);

  const runBulk = (action: string) => {
    const n = selectedIds.size || pageItems.length;
    setBulkMsg(`${action} queued for ${n} employee(s) — UI demo only (backend in Phase 2+).`);
    setTimeout(() => setBulkMsg(null), 4000);
  };

  return (
    <div className="anim">
      <div className="perf-header" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
          Performance · Admin
        </div>
        <h1>Organization performance dashboard</h1>
        <p>
          View all employee review states for the active cycle. AI assists managers; final decisions remain
          manager-approved. Demo data for 100 employees — frontend only.
        </p>
      </div>

      <div className="perf-kpi-grid">
        <Kpi label="In cycle" value={kpis.total} />
        <Kpi label="Reviews complete" value={kpis.reviewsCompleted} />
        <Kpi label="Pending / missing" value={kpis.pendingReviews} />
        <Kpi label="AI completed" value={kpis.aiCompleted} />
        <Kpi label="At risk" value={kpis.atRisk} />
        <Kpi label="Promotion-ready" value={kpis.promotionReady} />
        <Kpi label="Insufficient data" value={kpis.insufficientData} />
      </div>

      <div className="perf-filters">
        <FilterField label="Cycle">
          <select value={filters.cycleId} onChange={(e) => setFilters({ ...filters, cycleId: e.target.value })}>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Department">
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="all">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Manager">
          <select value={filters.managerId} onChange={(e) => setFilters({ ...filters, managerId: e.target.value })}>
            <option value="all">All</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Role level">
          <select value={filters.roleLevel} onChange={(e) => setFilters({ ...filters, roleLevel: e.target.value })}>
            <option value="all">All</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Band">
          <select value={filters.band} onChange={(e) => setFilters({ ...filters, band: e.target.value })}>
            <option value="all">All</option>
            <option value="exceptional">Exceptional</option>
            <option value="strong">Strong</option>
            <option value="good">Good</option>
            <option value="needs_focus">Needs focus</option>
            <option value="at_risk">At risk</option>
            <option value="insufficient_data">Insufficient data</option>
          </select>
        </FilterField>
        <FilterField label="AI status">
          <select value={filters.aiStatus} onChange={(e) => setFilters({ ...filters, aiStatus: e.target.value })}>
            <option value="all">All</option>
            <option value="not_started">Not started</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </FilterField>
        <FilterField label="Focus">
          <select value={filters.reviewGap} onChange={(e) => setFilters({ ...filters, reviewGap: e.target.value })}>
            <option value="all">All</option>
            <option value="missing">Missing feedback</option>
            <option value="at_risk">Risk flagged</option>
            <option value="promotion">Promotion-ready</option>
          </select>
        </FilterField>
        <FilterField label="Search">
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Name, email, code"
          />
        </FilterField>
      </div>

      {bulkMsg && <div className="ai-eval-info purple" style={{ marginBottom: 12 }}>{bulkMsg}</div>}

      <div className="perf-bulk-bar">
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedIds.size} selected</span>
        <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={selectPage}>
          Select page
        </button>
        <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={clearSelection}>
          Clear
        </button>
        <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => runBulk('Send review links')}>
          Send links
        </button>
        <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => runBulk('Resend pending')}>
          Resend pending
        </button>
        <button type="button" className="primary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => runBulk('Run AI batch')}>
          Run AI (batch)
        </button>
        <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => runBulk('Export CSV')}>
          Export CSV
        </button>
        <Link to="/admin/review-cycles" className="secondary-btn" style={{ padding: '6px 12px', fontSize: 11, textDecoration: 'none' }}>
          Manage cycles
        </Link>
      </div>

      <div className="perf-table-wrap">
        <table className="perf-table">
          <thead>
            <tr>
              <th />
              <th>Employee</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Self</th>
              <th>Peer</th>
              <th>Mgr</th>
              <th>AI</th>
              <th>Score</th>
              <th>Band</th>
              <th>Trend</th>
              <th>Flags</th>
              <th>Final</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((s) => (
              <tr key={s.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.has(s.employeeId)} onChange={() => toggleSelect(s.employeeId)} />
                </td>
                <td>
                  <strong style={{ color: 'var(--text)' }}>{s.employee.fullName}</strong>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.employee.employeeCode}</div>
                </td>
                <td>{ROLE_LABELS[s.employee.currentRoleLevel]}</td>
                <td style={{ fontSize: 11 }}>{s.employee.managerName.split(' ')[0]}</td>
                <td>
                  <StepBadge label={s.reviewStatus.selfReview} variant={statusVariant(s.reviewStatus.selfReview)} />
                </td>
                <td style={{ fontSize: 11 }}>
                  {s.reviewStatus.peerReviews.submitted}/{s.reviewStatus.peerReviews.total}
                  {s.reviewStatus.peerReviews.overdue > 0 && (
                    <span className="badge br" style={{ marginLeft: 4 }}>
                      {s.reviewStatus.peerReviews.overdue} od
                    </span>
                  )}
                </td>
                <td>
                  <StepBadge label={s.reviewStatus.managerReview} variant={statusVariant(s.reviewStatus.managerReview)} />
                </td>
                <td>
                  <StepBadge label={s.reviewStatus.aiAnalysis} variant={statusVariant(s.reviewStatus.aiAnalysis)} />
                </td>
                <td style={{ fontFamily: 'DM Mono' }}>{s.scoreSummary.calibratedScore ?? '—'}</td>
                <td>
                  <BandBadge band={s.performanceBand} />
                </td>
                <td>
                  <StepBadge label={s.trend.direction} variant={statusVariant(s.trend.direction)} />
                </td>
                <td>
                  {s.riskFlag && <span className="badge br">risk</span>}
                  {s.aboveRoleSignal && <span className="badge bp" style={{ marginLeft: 4 }}>↑role</span>}
                  {s.promotionReady && <span className="badge bg" style={{ marginLeft: 4 }}>promo</span>}
                </td>
                <td>
                  <StepBadge label={s.reviewStatus.finalDecision} variant={statusVariant(s.reviewStatus.finalDecision)} />
                </td>
                <td>
                  <Link
                    to={`/admin/performance/${s.employeeId}/${s.cycleId}`}
                    className="secondary-btn"
                    style={{ padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="perf-pagination">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="secondary-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button type="button" className="secondary-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="perf-kpi">
      <div className="perf-kpi-val">{value}</div>
      <div className="perf-kpi-label">{label}</div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ai-eval-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
