from pathlib import Path
BASE = Path(__file__).resolve().parent.parent / "src" / "pages"

def w(path, s):
    text = s.replace("<<O>>", "<motionDim").replace("<<C>>", "</motionDim>")
    text = text.replace("motionDiv", "div")
    (BASE / path).write_text(text, encoding="utf-8")
    print(path)

# fix: motionDiv was wrong - use div directly in replace
def w2(path, s):
    text = s.replace("<<O>>", "<div").replace("<<C>>", "</div>")
    (BASE / path).write_text(text, encoding="utf-8")
    print(path)

w2("ai-evaluation/employeeFilters.ts", '''
import type { AiEvaluationRecord, BehavioralProfile, EmployeeRole } from "../../data/aiEvaluationDummy";
import { DUMMY_EMPLOYEES } from "../../data/aiEvaluationDummy";

export type GenerateScope = "single" | "all" | "filtered";

export type ReviewFilters = {
  role: EmployeeRole | "all";
  department: string;
  band: string;
  behavioral: BehavioralProfile | "all";
  search: string;
};

export const DEFAULT_FILTERS: ReviewFilters = {
  role: "all",
  department: "all",
  band: "all",
  behavioral: "all",
  search: "",
};

export function getDepartments(employees = DUMMY_EMPLOYEES) {
  return [...new Set(employees.map((e) => e.department))].sort();
}

export function applyFilters(employees: AiEvaluationRecord[], filters: ReviewFilters) {
  const q = filters.search.trim().toLowerCase();
  return employees.filter((e) => {
    if (filters.role !== "all" && e.role !== filters.role) return false;
    if (filters.department !== "all" && e.department !== filters.department) return false;
    if (filters.band !== "all" && e.performanceBand !== filters.band) return false;
    if (filters.behavioral !== "all" && e.behavioralProfile !== filters.behavioral) return false;
    if (q && !e.employeeName.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function resolveGenerateTargets(
  scope: GenerateScope,
  all: AiEvaluationRecord[],
  selectedId: string,
  filters: ReviewFilters
) {
  if (scope === "single") {
    const one = all.find((e) => e.employeeId === selectedId);
    return one ? [one] : [];
  }
  if (scope === "all") return all;
  return applyFilters(all, filters);
}
''')

w2("ai-evaluation/GeneratePanel.tsx", '''
import type { AiEvaluationRecord, EmployeeRole } from "../../data/aiEvaluationDummy";
import { BEHAVIORAL_PROFILES, type BehavioralProfile } from "../../data/aiEvaluationDummy";
import { BAND_CLASS, ROLE_LABELS } from "./constants";
import type { GenerateScope, ReviewFilters } from "./employeeFilters";

type Props = {
  scope: GenerateScope;
  setScope: (s: GenerateScope) => void;
  filters: ReviewFilters;
  setFilters: (f: ReviewFilters) => void;
  departments: string[];
  targetEmployees: AiEvaluationRecord[];
  generatedIds: Set<string>;
  generating: boolean;
  onGenerate: () => void;
  selectedId: string;
  onViewReview: (id: string) => void;
};

export function GeneratePanel(props: Props) {
  const { scope, setScope, filters, setFilters, departments, targetEmployees, generatedIds, generating, onGenerate, selectedId, onViewReview } = props;
  const generatedCount = targetEmployees.filter((e) => generatedIds.has(e.employeeId)).length;
  const selectedName = targetEmployees.find((e) => e.employeeId === selectedId)?.employeeName;

  return (
    <>
      <<O>> className="ai-eval-card">
        <<O>> className="ai-eval-card-title">Generate AI evaluation <span className="badge bp">UI · LangGraph later</span><<C>>
        <p style={{ margin: "0 0 16px", color: "var(--text3)", fontSize: 13 }}>
          Run AI review for one person, everyone, or a filtered group. Output is draft until the manager approves.
        </p>
        <<O>> className="ai-eval-gen-scope">
          <ScopeBtn active={scope === "single"} title="One employee" desc="Uses sidebar selection" onClick={() => setScope("single")} />
          <ScopeBtn active={scope === "all"} title="All employees" desc="Full roster batch" onClick={() => setScope("all")} />
          <ScopeBtn active={scope === "filtered"} title="Filter-wise" desc="Role, dept, band, profile" onClick={() => setScope("filtered")} />
        <<C>>
        {scope === "single" && (
          <<O>> className="ai-eval-info purple" style={{ marginTop: 14 }}>Target: <strong>{selectedName ?? "Select employee in sidebar"}</strong><<C>>
        )}
        {scope === "filtered" && (
          <<O>> className="ai-eval-filter-grid" style={{ marginTop: 16 }}>
            <Fs label="Role" value={filters.role} onChange={(v) => setFilters({ ...filters, role: v as EmployeeRole | "all" })} opts={[["all", "All roles"], ...Object.entries(ROLE_LABELS)]} />
            <Fs label="Department" value={filters.department} onChange={(v) => setFilters({ ...filters, department: v })} opts={[["all", "All"], ...departments.map((d) => [d, d])]} />
            <Fs label="Band" value={filters.band} onChange={(v) => setFilters({ ...filters, band: v })} opts={[["all", "All"], ["Excellent", "Excellent"], ["Good", "Good"], ["Needs Focus", "Needs Focus"], ["At Risk", "At Risk"]]} />
            <Fs label="Behavioral" value={filters.behavioral} onChange={(v) => setFilters({ ...filters, behavioral: v as BehavioralProfile | "all" })} opts={[["all", "All"], ...Object.entries(BEHAVIORAL_PROFILES).map(([k, p]) => [k, p.label])]} />
            <<O>> className="ai-eval-field" style={{ gridColumn: "1 / -1" }}><label>Search</label><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or email" /><<C>>
          <<C>>
        )}
        <<O>> className="ai-eval-gen-actions">
          <<O>> className="ai-eval-gen-meta">
            <span className="badge bt">{targetEmployees.length} targeted</span>
            <span className="badge bg">{generatedCount} generated</span>
          <<C>>
          <button type="button" className="primary-btn" disabled={generating || targetEmployees.length === 0} onClick={onGenerate}>
            {generating ? "Generating…" : "Generate AI evaluation"}
          </button>
        <<C>>
      <<C>>
      <<O>> className="ai-eval-card">
        <<O>> className="ai-eval-card-title">Batch status<<C>>
        <<O>> className="ai-eval-table-wrap"><table className="ai-eval-table"><thead><tr><th>Employee</th><th>Role</th><th>Band</th><th>Score</th><th>Status</th><th /></tr></thead><tbody>
          {targetEmployees.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No employees in scope</td></tr>
          ) : targetEmployees.map((e) => (
            <tr key={e.employeeId}>
              <td><strong>{e.employeeName}</strong><<O>> style={{ fontSize: 11, color: "var(--text3)" }}>{e.email}<<C>><<C>>
              <td>{ROLE_LABELS[e.role]}</td>
              <td><span className={`badge ${BAND_CLASS[e.performanceBand] ?? "bp"}`}>{e.performanceBand}</span></td>
              <td style={{ fontFamily: "DM Mono" }}>{e.calibratedScore}</td>
              <td>{generatedIds.has(e.employeeId) ? <span className="badge bg">Generated</span> : <span className="badge ba">Pending</span>}</td>
              <td>{generatedIds.has(e.employeeId) && <button type="button" className="secondary-btn" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => onViewReview(e.employeeId)}>View</button>}</td>
            </tr>
          ))}
        </tbody></table><<C>>
      <<C>>
    </>
  );
}

function ScopeBtn({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return <button type="button" className={`ai-eval-scope-btn ${active ? "active" : ""}`} onClick={onClick}><strong>{title}</strong><span>{desc}</span></button>;
}

function Fs({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: string[][] }) {
  return (
    <<O>> className="ai-eval-field"><label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>{opts.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
    <<C>>
  );
}
''')

w2("ai-evaluation/EmployeeSidebar.tsx", '''
import type { AiEvaluationRecord } from "../../data/aiEvaluationDummy";
import { ROLE_LABELS } from "./constants";

type Props = {
  employees: AiEvaluationRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  poolIds: Set<string>;
  onTogglePool: (id: string) => void;
  onSelectAllPool: () => void;
  onClearPool: () => void;
  listMode: "view" | "pool";
};

export function EmployeeSidebar({ employees, selectedId, onSelect, poolIds, onTogglePool, onSelectAllPool, onClearPool, listMode }: Props) {
  return (
    <aside className="ai-eval-sidebar">
      <<O>> className="ai-eval-sidebar-head">
        <h2>{listMode === "pool" ? "Allocation pool" : "Employees"}</h2>
        <<O>> style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
          {listMode === "pool" ? `${poolIds.size} selected for fit check` : `${employees.length} shown`}
        <<C>>
        {listMode === "pool" && (
          <<O>> style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" className="secondary-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={onSelectAllPool}>Select all</button>
            <button type="button" className="secondary-btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={onClearPool}>Clear</button>
          <<C>>
        )}
      <<C>>
      {employees.map((e) => {
        const inPool = poolIds.has(e.employeeId);
        const active = selectedId === e.employeeId;
        return (
          <<O>> key={e.employeeId} className={`ai-eval-emp-row ${active ? "active" : ""}`}>
            {listMode === "pool" && (
              <input type="checkbox" checked={inPool} onChange={() => onTogglePool(e.employeeId)} onClick={(ev) => ev.stopPropagation()} />
            )}
            <button type="button" className="ai-eval-emp-btn-inner" onClick={() => onSelect(e.employeeId)}>
              <<O>> className="ai-eval-emp-name">{e.employeeName}<<C>>
              <<O>> className="ai-eval-emp-meta">{ROLE_LABELS[e.role]} · {e.performanceBand} · {e.calibratedScore}<<C>>
            </button>
          <<C>>
        );
      })}
    </aside>
  );
}
''')

w2("ai-evaluation/AllocationPanel.tsx", '''
import React from "react";
import {
  BEHAVIORAL_PROFILES,
  PROJECT_TYPES,
  type AiEvaluationRecord,
  type AllocationCandidate,
  type ProjectScopeInput,
} from "../../data/aiEvaluationDummy";
import { ROLE_LABELS } from "./constants";

function ScopeField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <<O>> className="ai-eval-field" style={full ? { gridColumn: "1 / -1" } : undefined}><label>{label}</label>{children}<<C>>
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
      <<O>> className="ai-eval-info purple">
        Step 1: Define project context and scope. Step 2: Select employees in the sidebar pool. Step 3: Run fit check. Step 4: Confirm team (AI suggests top matches).
      <<C>>
      <<O>> className="ai-eval-card">
        <<O>> className="ai-eval-card-title">Project context & scope<<C>>
        <<O>> className="ai-eval-form-grid">
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
        <<C>>
        <ScopeField label="Scope summary" full><textarea value={projectScope.scopeSummary} onChange={(e) => updateScope("scopeSummary", e.target.value)} /></ScopeField>
        <ScopeField label="Required skills (comma-separated)" full>
          <input value={projectScope.requiredSkills.join(", ")} onChange={(e) => updateScope("requiredSkills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
        </ScopeField>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text3)" }}>{PROJECT_TYPES[projectScope.projectType].description}</p>
      <<C>>

      <<O>> className="ai-eval-card">
        <<O>> className="ai-eval-gen-actions">
          <<O>> className="ai-eval-gen-meta">
            <span className="badge bt">{poolIds.size} in pool</span>
            <span className="badge ba">{poolEmployees.length} visible</span>
          <<C>>
          <button type="button" className="primary-btn" disabled={poolIds.size === 0 || checking} onClick={onRunCheck}>
            {checking ? "Checking fit…" : "Run allocation check"}
          </button>
        <<C>>
        {poolIds.size === 0 && <p style={{ marginTop: 12, fontSize: 13, color: "var(--amber)" }}>Select at least one employee in the sidebar pool.</p>}
      <<C>>

      {allocationRun && (
        <>
          <<O>> className="ai-eval-section-label">Fit results · from selected pool only<<C>>
          {candidates.length === 0 ? (
            <<O>> className="ai-eval-info amber">No results — expand your selection pool.<<C>>
          ) : candidates.map((c) => {
            const isAi = aiTeamPick.includes(c.employeeId);
            const isSelected = selectedTeamIds.has(c.employeeId);
            return (
              <label key={c.employeeId} className={`ai-eval-candidate ${isSelected ? "selected" : ""} ${isAi ? "ai-pick" : ""}`} style={{ display: "block", cursor: "pointer" }}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleTeam(c.employeeId)} style={{ marginRight: 10 }} />
                <<O>> className="ai-eval-candidate-head">
                  <<O>><strong>{c.employeeName}</strong><span style={{ marginLeft: 8, fontSize: 11, color: "var(--text3)" }}>{ROLE_LABELS[c.role]} · {BEHAVIORAL_PROFILES[c.behavioralProfile].label}</span>
                    <<O>> style={{ marginTop: 6 }}>{isAi && <span className="badge bt">AI suggested</span>}{isSelected && <span className="badge bp">On team</span>}<span className="badge bb">Rank #{c.aiRank}</span><<C>>
                  <<C>>
                  <<O>> className="ai-eval-fit-score">{c.fitScore}%<<C>>
                <<C>>
                <<O>> style={{ marginTop: 10, fontSize: 12, color: "var(--text2)" }}>
                  {c.fitReasons.map((r) => <<O>> key={r} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: "var(--green)" }} />{r}<<C>>)}
                  {c.warnings.map((w) => <<O>> key={w} className="ai-eval-flag"><span className="ai-eval-dot" style={{ background: "var(--amber)" }} />{w}<<C>>)}
                <<C>>
              </label>
            );
          })}
          {selectedTeamIds.size > 0 && (
            <<O>> className="ai-eval-info teal" style={{ marginTop: 14 }}>
              <strong>Selected team ({selectedTeamIds.size}):</strong>{" "}
              {candidates.filter((c) => selectedTeamIds.has(c.employeeId)).map((c) => c.employeeName).join(", ")}
            <<C>>
          )}
        </>
      )}
    </>
  );
}
''')

w2("AdminAiEvaluation.tsx", '''
import { useMemo, useState } from "react";
import {
  computeAllocationCandidates,
  DEFAULT_PROJECT_SCOPE,
  DUMMY_EMPLOYEES,
  type ProjectScopeInput,
} from "../data/aiEvaluationDummy";
import { AllocationPanel } from "./ai-evaluation/AllocationPanel";
import { AiInsightsPanel } from "./ai-evaluation/AiInsightsPanel";
import { BehavioralPanel } from "./ai-evaluation/BehavioralPanel";
import { DecisionPanel } from "./ai-evaluation/DecisionPanel";
import { EmployeeSidebar } from "./ai-evaluation/EmployeeSidebar";
import { DEFAULT_FILTERS, applyFilters, getDepartments, resolveGenerateTargets, type GenerateScope, type ReviewFilters } from "./ai-evaluation/employeeFilters";
import { GeneratePanel } from "./ai-evaluation/GeneratePanel";
import { PerformancePanel } from "./ai-evaluation/PerformancePanel";
import { ROLE_LABELS } from "./ai-evaluation/constants";
import "./ai-evaluation/ai-evaluation.css";

type Workflow = "generate" | "review" | "allocate";
type ReviewTab = "performance" | "behavioral" | "ai-insights" | "decision";

const WORKFLOWS: { id: Workflow; label: string }[] = [
  { id: "generate", label: "1 · Generate" },
  { id: "review", label: "2 · Review" },
  { id: "allocate", label: "3 · Allocate" },
];

const REVIEW_TABS: { id: ReviewTab; label: string }[] = [
  { id: "performance", label: "Performance" },
  { id: "behavioral", label: "Behavioral" },
  { id: "ai-insights", label: "AI insights" },
  { id: "decision", label: "Decision" },
];

export function AdminAiEvaluation() {
  const [workflow, setWorkflow] = useState<Workflow>("generate");
  const [reviewTab, setReviewTab] = useState<ReviewTab>("performance");
  const [selectedId, setSelectedId] = useState(DUMMY_EMPLOYEES[0].employeeId);
  const [generateScope, setGenerateScope] = useState<GenerateScope>("single");
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS);
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(() => new Set([DUMMY_EMPLOYEES[0].employeeId]));
  const [generating, setGenerating] = useState(false);
  const [poolIds, setPoolIds] = useState<Set<string>>(() => new Set(DUMMY_EMPLOYEES.map((e) => e.employeeId)));
  const [projectScope, setProjectScope] = useState<ProjectScopeInput>(DEFAULT_PROJECT_SCOPE);
  const [allocationRun, setAllocationRun] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [managerDecision, setManagerDecision] = useState<"pending" | "approved" | "override">("pending");
  const [overrideReason, setOverrideReason] = useState("");

  const departments = useMemo(() => getDepartments(), []);
  const sidebarList = useMemo(() => applyFilters(DUMMY_EMPLOYEES, filters), [filters]);
  const generateTargets = useMemo(
    () => resolveGenerateTargets(generateScope, DUMMY_EMPLOYEES, selectedId, filters),
    [generateScope, selectedId, filters]
  );
  const employee = DUMMY_EMPLOYEES.find((e) => e.employeeId === selectedId) ?? DUMMY_EMPLOYEES[0];
  const poolEmployees = useMemo(() => DUMMY_EMPLOYEES.filter((e) => poolIds.has(e.employeeId)), [poolIds]);
  const candidates = useMemo(
    () => (allocationRun ? computeAllocationCandidates(projectScope, poolEmployees) : []),
    [allocationRun, projectScope, poolEmployees]
  );
  const aiTeamPick = useMemo(() => candidates.filter((c) => c.aiRecommended || c.aiRank <= 2).map((c) => c.employeeId), [candidates]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGeneratedIds((prev) => {
        const next = new Set(prev);
        generateTargets.forEach((e) => next.add(e.employeeId));
        return next;
      });
      setGenerating(false);
    }, 1200);
  };

  const handleRunAllocation = () => {
    setChecking(true);
    setAllocationRun(false);
    setTimeout(() => {
      const ranked = computeAllocationCandidates(projectScope, poolEmployees);
      const top = ranked.slice(0, Math.min(2, ranked.length)).map((c) => c.employeeId);
      setSelectedTeamIds(new Set(top));
      setAllocationRun(true);
      setChecking(false);
    }, 900);
  };

  const updateScope = <K extends keyof ProjectScopeInput>(key: K, value: ProjectScopeInput[K]) => {
    setProjectScope((s) => ({ ...s, [key]: value }));
    setAllocationRun(false);
  };

  return (
    <<O>> className="anim">
      <<O>> className="ai-eval-header">
        <<O>> style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>AI evaluation · UI only<<C>>
        <h1>Performance & resource allocation</h1>
        <p>Generate AI reviews (single, all, or filtered), inspect each employee, then run allocation against a selected employee pool.</p>
      <<C>>
      <<O>> className="ai-eval-workflow-tabs">
        {WORKFLOWS.map((w) => (
          <button key={w.id} type="button" className={`ai-eval-workflow-tab ${workflow === w.id ? "active" : ""}`} onClick={() => setWorkflow(w.id)}>{w.label}</button>
        ))}
      <<C>>
      <<O>> className="ai-eval-page">
        <EmployeeSidebar
          employees={sidebarList}
          selectedId={selectedId}
          onSelect={setSelectedId}
          poolIds={poolIds}
          onTogglePool={(id) => setPoolIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
          onSelectAllPool={() => setPoolIds(new Set(sidebarList.map((e) => e.employeeId)))}
          onClearPool={() => setPoolIds(new Set())}
          listMode={workflow === "allocate" ? "pool" : "view"}
        />
        <<O>> className="ai-eval-main">
          {workflow === "generate" && (
            <GeneratePanel scope={generateScope} setScope={setGenerateScope} filters={filters} setFilters={setFilters} departments={departments} targetEmployees={generateTargets} generatedIds={generatedIds} generating={generating} onGenerate={handleGenerate} selectedId={selectedId} onViewReview={(id) => { setSelectedId(id); setWorkflow("review"); }} />
          )}
          {workflow === "review" && (
            <>
              {!generatedIds.has(employee.employeeId) && (
                <<O>> className="ai-eval-info amber" style={{ marginBottom: 14 }}>AI review not generated yet for this employee. Go to Generate tab first.<<C>>
              )}
              <<O>> style={{ marginBottom: 16, padding: "14px 18px", background: "var(--s2)", borderRadius: 12, border: "1px solid var(--border2)" }}>
                <<O>> style={{ fontWeight: 700, fontSize: 16 }}>{employee.employeeName}<<C>>
                <<O>> style={{ fontSize: 13, color: "var(--text3)" }}>{employee.title} · {employee.department} · {employee.tenure}<<C>>
                <<O>> style={{ marginTop: 8 }}>{employee.techStack.map((t) => <span key={t} className="ai-eval-pill">{t}</span>)}<<C>>
              <<C>>
              <<O>> className="ai-eval-tabs">{REVIEW_TABS.map((t) => (
                <button key={t.id} type="button" className={`ai-eval-tab ${reviewTab === t.id ? "active" : ""}`} onClick={() => setReviewTab(t.id)}>{t.label}</button>
              ))}<<C>>
              <<O>> className={`ai-eval-panel ${reviewTab === "performance" ? "active" : ""}`}><PerformancePanel employee={employee} /><<C>>
              <<O>> className={`ai-eval-panel ${reviewTab === "behavioral" ? "active" : ""}`}><BehavioralPanel employee={employee} /><<C>>
              <<O>> className={`ai-eval-panel ${reviewTab === "ai-insights" ? "active" : ""}`}><AiInsightsPanel employee={employee} /><<C>>
              <<O>> className={`ai-eval-panel ${reviewTab === "decision" ? "active" : ""}`}>
                <DecisionPanel employee={employee} managerDecision={managerDecision} setManagerDecision={setManagerDecision} overrideReason={overrideReason} setOverrideReason={setOverrideReason} effectiveAssigneeName={candidates.find((c) => selectedTeamIds.has(c.employeeId))?.employeeName} aiPickName={candidates.find((c) => c.aiRecommended)?.employeeName} hasOverride={false} />
              <<C>>
            </>
          )}
          {workflow === "allocate" && (
            <AllocationPanel projectScope={projectScope} updateScope={updateScope} poolEmployees={poolEmployees} poolIds={poolIds} candidates={candidates} allocationRun={allocationRun} checking={checking} onRunCheck={handleRunAllocation} selectedTeamIds={selectedTeamIds} onToggleTeam={(id) => setSelectedTeamIds((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })} aiTeamPick={aiTeamPick} />
          )}
        <<C>>
      <<C>>
    <<C>>
  );
}
''')
