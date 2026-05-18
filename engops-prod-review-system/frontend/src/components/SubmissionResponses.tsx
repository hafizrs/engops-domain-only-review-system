import React from 'react';
import { DIM_COLORS } from '../questionBank';

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

export function SubmissionResponses({
  detail,
  dimensionScores,
  totalScore,
}: {
  readonly detail?: ResponseDetail[];
  readonly dimensionScores?: DimensionScoreRow[];
  readonly totalScore?: number;
}) {
  if (!detail?.length) {
    return <p style={{ color: 'var(--text3)', margin: 0 }}>No response breakdown available.</p>;
  }

  const scoreByKey = new Map((dimensionScores ?? []).map((d) => [d.dimensionKey, d]));
  const byDim = new Map<string, { label: string; rows: ResponseDetail[] }>();

  for (const r of detail) {
    let group = byDim.get(r.dimensionKey);
    if (!group) {
      group = { label: r.dimensionLabel, rows: [] };
      byDim.set(r.dimensionKey, group);
    }
    group.rows.push(r);
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
        const color = DIM_COLORS[key] || 'var(--accent)';
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
                          {opts.map((o, si) => {
                            let scoreClass = '';
                            if (si === 0) {
                              scoreClass = 's0';
                            } else if (si === 5) {
                              scoreClass = 's5';
                            }
                            return (
                              <div key={`${r.questionId}-${si}`} className={'opt-eo' + (chosen === si ? ' chosen' : '')} aria-current={chosen === si ? 'true' : undefined}>
                                <div className="radio-eo" />
                                <div className="opt-body">{o}</div>
                                <div className={`score-chip ${scoreClass}`}>{si}/5</div>
                              </div>
                            );
                          })}
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
