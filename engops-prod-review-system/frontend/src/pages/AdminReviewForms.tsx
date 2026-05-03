import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DIMS, type DimensionDef } from '../questionBank';

type Sel = Record<string, Set<string>>;

function emptySel(): Sel {
  const s: Sel = {};
  DIMS.forEach((d) => {
    s[d.key] = new Set();
  });
  return s;
}

export function AdminReviewForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [sel, setSel] = useState<Sel>(() => emptySel());
  const [title, setTitle] = useState('Q2 2025 Performance Review');
  const [role, setRole] = useState('mid');
  const [modalOpen, setModalOpen] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copyFlash, setCopyFlash] = useState('');
  const [copiedId, setCopiedId] = useState<string>('');

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

    const url = `${globalThis.location.origin}/review/${data.code}`;
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
            Create Review Form
          </div>
          <h1 style={{ margin: 0, fontSize: 34 }}>Build and publish a review link</h1>
          <p style={{ marginTop: 10, color: 'var(--text3)', maxWidth: 650 }}>
            Choose questions, generate a review link, and manage review forms from separate admin pages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/admin/submissions" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Submissions
          </Link>
          <Link to="/admin/dashboard" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
        </div>
      </div>

      <div className="form-meta">
        <div className="fld">
          <label htmlFor="review-title">Review Form Title</label>
          <input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 2025 Mid-Cycle Review" />
        </div>
        <div className="meta-actions">
          <div className="fld" style={{ minWidth: 180 }}>
            <label htmlFor="target-role">Target Role</label>
            <select id="target-role" value={role} onChange={(e) => setRole(e.target.value)}>
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
          <button type="button" className="gen-btn" disabled={!canGenerate} onClick={generateLink}>
            Generate Review Link
          </button>
        </div>
      </div>

      {DIMS.map((d) => (
        <DimPanel key={d.key} dim={d} active={true} sel={sel[d.key]} onToggle={toggleQ} />
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
            {forms.map((f) => {
              const reviewUrl = `${globalThis.location.origin}/review/${f.code}`;
              return (
                <tr key={f._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: 8, fontFamily: 'DM Mono', fontSize: 12 }}>{f.code}</td>
                  <td style={{ padding: 8 }}>{f.title}</td>
                  <td style={{ padding: 8 }}>{f.role}</td>
                  <td style={{ padding: 8, fontSize: 12, color: 'var(--text3)' }}>{new Date(f.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 8, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(reviewUrl);
                          setCopiedId(f._id);
                          setTimeout(() => setCopiedId(''), 2000);
                        } catch {
                          // fallback
                        }
                      }}
                    >
                      {copiedId === f._id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <Link to={`/admin/submissions/${f.code}`} className="secondary-btn" style={{ textDecoration: 'none' }}>
                      Submissions
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={'overlay' + (modalOpen ? ' open' : '')}>
        <div className="modal-eo">
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

function DimPanel({ dim, active, sel, onToggle }: { readonly dim: DimensionDef; readonly active: boolean; readonly sel: Set<string>; readonly onToggle: (k: string, id: string) => void }) {
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
            <button
              key={q.id}
              type="button"
              className={'q-card' + (isSel ? ' selected' : '') + (locked ? ' locked' : '')}
              onClick={() => !locked && onToggle(dim.key, q.id)}
            >
              <div className="q-row">
                <div className="q-check">{isSel ? '✓' : ''}</div>
                <div className="q-text">{q.text}</div>
              </div>
              <div className="q-preview">
                <span className="prev-chip lo">0 · {q.opts[0].slice(0, 36)}…</span>
                <span className="prev-chip">3 · {q.opts[3].slice(0, 36)}…</span>
                <span className="prev-chip hi">5 · {q.opts[5].slice(0, 36)}…</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
