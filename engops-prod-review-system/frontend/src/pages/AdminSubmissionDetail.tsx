import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { SubmissionResponses } from '../components/SubmissionResponses';

export function AdminSubmissionDetail() {
  const { code, submissionId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    if (!code) return;
    api.get('/review-forms/code/' + code).then((r) => setForm(r.data)).catch(() => setLoadErr('Invalid review link code.'));
    api.get('/submissions/form/' + code).then((r) => setSubs(r.data)).catch(() => setSubs([]));
  }, [code]);

  const selected = useMemo(
    () => subs.find((s) => s._id === submissionId) ?? null,
    [subs, submissionId]
  );

  if (loadErr) {
    return (
      <div className="screen-center">
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Review link not found</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>The review link code could not be loaded. Go back to the submissions list and try again.</div>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
            Submission details
          </div>
          <h1 style={{ margin: 0, fontSize: 34 }}>{form.title}</h1>
          <div style={{ marginTop: 8, color: 'var(--text3)' }}>
            Review link code <span style={{ fontFamily: 'DM Mono', color: 'var(--text2)' }}>{code}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/admin/submissions" className="secondary-btn" style={{ textDecoration: 'none' }}>
            Back to submissions
          </Link>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate('/admin/create')}
            style={{ textDecoration: 'none' }}
          >
            Create review form
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
        <section style={{ background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Submissions</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{subs.length} total</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Select any submission to view the sidebar details.</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border2)', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono' }}>
                  <th style={{ padding: 14 }}>Reviewer</th>
                  <th style={{ padding: 14 }}>Reviewee</th>
                  <th style={{ padding: 14 }}>Score</th>
                  <th style={{ padding: 14 }}>Submitted</th>
                  <th style={{ padding: 14 }} />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr
                    key={s._id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: selected?._id === s._id ? 'rgba(123,110,246,0.06)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 14 }}>
                      {s.reviewerName}
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.reviewerEmail}</span>
                    </td>
                    <td style={{ padding: 14 }}>{s.revieweeName}</td>
                    <td style={{ padding: 14 }}>{s.totalScore}</td>
                    <td style={{ padding: 14, fontSize: 12, color: 'var(--text3)' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                    <td style={{ padding: 14 }}>
                      <Link
                        to={`/admin/submissions/${code}/${s._id}`}
                        className="secondary-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 18, color: 'var(--text3)' }}>
                      No submissions have been recorded for this review link yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 18, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)' }}>Details sidebar</div>
            <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}>Selected submission</div>
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            {!selected ? (
              <div style={{ color: 'var(--text3)' }}>Choose a submission from the left column to see reviewer answers, scores, and response detail here.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <div style={{ padding: 14, background: 'var(--s2)', borderRadius: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Reviewer</div>
                    <div style={{ fontWeight: 700 }}>{selected.reviewerName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selected.reviewerEmail}</div>
                  </div>
                  <div style={{ padding: 14, background: 'var(--s2)', borderRadius: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Reviewee</div>
                    <div style={{ fontWeight: 700 }}>{selected.revieweeName}</div>
                  </div>
                </div>
                <div style={{ padding: 14, background: 'var(--s2)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Final score</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent2)' }}>{selected.totalScore}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(selected.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <SubmissionResponses
                    detail={selected.responseDetails}
                    dimensionScores={selected.dimensionScores}
                    totalScore={selected.totalScore}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
