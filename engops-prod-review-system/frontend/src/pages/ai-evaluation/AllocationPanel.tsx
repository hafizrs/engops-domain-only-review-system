
import React from "react";
import { type AllocationCandidate, type ProjectScopeInput } from "../../data/allocationData";
import { BEHAVIORAL_PROFILES, PROJECT_TYPES, type AiEvaluationRecord } from "../../types/aiEvaluation";
import { ROLE_LABELS } from "./constants";

function ScopeField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className="ai-eval-field" style={full ? { gridColumn: "1 / -1" } : undefined}><label>{label}</label>{children}</div>
  );
}

type Props = {
  projectScope: ProjectScopeInput;
  updateScope: <K extends keyof ProjectScopeInput>(key: K, value: ProjectScopeInput[K]) => void;
  poolEmployees: AiEvaluationRecord[];
  poolIds: Set<string>;
  candidates: AllocationCandidate[];
  allocationRun: boolean;
  checking: boolean;
  onRunCheck: () => void;
  selectedTeamIds: Set<string>;
  onToggleTeam: (id: string) => void;
  aiTeamPick: string[];
};

export function AllocationPanel({ projectScope, updateScope, poolEmployees, poolIds, candidates, allocationRun, checking, onRunCheck, selectedTeamIds, onToggleTeam, aiTeamPick }: Props) {
  return (
    <>
      <div className="ai-eval-info purple">
        Define project context, select employees in the pool sidebar, run fit check, then confirm the team (AI suggests top matches).
      </div>
      <div className="ai-eval-card">
        <div className="ai-eval-card-title">Project context & scope</div>
        <div className="ai-eval-form-grid">
          <ScopeField label="Project name"><input value={projectScope.projectName} onChange={(e) => updateScope("projectName", e.target.value)} /></ScopeField>
          <ScopeField label="Project type">
            <select value={projectScope.projectType} onChange={(e) => updateScope("projectType", e.target.value as ProjectScopeInput["projectType"])}>
              {Object.entries(PROJECT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </ScopeField>
          <ScopeField label="Complexity">
            <select value={projectScope.complexity} onChange={(e) => updateScope("complexity", e.target.value as ProjectScopeInput["complexity"])}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Uncertainty">
            <select value={projectScope.uncertainty} onChange={(e) => updateScope("uncertainty", e.target.value as ProjectScopeInput["uncertainty"])}>
              <option value="clear">Clear</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Criticality">
            <select value={projectScope.criticality} onChange={(e) => updateScope("criticality", e.target.value as ProjectScopeInput["criticality"])}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </ScopeField>
          <ScopeField label="Timeline">
            <select value={projectScope.timeline} onChange={(e) => updateScope("timeline", e.target.value as ProjectScopeInput["timeline"])}>
              <option value="normal">Normal</option><option value="aggressive">Aggressive</option><option value="critical">Critical</option>
            </select>
          </ScopeField>
          <ScopeField label="Domain">
            <select value={projectScope.domain} onChange={(e) => updateScope("domain", e.target.value as ProjectScopeInput["domain"])}>
              <option value="fe">Frontend</option><option value="be">Backend</option><option value="fullstack">Fullstack</option>
              <option value="infra">Infra</option><option value="support">Support</option>
            </select>
          </ScopeField>
          <ScopeField label="Cross-team">
            <select value={projectScope.crossTeam ? "yes" : "no"} onChange={(e) => updateScope("crossTeam", e.target.value === "yes")}>
              <option value="no">No</option><option value="yes">Yes</option>
            </select>
          </ScopeField>
          <ScopeField label="Weeks"><input type="number" min={1} max={52} value={projectScope.estimatedWeeks} onChange={(e) => updateScope("estimatedWeeks", Number(e.target.value))} /></ScopeField>
        </div>
        <ScopeField label="Scope summary" full><textarea value={projectScope.scopeSummary} onChange={(e) => updateScope("scopeSummary", e.target.value)} /></ScopeField>
        <ScopeField label="Required skills (comma-separated)" full>
          <input value={projectScope.requiredSkills.join(", ")} onChange={(e) => updateScope("requiredSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        </ScopeField>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text3)" }}>{PROJECT_TYPES[projectScope.projectType].description}</p>
      </div>

      <div className="ai-eval-card">
        <div className="ai-eval-gen-actions">
          <div className="ai-eval-gen-meta">
            <span className="badge bt">{poolIds.size} in pool</span>
            <span className="badge ba">{poolEmployees.length} visible</span>
          </div>
          <button type="button" className="primary-btn" disabled={poolIds.size === 0 || checking} onClick={onRunCheck}>
            {checking ? "Checking fit…" : "Run allocation check"}
          </button>
        </div>
        {poolIds.size === 0 && <p style={{ marginTop: 12, fontSize: 13, color: "var(--amber)" }}>Select at least one employee in the sidebar pool.</p>}
      </div>

      {allocationRun && (
        <>
          <div className="ai-eval-section-label">Fit results · from selected pool only</div>
          {candidates.length === 0 ? (
            <div className="ai-eval-info amber">No results — expand your selection pool.</div>
          ) : candidates.map((c) => {
            const isAi = aiTeamPick.includes(c.employeeId);
            const isSelected = selectedTeamIds.has(c.employeeId);
            return (
              <label key={c.employeeId} className={`ai-eval-candidate ${isSelected ? "selected" : ""} ${isAi ? "ai-pick" : ""}`} style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleTeam(c.employeeId)} style={{ marginRight: 10 }} />
                <div className="ai-eval-candidate-head">
                  <div><strong>{c.employeeName}</strong><span style={{ marginLeft: 8, fontSize: 11, color: "var(--text3)" }}>{ROLE_LABELS[c.role]} · {BEHAVIORAL_PROFILES[c.behavioralProfile].label}</span>
                    <div style={{ marginTop: 6 }}>{isAi && <span className="badge bt">AI suggested</span>}{isSelected && <span className="badge bp">On team</span>}<span className="badge bb">Rank #{c.aiRank}</span></div>
                  </div>
                  <div className="ai-eval-fit-score">{c.fitScore}%</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text2)" }}>
                  {c.fitReasons.map((r) => <div key={r} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: "var(--green)" }} />{r}</div>)}
                  {c.warnings.map((w) => <div key={w} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: "var(--amber)" }} />{w}</div>)}
                </div>
              </label>
            );
          })}
          {selectedTeamIds.size > 0 && (
            <div className="ai-eval-info teal" style={{ marginTop: 14 }}>
              <strong>Selected team ({selectedTeamIds.size}):</strong>{" "}
              {candidates.filter((c) => selectedTeamIds.has(c.employeeId)).map((c) => c.employeeName).join(", ")}
            </div>
          )}
        </>
      )}
    </>
  );
}
