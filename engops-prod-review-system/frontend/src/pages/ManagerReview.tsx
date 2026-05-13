import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { getUser, logout, setSession, type AuthUser } from '../auth/auth';
import { DIM_COLORS, ROLE_LABELS } from '../questionBank';

type DimOption = { label: string; value: number };
type DimQ = { id: string; text: string; opts: DimOption[] };
type WizardDim = { key: string; label: string; weight: number; sub: string; badge: string; questions: DimQ[] };

function computeScore(dims: WizardDim[], answers: Record<string, number>) {
  if (!dims.length) return 0;
  const equalWeight = 100 / dims.length;
  let s = 0;
  dims.forEach((d) => {
    let dSum = 0;
    d.questions.forEach((q) => {
      dSum += answers[q.id] ?? 0;
    });
    const avg = dSum / d.questions.length;
    s += (avg / 5) * equalWeight;
  });
  return Math.round(s);
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ManagerReview() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [loadErr, setLoadErr] = useState('');
  const [me, setMe] = useState<AuthUser | null>(() => getUser());
  const [loginEmail, setLoginEmail] = useState('manager@selisegroup.com');
  const [loginName, setLoginName] = useState('Manager');
  const [loginErr, setLoginErr] = useState('');

  const [wizardStep, setWizardStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revieweeName, setRevieweeName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [shuffledDims, setShuffledDims] = useState<WizardDim[]>([]);


  useEffect(() => {
    if (!code) return;
    api
      .get('/review-forms/code/' + code)
      .then((r) => setForm(r.data))
      .catch(() => setLoadErr('Invalid or expired link'));
  }, [code]);

  useEffect(() => {
    if (!form?.questions?.dims) return;
    const shuffled = form.questions.dims.map((d: any) => ({
      ...d,
      questions: d.questions.map((q: any) => ({
        ...q,
        opts: shuffleArray(q.opts.map((opt: string, idx: number) => ({ label: opt, value: idx }))),
      })),
    }));
    setShuffledDims(shuffled);
  }, [form, code]);

  useEffect(() => {
    const u = getUser();
    setMe(u);
    if (u && localStorage.getItem('token')) {
      api
        .get('/auth/me')
        .then((r) => {
          const x = r.data;
          setMe({ id: x.id, email: x.email, name: x.name, role: x.role });
        })
        .catch(() => {});
    }
  }, [submitted]);

  const wizardDims: WizardDim[] = shuffledDims.length ? shuffledDims : form?.questions?.dims || [];

  const score = useMemo(() => computeScore(wizardDims, answers), [wizardDims, answers]);

  const responsesByDim = useMemo(
    () =>
      wizardDims.map((d) => ({
        d,
        responses: d.questions.map((q) => {
          const selected = q.opts.find((o) => o.value === answers[q.id]);
          return {
            id: q.id,
            text: q.text,
            answerText: selected?.label ?? 'No response selected',
          };
        }),
      })),
    [wizardDims, answers]
  );

  async function doLogin() {
    setLoginErr('');
    try {
      const { data } = await api.post('/auth/email-login', { email: loginEmail, name: loginName, role: 'manager' });
      setSession(data);
      setMe(data.user);
    } catch (e: any) {
      setLoginErr(e.response?.data?.message || 'Login failed');
    }
  }

  const pick = useCallback((qid: string, scoreVal: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: scoreVal }));
  }, []);

  function wizardNext() {
    setSubmitErr('');
    if (wizardStep === 0) {
      const r = revieweeName.trim();
      if (!r) {
        setSubmitErr('Enter the reviewee name before continuing.');
        return;
      }
      setWizardStep(1);
      return;
    }
    if (wizardStep === 1) {
      setWizardStep(2);
      return;
    }
    if (wizardStep >= 2 && wizardStep < 2 + wizardDims.length) {
      const d = wizardDims[wizardStep - 2];
      const all = d.questions.every((q) => answers[q.id] !== undefined);
      if (!all) return;
      setWizardStep((s) => s + 1);
      return;
    }
  }

  function wizardBack() {
    setSubmitErr('');
    if (wizardStep > 0) setWizardStep((s) => s - 1);
  }

  function jumpToDim(dimIndex: number) {
    setWizardStep(2 + dimIndex);
  }

  async function submitForm() {
    const r = revieweeName.trim();
    if (!r || !me?.name) {
      setSubmitErr('Reviewee name and reviewer (your profile) are required to submit.');
      return;
    }
    const allAnswered = wizardDims.every((d) => d.questions.every((q) => answers[q.id] !== undefined));
    if (!allAnswered) return;
    const total = computeScore(wizardDims, answers);
    try {
      await api.post('/submissions/' + code, {
        answers,
        totalScore: total,
        revieweeName: r,
      });
      setSubmitted(true);
    } catch (e: any) {
      setSubmitErr(e.response?.data?.message || 'Submit failed');
    }
  }

  if (loadErr) {
    return (
      <div className="screen-center">
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invalid or Expired Link</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>This review link is no longer valid. Ask your admin to generate a new one.</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="screen-center">
        <span className="pulse-dot" />
        Loading…
      </div>
    );
  }

  if (!me) {
    return (
      <div className="screen-login">
        <div className="login-blob lb1" />
        <div className="login-blob lb2" />
        <div className="login-grid" />
        <div className="access-card anim">
          <div className="login-logo">
            <div className="logo-mark">EO</div>
            <div>
              <div className="logo-text">EngOps</div>
              <div className="logo-sub">MANAGER REVIEW · SIGN IN</div>
            </div>
          </div>
          <div className="login-title">Manager Sign In</div>
          <div className="login-desc">Sign in with your company email to complete this review.</div>
          <div className="field">
            <label>Email</label>
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label>Your name</label>
            <input value={loginName} onChange={(e) => setLoginName(e.target.value)} autoComplete="name" />
          </div>
          <button type="button" className="primary-btn" onClick={doLogin}>
            Continue →
          </button>
          {loginErr && <div className="err-box" style={{ display: 'block' }}>{loginErr}</div>}
        </div>
      </div>
    );
  }

  if (me.role !== 'manager') {
    return (
      <div className="screen-center">
        <div className="login-card anim" style={{ maxWidth: 420 }}>
          <div className="login-title">Manager role required</div>
          <p className="login-desc">This review must be submitted by a manager account. Sign out and log in with role Manager, or open the link in a private window.</p>
          <button type="button" className="primary-btn" onClick={() => { localStorage.clear(); navigate(0); }}>
            Sign out & retry
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="screen-center">
        <div style={{ maxWidth: 440, width: '100%' }} className="anim">
          <div className="tick">✓</div>
          <div className="success-title">Review Submitted</div>
          <div className="success-sub">Your review has been recorded successfully.</div>
          <div className="result-table">
            <div className="rt-row">
              <span>Form</span>
              <span>{form.title}</span>
            </div>
            <div className="rt-row">
              <span>Reviewee</span>
              <span>{revieweeName.trim()}</span>
            </div>
            <div className="rt-row">
              <span>Reviewer</span>
              <span>{me.name}</span>
            </div>
            <div className="rt-row">
              <span>Submitted</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct =
    wizardStep <= 1 ? 0 : Math.round(((wizardStep - 1) / (wizardDims.length + 1)) * 100);

  const navStepLabel =
    wizardStep === 0
      ? 'Participant info'
      : wizardStep === 1
        ? 'Overview'
        : wizardStep <= 1 + wizardDims.length
          ? `Step ${wizardStep - 1} of ${wizardDims.length}`
          : 'Review & Submit';

  const footerStep =
    wizardStep === 0
      ? 'WHO IS IN THIS REVIEW'
      : wizardStep === 1
        ? 'OVERVIEW'
        : wizardStep <= 1 + wizardDims.length
          ? `STEP ${wizardStep - 1} OF ${wizardDims.length}`
          : 'FINAL STEP';

  const footerDim =
    wizardStep === 0
      ? 'Reviewee & reviewer'
      : wizardStep === 1
        ? form.title
        : wizardStep <= 1 + wizardDims.length
          ? wizardDims[wizardStep - 2]?.label || '—'
          : 'Review your answers';

  let body: React.ReactNode = null;
  let showBack = wizardStep > 0;
  let showNext = true;
  let showSubmit = false;
  let nextDisabled = false;
  let nextLabel = 'Next →';

  if (wizardStep === 0) {
    nextLabel = 'Continue →';
    nextDisabled = !revieweeName.trim();
    body = (
      <>
        <div className="step-header">
          <div className="step-eyebrow">
            <span className="step-num">BEFORE YOU START</span>
          </div>
          <div className="step-dim-name">Who is being reviewed?</div>
          <div className="step-dim-sub">The reviewer is taken from your account. Enter the reviewee name below (required).</div>
        </div>
        <div className="participant-card">
          <h3>Participant details</h3>
          <div className="field">
            <label>Reviewee (person being reviewed)</label>
            <input value={revieweeName} onChange={(e) => setRevieweeName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="field">
            <label>Reviewer (you)</label>
            <div className="readonly-field">{me.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{me.email}</div>
          </div>
          {submitErr && <div className="err-box" style={{ display: 'block', marginTop: 12 }}>{submitErr}</div>}
        </div>
      </>
    );
  } else if (wizardStep === 1) {
    showBack = true;
    nextLabel = 'Start Review →';
    nextDisabled = false;
    const dimsHtml = wizardDims.map((d) => (
      <div key={d.key} className="fw-dim-chip">
        <span className="fw-dim-name">{d.label}</span>
        <span style={{ fontFamily: 'DM Mono', fontSize: 10, color: 'var(--text3)' }}>
          {d.questions.length} questions
        </span>
      </div>
    ));
    body = (
      <div className="form-welcome">
        <div className="fw-label">Performance Review</div>
        <div className="fw-title">{form.title}</div>
        <div className="fw-role">
          Role being reviewed: <strong>{ROLE_LABELS[form.role] || form.role}</strong>
        </div>
        <div className="fw-meta">{wizardDims.map((d) => <span key={d.key} className={'badge ' + d.badge}>{d.label}</span>)}</div>
        <div className="fw-info">
          You will answer <strong>{wizardDims.reduce((s, d) => s + d.questions.length, 0)} questions</strong> across{' '}
          <strong>{wizardDims.length} dimensions</strong>. Each question has 6 options. Your responses are submitted as-is and recorded.
          <br />
          <br />
          Reviewee: <strong>{revieweeName.trim()}</strong> · Reviewer: <strong>{me.name}</strong>
          <br />
          <br />
          You can go back and change answers before submitting.
        </div>
        <div className="fw-dims-preview">{dimsHtml}</div>
      </div>
    );
  } else if (wizardStep >= 2 && wizardStep < 2 + wizardDims.length) {
    const di = wizardStep - 2;
    const d = wizardDims[di];
    const color = DIM_COLORS[d.key] || 'var(--accent2)';
    const dimAnswered = d.questions.filter((q) => answers[q.id] !== undefined).length;
    nextDisabled = dimAnswered < d.questions.length;
    nextLabel = wizardStep === 1 + wizardDims.length ? 'Review & Submit →' : 'Next →';

    const pips = wizardDims.map((dd, i) => {
      const idx = i + 1;
      const cls = idx < wizardStep - 1 ? 'done' : idx === wizardStep - 1 ? 'active' : '';
      return <div key={dd.key} className={'step-pip ' + cls} title={dd.label} />;
    });

    body = (
      <>
        <div className="step-header">
          <div className="step-eyebrow">
            <span className="step-num">
              DIMENSION {wizardStep - 1} OF {wizardDims.length}
            </span>
            <span className={'badge ' + d.badge}>{d.label}</span>
          </div>
          <div className="step-dim-name" style={{ color }}>
            {d.label}
          </div>
          <div className="step-dim-sub">{d.sub}</div>
          <div className="step-progress">
            {pips}
            <span className="step-answered">
              {dimAnswered === d.questions.length ? <span style={{ color: 'var(--green)' }}>✓ All answered</span> : `${dimAnswered}/${d.questions.length} answered`}
            </span>
          </div>
        </div>
        {d.questions.map((q, qi) => {
          const isAnswered = answers[q.id] !== undefined;
          return (
            <div key={q.id} className={'wizard-q ' + (isAnswered ? 'answered' : '')}>
              <div className="wq-top">
                <div className="wq-num">{qi + 1}</div>
                <div className="wq-text">{q.text}</div>
              </div>
              <div className="opts-col">
                {q.opts.map((o) => (
                  <div
                    key={o.value}
                    className={'opt-eo ' + (answers[q.id] === o.value ? 'chosen' : '')}
                    onClick={() => pick(q.id, o.value)}
                  >
                    <div className="radio-eo" />
                    <div className="opt-body">{o.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else {
    showNext = false;
    showSubmit = true;

    body = (
      <>
        <div className="step-header">
          <div className="step-eyebrow">
            <span className="step-num">FINAL STEP</span>
          </div>
          <div className="step-dim-name">Review & Submit</div>
          <div className="step-dim-sub">Confirm participant details and submit your review.</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {responsesByDim.map(({ d, responses }) => (
            <div key={d.key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{d.label}</div>
              <div style={{ display: 'grid', gap: 14 }}>
                {responses.map((r, qi) => (
                  <div key={r.id} style={{ padding: 14, border: '1px solid var(--border2)', borderRadius: 12, background: 'var(--s1)' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                      {qi + 1}. {r.text}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{r.answerText}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="participant-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, fontFamily: 'Syne', fontSize: 16 }}>Participants (required)</h3>
          <div className="field">
            <label>Reviewee</label>
            <input value={revieweeName} onChange={(e) => setRevieweeName(e.target.value)} />
          </div>
          <div className="field">
            <label>Reviewer</label>
            <div className="readonly-field">{me.name}</div>
          </div>
        </div>

        <div className="fw-info" style={{ fontSize: 12, color: 'var(--text3)' }}>
          {!revieweeName.trim() || !me?.name ? <strong style={{ color: 'var(--red)' }}>Fill reviewee name and ensure you are signed in as manager before submitting.</strong> : null}
          {submitErr && <div style={{ color: 'var(--red)', marginTop: 8 }}>{submitErr}</div>}
        </div>
      </>
    );
  }

  return (
    <div className="form-shell">
      <nav className="form-nav">
        <div className="nav-left-eo">
          <div className="nav-mark-sm">EO</div>
          <div className="nav-name-eo">EngOps</div>
          <div className="nav-sep" />
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text3)' }}>
            <span className="pulse-dot" />
            <span id="form-nav-title">{form.title}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--text3)' }}>{navStepLabel}</div>
          <button type="button" className="secondary-btn" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </nav>
      <div className="form-overall-bar">
        <div className="form-overall-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="form-body">{body}</div>
      <div className="form-footer">
        <div>
          <div className="footer-step">{footerStep}</div>
          <div className="footer-dim">{footerDim}</div>
        </div>
        <div className="footer-btns">
          {showBack && (
            <button type="button" className="back-btn" onClick={wizardBack}>
              ← Back
            </button>
          )}
          {showNext && (
            <button type="button" className="next-btn" disabled={nextDisabled} onClick={wizardNext}>
              {nextLabel}
            </button>
          )}
          {showSubmit && (
            <button
              type="button"
              className="submit-btn"
              disabled={!revieweeName.trim() || !me?.name}
              onClick={submitForm}
            >
              Submit Review ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
