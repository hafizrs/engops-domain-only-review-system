import React, { useState } from 'react';
import { DashboardPerformanceSummary } from '../components/DashboardPerformanceSummary';
import { ReviewFormsTable } from '../components/ReviewFormsTable';
import { useDashboardPerformance } from '../hooks/useDashboardPerformance';

export function AdminDashboard() {
  const perf = useDashboardPerformance();
  const [linksOpen, setLinksOpen] = useState(true);

  const hasPerfData = perf.employees.length > 0;

  return (
    <div className="anim">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Admin dashboard</p>
          <h1 className="page-title">Performance overview</h1>
          <p className="page-desc">
            Live view of review submissions — employees, role groups, bands, and dimension scores.
          </p>
        </div>
      </header>

      <DashboardPerformanceSummary
        employees={perf.employees}
        roleGroups={perf.roleGroups}
        bandDistribution={perf.bandDistribution}
        kpis={perf.kpis}
        loading={perf.loading}
        error={perf.error}
        onRefresh={perf.reload}
      />

      {perf.recentSubmissions.length > 0 && (
        <section className="data-panel dash-recent-panel">
          <div className="data-panel-head">
            <div>
              <h2 className="data-panel-title">Recent submissions</h2>
              <p className="data-panel-meta">Latest manager reviews received</p>
            </div>
          </div>
          <ul className="dash-recent-list">
            {perf.recentSubmissions.map((s) => (
              <li key={s.id} className="dash-recent-item">
                <div className="dash-recent-main">
                  <strong>{s.revieweeName}</strong>
                  <span className="dash-recent-meta">
                    reviewed by {s.reviewerName} · {s.formTitle || s.formCode}
                  </span>
                </div>
                <div className="dash-recent-right">
                  <span className="dash-recent-score">{s.totalScore}%</span>
                  <span className="dash-recent-date">
                    {new Date(s.submittedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dash-links-section">
        <button
          type="button"
          className="dash-links-toggle"
          onClick={() => setLinksOpen((o) => !o)}
          aria-expanded={linksOpen}
        >
          <span>Review links</span>
          <span className="dash-links-count">{perf.forms.length}</span>
          <span className="dash-links-chevron">{linksOpen ? '▾' : '▸'}</span>
        </button>
        {linksOpen && (
          <ReviewFormsTable
            forms={perf.forms}
            panelTitle="All review links"
            primaryActionLabel="Submissions"
            showCopyLink
            emptyMessage="No review links yet. Create a form to generate a shareable reviewer link."
          />
        )}
      </section>

      {!hasPerfData && !perf.loading && (
        <div className="dash-onboard-banner">
          <p>
            <strong>Get started:</strong> create a review form from the sidebar, share the link with managers, then
            return here to see employee and role-level performance.
          </p>
        </div>
      )}
    </div>
  );
}
