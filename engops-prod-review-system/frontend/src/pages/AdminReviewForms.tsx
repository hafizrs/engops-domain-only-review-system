import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ReviewFormsTable } from '../components/ReviewFormsTable';
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
      setCopyFlash('? Link copied to clipboard');
      setTimeout(() => setCopyFlash(''), 2500);
    } catch {
      setCopyFlash('Copy failed ? select the URL manually.');
    }
  }

  return (
    <div className="anim create-page">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Create review form</p>
          <h1 className="page-title">Build and publish a review link</h1>
          <p className="page-desc">
            Select 5 questions per dimension, generate a link, then share it with managers. Published links appear in
            the table below.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/admin/submissions" className="btn btn-outline btn-md">
            Submissions
          </Link>
          <Link to="/admin/dashboard" className="btn btn-outline btn-md">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="create-form-card" aria-labelledby="create-form-settings">
        <h2 id="create-form-settings" className="create-form-card-title">
          Form settings
        </h2>
        <div className="form-meta">
          <div className="fld">
            <label htmlFor="review-title">Review form title</label>
            <input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 2025 Mid-Cycle Review"
            />
          </div>
          <div className="meta-actions">
            <div className="fld">
              <label htmlFor="target-role">Target role</label>
              <select id="target-role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="junior">Junior Engineer</option>
                <option value="mid">Mid Engineer</option>
                <option value="senior">Senior Engineer</option>
                <option value="lead">Lead / Staff</option>
                <option value="manager">Eng. Manager</option>
              </select>
            </div>
            <button type="button" className="btn btn-outline btn-md" onClick={autoSelect}>
              Auto-select 5 each
            </button>
            <button type="button" className="btn btn-ghost btn-md" onClick={clearSel}>
              Clear
            </button>
            <button type="button" className="gen-btn" disabled={!canGenerate} onClick={generateLink}>
              Generate review link
            </button>
          </div>
        </div>
        {!canGenerate && (
          <p className="create-form-hint">
            Select exactly <strong>5 questions</strong> in each of the {DIMS.length} dimensions to enable generate (
            {readyDims}/{DIMS.length} ready).
          </p>
        )}
      </section>

      <section className="create-page-section" aria-label="Question selection">
        {DIMS.map((d) => (
          <DimPanel key={d.key} dim={d} active sel={sel[d.key]} onToggle={toggleQ} />
        ))}
      </section>

      <section className="create-page-section" aria-label="Published review links">
        <ReviewFormsTable
          forms={forms}
          panelTitle="Existing links"
          primaryActionLabel="Submissions"
          showCopyLink
          emptyMessage="No links yet. Complete the form above and click Generate review link."
        />
      </section>

      <div className={'overlay' + (modalOpen ? ' open' : '')}>
        <div className="modal-eo">
          <h2>Review link ready</h2>
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

function DimPanel({
  dim,
  active,
  sel,
  onToggle,
}: {
  readonly dim: DimensionDef;
  readonly active: boolean;
  readonly sel: Set<string>;
  readonly onToggle: (k: string, id: string) => void;
}) {
  return (
    <div className={'dim-panel' + (active ? ' active' : '')}>
      <div className="dim-head">
        <div className="dim-title">{dim.label}</div>
        <span className={'badge ' + dim.badge}>{dim.weight}% weight</span>
      </div>
      <div className="dim-meta">{dim.sub}</div>
      <div className="q-status-bar">
        <div>
          <div className="q-status-label">Selected</div>
          <div className={'q-status-num' + (sel.size === 5 ? ' done' : '')}>{sel.size} / 5</div>
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
              disabled={locked}
              className={'q-card' + (isSel ? ' selected' : '') + (locked ? ' locked' : '')}
              onClick={() => onToggle(dim.key, q.id)}
            >
              <div className="q-row">
                <div className="q-check">{isSel ? '?' : ''}</div>
                <div className="q-text">{q.text}</div>
              </div>
              <div className="q-preview">
                {q.opts.map((opt, si) => (
                  <span key={si} className={`prev-chip ${si === 0 ? 'lo' : si === 5 ? 'hi' : ''}`}>
                    {si} ? {opt}
                  </span>
                ))}
              </div>
              {locked && (
                <div className="q-card-locked-hint">Maximum 5 selected ? deselect one to choose another</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
