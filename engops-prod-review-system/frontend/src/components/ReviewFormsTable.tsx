import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function roleBadgeClass(role: string) {
  const r = (role || '').toLowerCase();
  if (r.includes('senior')) return 'role-badge is-senior';
  if (r.includes('junior')) return 'role-badge is-junior';
  if (r.includes('mid')) return 'role-badge is-mid';
  return 'role-badge';
}

function formatCreated(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

type Props = {
  forms: any[];
  panelTitle: string;
  primaryActionLabel: string;
  showCopyLink?: boolean;
  emptyMessage: string;
};

export function ReviewFormsTable({
  forms,
  panelTitle,
  primaryActionLabel,
  showCopyLink = false,
  emptyMessage,
}: Props) {
  const [copiedCode, setCopiedCode] = useState('');

  async function copyLink(code: string) {
    const url = `${globalThis.location.origin}/review/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(''), 2000);
  }

  return (
    <div className="data-panel">
      <div className="data-panel-head">
        <div>
          <h2 className="data-panel-title">{panelTitle}</h2>
          <p className="data-panel-meta">
            {forms.length} {forms.length === 1 ? 'link' : 'links'}
          </p>
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <colgroup>
            <col className="col-code" />
            <col className="col-title" />
            <col className="col-role" />
            <col className="col-date" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="col-code">
                Code
              </th>
              <th scope="col" className="col-title">
                Title
              </th>
              <th scope="col" className="col-role">
                Role
              </th>
              <th scope="col" className="col-date">
                Created
              </th>
              <th scope="col" className="col-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => {
              const created = formatCreated(f.createdAt);
              return (
                <tr key={f._id}>
                  <td className="col-code">
                    <span className="cell-code">{f.code}</span>
                  </td>
                  <td className="col-title" title={f.title}>
                    <span className="cell-title">{f.title}</span>
                  </td>
                  <td className="col-role">
                    <span className={roleBadgeClass(f.role)}>{f.role}</span>
                  </td>
                  <td className="col-date">
                    <span className="cell-date">
                      <strong>{created.date}</strong>
                      <span>{created.time}</span>
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="table-actions">
                      {showCopyLink && (
                        <button
                          type="button"
                          className={`btn btn-ghost btn-sm ${copiedCode === f.code ? 'is-copied' : ''}`}
                          onClick={() => void copyLink(f.code)}
                        >
                          {copiedCode === f.code ? 'Copied' : 'Copy link'}
                        </button>
                      )}
                      <Link to={`/admin/submissions/${f.code}`} className="btn btn-primary btn-sm">
                        {primaryActionLabel}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {forms.length === 0 && (
              <tr className="data-table-empty">
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="empty-state-icon" aria-hidden="true">
                      ◇
                    </div>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
