import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PERFORMANCE_DIMENSION_KEYS, PERFORMANCE_DIMENSION_LABELS } from '../dims';
import {
  isTechnicalSpotlight,
  type BandKey,
  type RoleGroupSummary,
  type ScopedEmployee,
} from '../hooks/useDashboardPerformance';
import { ROLE_LABELS } from '../questionBank';
import type { EmployeeRole } from '../types/aiEvaluation';

const BAND_CLASS: Record<string, string> = {
  Excellent: 'perf-band perf-band--excellent',
  Good: 'perf-band perf-band--good',
  'Needs Focus': 'perf-band perf-band--focus',
  'At Risk': 'perf-band perf-band--risk',
};

const DIM_SHORT: Record<string, string> = {
  technical_judgment: 'Tech',
  delivery_execution: 'Delivery',
  quality: 'Quality',
  communication: 'Comm',
  ownership_growth: 'Growth',
};

const BAND_ORDER: BandKey[] = ['Excellent', 'Good', 'Needs Focus', 'At Risk'];

function BandPill({ band }: { band: string }) {
  return <span className={BAND_CLASS[band] ?? 'perf-band'}>{band}</span>;
}

function roleBadgeClass(role: string) {
  const r = role.toLowerCase();
  if (r === 'senior' || r === 'lead') return 'role-badge is-senior';
  if (r === 'junior') return 'role-badge is-junior';
  if (r === 'manager') return 'role-badge';
  return 'role-badge is-mid';
}

type SortKey = 'score-desc' | 'score-asc' | 'name' | 'band';

type Props = {
  employees: ScopedEmployee[];
  roleGroups: RoleGroupSummary[];
  bandDistribution: Record<BandKey, number>;
  kpis: {
    uniqueReviewees: number;
    totalSubs: number;
    avg: number | null;
    rolesCovered: number;
    formCount: number;
    technicalSpotlight: number;
    needsAttention: number;
    formsWithoutSubs: number;
    lastSubmissionAt: number | null;
  };
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
};

export function DashboardPerformanceSummary({
  employees,
  roleGroups,
  bandDistribution,
  kpis,
  loading,
  error,
  onRefresh,
}: Props) {
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | 'all'>('all');
  const [bandFilter, setBandFilter] = useState<BandKey | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('score-desc');

  const filtered = useMemo(() => {
    let list = employees;
    if (roleFilter !== 'all') list = list.filter((e) => e.role === roleFilter);
    if (bandFilter !== 'all') list = list.filter((e) => e.performanceBand === bandFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.employeeName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.formsInvolved.some((c) => c.toLowerCase().includes(q))
      );
    }
    const bandRank: Record<string, number> = {
      Excellent: 4,
      Good: 3,
      'Needs Focus': 2,
      'At Risk': 1,
    };
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.employeeName.localeCompare(b.employeeName);
      if (sort === 'band') return (bandRank[b.performanceBand] ?? 0) - (bandRank[a.performanceBand] ?? 0);
      if (sort === 'score-asc') return a.avgSubmissionScore - b.avgSubmissionScore;
      return b.avgSubmissionScore - a.avgSubmissionScore;
    });
  }, [employees, roleFilter, bandFilter, search, sort]);

  const bandTotal = BAND_ORDER.reduce((n, k) => n + bandDistribution[k], 0);

  if (loading) {
    return (
      <section className="dash-perf-stack">
        <div className="dash-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="dash-skeleton-card" />
          ))}
        </div>
        <div className="data-panel dash-perf-panel">
          <div className="dash-perf-loading">Loading performance data…</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="data-panel dash-perf-panel">
        <div className="dash-error-box">
          <p>{error}</p>
          {onRefresh && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onRefresh}>
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  const lastSubLabel = kpis.lastSubmissionAt
    ? new Date(kpis.lastSubmissionAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="dash-perf-stack">
      <div className="kpi-grid dash-kpi-grid">
        <div className="kpi-card kpi-card--accent">
          <div className="kpi-label">Employees reviewed</div>
          <div className="kpi-value">{kpis.uniqueReviewees}</div>
          <div className="kpi-hint">Unique reviewees in scope</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Submissions</div>
          <div className="kpi-value">{kpis.totalSubs}</div>
          <div className="kpi-hint">
            {kpis.formCount} form{kpis.formCount === 1 ? '' : 's'}
            {lastSubLabel ? ` · Last ${lastSubLabel}` : ''}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Org average</div>
          <div className="kpi-value">{kpis.avg != null ? `${kpis.avg}%` : '—'}</div>
          <div className="kpi-hint">Mean employee score</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Needs attention</div>
          <div className="kpi-value kpi-value-warn">{kpis.needsAttention}</div>
          <div className="kpi-hint">At risk or needs focus</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Technical spotlight</div>
          <div className="kpi-value kpi-value-info">{kpis.technicalSpotlight}</div>
          <div className="kpi-hint">Strong tech/quality, lower visibility</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Empty forms</div>
          <div className="kpi-value">{kpis.formsWithoutSubs}</div>
          <div className="kpi-hint">Links with no submissions yet</div>
        </div>
      </div>

      {bandTotal > 0 && (
        <div className="data-panel dash-perf-panel dash-band-panel">
          <div className="data-panel-head">
            <div>
              <h2 className="data-panel-title">Performance bands</h2>
              <p className="data-panel-meta">Distribution across all reviewees — click to filter the table.</p>
            </div>
          </div>
          <div className="dash-band-bar" role="img" aria-label="Performance band distribution">
            {BAND_ORDER.map((band) => {
              const n = bandDistribution[band];
              if (!n) return null;
              const pct = Math.round((n / bandTotal) * 100);
              return (
                <button
                  key={band}
                  type="button"
                  className={`dash-band-segment dash-band-segment--${band.replace(/\s+/g, '-').toLowerCase()} ${bandFilter === band ? 'active' : ''}`}
                  style={{ flex: n }}
                  title={`${band}: ${n} (${pct}%)`}
                  onClick={() => setBandFilter(bandFilter === band ? 'all' : band)}
                >
                  <span className="dash-band-segment-label">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="dash-band-legend">
            {BAND_ORDER.map((band) => (
              <button
                key={band}
                type="button"
                className={`dash-band-legend-item ${bandFilter === band ? 'active' : ''}`}
                onClick={() => setBandFilter(bandFilter === band ? 'all' : band)}
              >
                <BandPill band={band} />
                <span>{bandDistribution[band]}</span>
              </button>
            ))}
            {bandFilter !== 'all' && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBandFilter('all')}>
                Clear band filter
              </button>
            )}
          </div>
        </div>
      )}

      <div className="data-panel dash-perf-panel">
        <div className="data-panel-head">
          <div>
            <h2 className="data-panel-title">By role level</h2>
            <p className="data-panel-meta">Segregated by review form role — click a card to filter.</p>
          </div>
          {roleFilter !== 'all' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRoleFilter('all')}>
              Clear role filter
            </button>
          )}
        </div>
        <div className="dash-role-grid">
          {roleGroups.map((g) => (
            <button
              key={g.role}
              type="button"
              className={`dash-role-card ${roleFilter === g.role ? 'active' : ''} ${g.count === 0 ? 'empty' : ''}`}
              onClick={() => setRoleFilter(roleFilter === g.role ? 'all' : g.role)}
              disabled={g.count === 0}
            >
              <div className="dash-role-card-head">
                <span className="dash-role-name">{g.label}</span>
                <span className="dash-role-count">{g.count}</span>
              </div>
              <div className="dash-role-avg">{g.avgScore != null ? `${g.avgScore}% avg` : 'No data'}</div>
              {g.count > 0 && (
                <div className="dash-role-bands">
                  {g.excellent > 0 && <span className="perf-band perf-band--excellent">{g.excellent} Exc</span>}
                  {g.good > 0 && <span className="perf-band perf-band--good">{g.good} Good</span>}
                  {g.needsFocus > 0 && <span className="perf-band perf-band--focus">{g.needsFocus} Focus</span>}
                  {g.atRisk > 0 && <span className="perf-band perf-band--risk">{g.atRisk} Risk</span>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="data-panel dash-perf-panel">
        <div className="data-panel-head">
          <div>
            <h2 className="data-panel-title">Employee summary</h2>
            <p className="data-panel-meta">
              {filtered.length} of {employees.length} shown
              {roleFilter !== 'all' ? ` · ${ROLE_LABELS[roleFilter]}` : ''}
              {bandFilter !== 'all' ? ` · ${bandFilter}` : ''}
            </p>
          </div>
        </div>

        <div className="dash-table-toolbar">
          <input
            type="search"
            className="dash-search"
            placeholder="Search by name, email, or form code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
          <select className="dash-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
            <option value="score-desc">Score: high → low</option>
            <option value="score-asc">Score: low → high</option>
            <option value="name">Name A–Z</option>
            <option value="band">Band: best first</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="dash-perf-empty">
            {employees.length === 0 ? (
              <p>No review submissions yet. Create a review form from the sidebar to get started.</p>
            ) : (
              <p>No employees match your filters. Try clearing search or filters.</p>
            )}
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table dash-emp-table">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Band</th>
                  <th>Reviews</th>
                  <th>Dimensions (0–5)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const spotlight = isTechnicalSpotlight(e);
                  return (
                    <tr key={e.employeeKey} className={spotlight ? 'dash-row-spotlight' : undefined}>
                      <td>
                        <div className="cell-title">{e.employeeName}</div>
                        {e.email && !e.email.includes('@unknown') && (
                          <div className="cell-sub">{e.email}</div>
                        )}
                        {spotlight && (
                          <span className="dash-spotlight-tag" title="Strong technical/quality; lower communication — verify via artifacts">
                            Technical spotlight
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={roleBadgeClass(e.role)}>{ROLE_LABELS[e.role] ?? e.role}</span>
                      </td>
                      <td>
                        <span className="dash-score-cell">{e.avgSubmissionScore}%</span>
                      </td>
                      <td>
                        <BandPill band={e.performanceBand} />
                      </td>
                      <td>{e.submissionCount}</td>
                      <td>
                        <div className="dash-dim-bars">
                          {PERFORMANCE_DIMENSION_KEYS.map((k) => {
                            const v = e.managerScores[k] ?? 0;
                            const pct = Math.round((v / 5) * 100);
                            return (
                              <div key={k} className="dash-dim-row" title={`${PERFORMANCE_DIMENSION_LABELS[k]}: ${v}/5`}>
                                <span className="dash-dim-label">{DIM_SHORT[k]}</span>
                                <div className="dash-dim-track">
                                  <div className="dash-dim-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="dash-dim-val">{v.toFixed(1)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <Link
                          to="/admin/ai-evaluation"
                          className="btn btn-ghost btn-sm"
                          title="Run or view AI evaluation"
                        >
                          Evaluate
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
