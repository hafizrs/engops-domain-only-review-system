import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DIMS, DIM_COLORS, type DimensionDef } from '../questionBank';
import { getUser, logout } from '../auth/auth';

type Sel = Record<string, Set<string>>;

function emptySel(): Sel {
  const s: Sel = {};
  DIMS.forEach((d) => {
    s[d.key] = new Set();
  });
  return s;
}

export function AdminReviewForms() {
  const user = getUser();
  const [forms, setForms] = useState<any[]>([]);
  const [sel, setSel] = useState<Sel>(() => emptySel());
  const [activeDim, setActiveDim] = useState(DIMS[0].key);
  const [title, setTitle] = useState('Q2 2025 Performance Review');
  const [role, setRole] = useState('mid');
  const [modalOpen, setModalOpen] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copyFlash, setCopyFlash] = useState('');
  const [subs, setSubs] = useState<any[]>([]);
  const [subsFor, setSubsFor] = useState('');
  const [detailSubId, setDetailSubId] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    const { data } = await api.get('/review-forms');
    setForms(data);
  }

  const readyDims = useMemo(() => DIMS.filter((d) => sel[d.key].size === 5).length, [sel]);
  const canGenerate = readyDims === DIMS.length;

  function toggleQ(dimKey: string, qid: string) {
    setSel((prev: Sel) => {
      const next = { ...prev, [dimKey]: new Set(prev[dimKey]) };
      const set = next[dimKey];
      if (set.has(qid)) set.delete(qid);
      else if (set.size < 5) set.add(qid);
      return next;
    });
  }

  function autoSelect() {
    const next = emptySel();
    DIMS.forEach((d) => {
      d.questions.slice(0, 5).forEach((q) => next[d.key].add(q.id));
    });
    setSel(next);
  }

  function clearSel() {
    setSel(emptySel());
  }

  async function generateLink() {
    const dims = DIMS.map((d) => ({
      key: d.key,
      label: d.label,
      weight: d.weight,
      sub: d.sub,
      badge: d.badge,
      questions: d.questions.filter((q) => sel[d.key].has(q.id)).map((q) => ({ id: q.id, text: q.text, opts: q.opts })),
    }));
    const { data } = await api.post('/review-forms', {
      title: title.trim() || 'Performance Review',
      role,
      questions: { dims },
    });
    const url = `${window.location.origin}/review/${data.code}`;
    setCreatedCode(data.code);
    setCreatedUrl(url);
    setModalOpen(true);
    loadForms();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopyFlash('✓ Link copied to clipboard');
      setTimeout(() => setCopyFlash(''), 2500);
    } catch {
      setCopyFlash('Copy failed — select the URL manually.');
    }
  }

  async function openSubs(code: string) {
    const { data } = await api.get('/submissions/form/' + code);
    setSubs(data);
    setSubsFor(code);
    setDetailSubId(null);
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="screen-login">
        <div className="login-blob lb1" />
        <div className="login-blob lb2" />
        <div className="login-grid" />
        <div className="login-card anim">
          <p className="login-desc">Admin access required.</p>
          <Link to="/login?next=/admin/review-forms" className="primary-btn" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
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
            <Link className="active" to="/admin/review-forms">
              Review Forms
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

      <div className="admin-body">
        <aside className="sidebar">
          <div className="sidebar-inner">
            <div className="sidebar-label">Dimensions</div>
            {DIMS.map((d) => {
              const n = sel[d.key].size;
              const done = n === 5;
              return (
                <div key={d.key} className={'dim-item' + (activeDim === d.key ? ' active' : '')} onClick={() => setActiveDim(d.key)}>
                  <span className="dim-item-name">{d.label}</span>
                  <span className={'qcount' + (done ? ' done' : '')}>
                    {n}/5
                  </span>
                </div>
              );
            })}
          </div>
          <div className="sidebar-footer">
            <div className="prog-label">
              <span style={{ color: 'var(--text3)', fontFamily: 'DM Mono', fontSize: 10 }}>DIMS READY</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {readyDims} / {DIMS.length}
              </span>
            </div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${(readyDims / DIMS.length) * 100}%` }} />
            </div>
            <button type="button" className="gen-btn" disabled={!canGenerate} onClick={generateLink}>
              Generate Review Link
            </button>
            <div className="gen-hint">{canGenerate ? 'All dimensions ready ✓' : `${DIMS.length - readyDims} more dimension(s) needed`}</div>
          </div>
        </aside>

        <main className="admin-main">
          <div className="form-meta">
            <div className="fld">
              <label>Review Form Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 2025 Mid-Cycle Review" />
            </div>
            <div className="meta-actions">
              <div className="fld" style={{ minWidth: 180 }}>
                <label>Target Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="junior">Junior Engineer</option>
                  <option value="mid">Mid Engineer</option>
                  <option value="senior">Senior Engineer</option>
                  <option value="lead">Lead / Staff</option>
                  <option value="manager">Eng. Manager</option>
                </select>
              </div>
              <button type="button" className="secondary-btn" onClick={autoSelect}>
                Auto-select 5 each
              </button>
              <button type="button" className="secondary-btn" onClick={clearSel}>
                Clear
              </button>
            </div>
          </div>

          {DIMS.map((d) => (
            <DimPanel key={d.key} dim={d} active={activeDim === d.key} sel={sel[d.key]} onToggle={toggleQ} />
          ))}

          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 16 }}>Existing links</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono' }}>
                  <th style={{ padding: 8 }}>Code</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Role</th>
                  <th style={{ padding: 8 }}>Created</th>
                  <th style={{ padding: 8 }} />
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 8, fontFamily: 'DM Mono', fontSize: 12 }}>{f.code}</td>
                    <td style={{ padding: 8 }}>{f.title}</td>
                    <td style={{ padding: 8 }}>{f.role}</td>
                    <td style={{ padding: 8, fontSize: 12, color: 'var(--text3)' }}>{new Date(f.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>
                      <button type="button" className="secondary-btn" onClick={() => openSubs(f.code)}>
                        Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subs.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 16 }}>Submissions {subsFor ? `(${subsFor})` : ''}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border2)', textAlign: 'left', fontSize: 11, color: 'var(--text3)' }}>
                    <th style={{ padding: 8 }}>Reviewer</th>
                    <th style={{ padding: 8 }}>Reviewee</th>
                    <th style={{ padding: 8 }}>Score</th>
                    <th style={{ padding: 8 }}>Submitted</th>
                    <th style={{ padding: 8 }} />
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <Fragment key={s._id}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 8 }}>
                          {s.reviewerName}
                          <br />
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.reviewerEmail}</span>
                        </td>
                        <td style={{ padding: 8 }}>{s.revieweeName}</td>
                        <td style={{ padding: 8 }}>{s.totalScore}</td>
                        <td style={{ padding: 8, fontSize: 12 }}>{new Date(s.submittedAt).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>
                          <button type="button" className="secondary-btn" onClick={() => setDetailSubId((id) => (id === s._id ? null : s._id))}>
                            {detailSubId === s._id ? 'Hide responses' : 'View responses'}
                          </button>
                        </td>
                      </tr>
                      {detailSubId === s._id && (
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td colSpan={5} style={{ padding: '12px 16px 20px', background: 'var(--s2)', verticalAlign: 'top' }}>
                            <SubmissionResponses
                              detail={s.responseDetails}
                              dimensionScores={s.dimensionScores}
                              totalScore={typeof s.totalScore === 'number' ? s.totalScore : undefined}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <div className={'overlay' + (modalOpen ? ' open' : '')} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal-eo" onClick={(e) => e.stopPropagation()}>
          <h2>🔗 Review Link Ready</h2>
          <div className="modal-sub">Share this code or copy the full URL for managers.</div>
          <div className="link-code">{createdCode}</div>
          <div className="link-display">
            <span className="link-text">{createdUrl}</span>
            <button type="button" className="copy-btn" onClick={copyLink}>
              Copy URL
            </button>
          </div>
          <div className="copy-flash">{copyFlash}</div>
          <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type ResponseDetail = {
  dimensionKey: string;
  dimensionLabel: string;
  questionId: string;
  questionText: string;
  score: number;
  options?: string[];
  selectedOptionText?: string;
};

type DimensionScoreRow = {
  dimensionKey: string;
  dimensionLabel: string;
  weight: number;
  averageOutOf5: number;
  percentOfScale: number;
  weightedContribution: number;
};

function SubmissionResponses({
  detail,
  dimensionScores,
  totalScore,
}: {
  detail?: ResponseDetail[];
  dimensionScores?: DimensionScoreRow[];
  totalScore?: number;
}) {
  if (!detail?.length) {
    return <p style={{ color: 'var(--text3)', margin: 0 }}>No response breakdown available.</p>;
  }
  const scoreByKey = new Map((dimensionScores ?? []).map((d) => [d.dimensionKey, d]));
  const byDim = new Map<string, { label: string; rows: ResponseDetail[] }>();
  for (const r of detail) {
    let g = byDim.get(r.dimensionKey);
    if (!g) {
      g = { label: r.dimensionLabel, rows: [] };
      byDim.set(r.dimensionKey, g);
    }
    g.rows.push(r);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 800 }}>Response detail</div>
        {totalScore !== undefined && (
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800, color: 'var(--accent2)' }}>
            Overall {totalScore}
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}> / 100</span>
          </div>
        )}
      </div>
      {[...byDim.entries()].map(([key, { label, rows }]) => {
        const sec = scoreByKey.get(key);
        const color = DIM_COLORS[key] || '#7b6ef6';
        return (
        <div key={key} style={{ border: '1px solid var(--border2)', borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--s1)',
              borderBottom: '1px solid var(--border2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
              {sec && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, fontFamily: 'DM Mono, monospace' }}>
                  {sec.weight}% weight · +{sec.weightedContribution} pts toward total
                </div>
              )}
            </div>
            {sec && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="sum-score-bar" style={{ width: 100 }}>
                  <div className="sum-score-fill" style={{ width: `${sec.percentOfScale}%`, background: color }} />
                </div>
                <div className="sum-score-num" style={{ color }}>
                  {sec.averageOutOf5}
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>/5</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: 12 }}>
            {rows.map((r, i) => {
              const opts = r.options ?? [];
              const chosen = r.score;
              return (
                <div
                  key={r.questionId}
                  style={{
                    marginBottom: i < rows.length - 1 ? 18 : 0,
                    paddingBottom: i < rows.length - 1 ? 18 : 0,
                    borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className={'wizard-q ' + (chosen >= 0 ? 'answered' : '')} style={{ marginBottom: 0 }}>
                    <div className="wq-top">
                      <div className="wq-num">{i + 1}</div>
                      <div className="wq-text">{r.questionText}</div>
                    </div>
                    {opts.length === 0 ? (
                      <div style={{ paddingLeft: 38, fontSize: 12.5, color: 'var(--text2)' }}>
                        {chosen >= 0 ? (
                          <>
                            <strong>{chosen}/5</strong> — {r.selectedOptionText ?? '—'}
                          </>
                        ) : (
                          'No answer recorded.'
                        )}
                      </div>
                    ) : (
                      <div className="opts-col submission-opts-readonly">
                        {opts.map((o, si) => (
                          <div key={si} className={'opt-eo' + (chosen === si ? ' chosen' : '')} aria-current={chosen === si ? 'true' : undefined}>
                            <div className="radio-eo" />
                            <div className="opt-body">{o}</div>
                            <div className={'score-chip ' + (si === 0 ? 's0' : si === 5 ? 's5' : '')}>{si}/5</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}

function DimPanel({ dim, active, sel, onToggle }: { dim: DimensionDef; active: boolean; sel: Set<string>; onToggle: (k: string, id: string) => void }) {
  return (
    <div className={'dim-panel' + (active ? ' active' : '')}>
      <div className="dim-head">
        <div className="dim-title">{dim.label}</div>
        <span className={'badge ' + dim.badge}>{dim.weight}% weight</span>
      </div>
      <div className="dim-meta">{dim.sub}</div>
      <div className="q-status-bar">
        <div>
          <div style={{ fontFamily: 'DM Mono', fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 2 }}>SELECTED</div>
          <div className={'q-status-num' + (sel.size === 5 ? ' done' : '')}>
            {sel.size} / 5
          </div>
        </div>
        <div className="q-status-text">Click questions below to select exactly 5 for managers to answer.</div>
      </div>
      <div>
        {dim.questions.map((q) => {
          const isSel = sel.has(q.id);
          const locked = sel.size >= 5 && !isSel;
          return (
            <div key={q.id} className={'q-card' + (isSel ? ' selected' : '') + (locked ? ' locked' : '')} onClick={() => !locked && onToggle(dim.key, q.id)}>
              <div className="q-row">
                <div className="q-check">{isSel ? '✓' : ''}</div>
                <div className="q-text">{q.text}</div>
              </div>
              <div className="q-preview">
                <span className="prev-chip lo">0 · {q.opts[0].slice(0, 36)}…</span>
                <span className="prev-chip">3 · {q.opts[3].slice(0, 36)}…</span>
                <span className="prev-chip hi">5 · {q.opts[5].slice(0, 36)}…</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
