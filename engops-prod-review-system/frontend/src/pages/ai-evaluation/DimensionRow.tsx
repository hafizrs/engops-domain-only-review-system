export function DimensionRow({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100;
  return (
    <div className="ai-eval-dim-row">
      <div>
        <div style={{ fontSize: 13 }}>{label}</div>
        <div className="ai-eval-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div style={{ fontFamily: 'DM Mono', fontSize: 13, color: 'var(--accent2)', textAlign: 'center' }}>{score}/5</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono', textAlign: 'right' }}>{Math.round(pct)}%</div>
    </div>
  );
}
