
import { BEHAVIORAL_PROFILES, type AiEvaluationRecord, type BehavioralProfile } from '../../types/aiEvaluation';

export function BehavioralPanel({ employee }: { employee: AiEvaluationRecord }) {
  const profile = BEHAVIORAL_PROFILES[employee.behavioralProfile];
  return (
    <>
      <div className="ai-eval-card">
        <div className="ai-eval-profile-hero">
          <div className="ai-eval-profile-emoji">{profile.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="ai-eval-card-title" style={{ marginBottom: 4 }}>
              {profile.label}
              <span className={`badge ${profile.badge}`}>Primary profile</span>
            </div>
            <p style={{ margin: '0 0 12px', color: 'var(--text2)', fontSize: 13 }}>{profile.description}</p>
            <p style={{ margin: 0, color: 'var(--text3)', fontSize: 13 }}>
              <strong style={{ color: 'var(--text2)' }}>Manager note:</strong> {employee.behavioralSummary}
            </p>
            <div style={{ marginTop: 14 }}>
              {profile.bestFor.map((t) => (
                <span key={t} className="ai-eval-pill">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ai-eval-section-label">All behavioral profiles (reference)</div>
      <div className="ai-eval-grid2">
        {(Object.entries(BEHAVIORAL_PROFILES) as [BehavioralProfile, (typeof BEHAVIORAL_PROFILES)[BehavioralProfile]][]).map(
          ([key, p]) => (
            <div key={key} className="ai-eval-card">
              <div className="ai-eval-card-title">
                {p.emoji} {p.label}
                {key === employee.behavioralProfile && <span className="badge bg">Current</span>}
              </div>
              <p style={{ margin: 0, color: 'var(--text3)', fontSize: 12 }}>{p.description}</p>
            </div>
          )
        )}
      </div>

      <div className="ai-eval-info purple">
        <strong>Placement rule:</strong> Wrong placement is not always a performance problem. Match behavioral profile to project shape before judging delivery gaps.
      </div>
    </>
  );
}
