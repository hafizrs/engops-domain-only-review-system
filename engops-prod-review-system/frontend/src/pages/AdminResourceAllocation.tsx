import { useEffect, useMemo, useState } from 'react';
import {
  computeAllocationCandidates,
  DEFAULT_PROJECT_SCOPE,
  type ProjectScopeInput,
} from '../data/allocationData';
import type { AiEvaluationRecord } from '../types/aiEvaluation';
import {
  DUMMY_ALLOCATION_RECOMMENDATIONS,
  DUMMY_ALLOCATION_REQUESTS,
} from '../data/performanceDummy';
import { AllocationPanel } from './ai-evaluation/AllocationPanel';
import { EmployeeSidebar } from './ai-evaluation/EmployeeSidebar';
import type { ScopedEmployee } from '../data/evaluationData';
import './ai-evaluation/ai-evaluation.css';

function toScoped(emp: AiEvaluationRecord): ScopedEmployee {
  return {
    ...emp,
    employeeKey: emp.employeeId,
    submissionIds: [],
    submissionCount: 0,
    avgSubmissionScore: emp.calibratedScore,
    formsInvolved: [],
  };
}

const SCOPED_POOL: ScopedEmployee[] = [];

export function AdminResourceAllocation() {
  const [requests, setRequests] = useState(DUMMY_ALLOCATION_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState(DUMMY_ALLOCATION_REQUESTS[0]?.id ?? '');
  const [projectName, setProjectName] = useState('');

  const [selectedKey, setSelectedKey] = useState(SCOPED_POOL[0]?.employeeKey ?? '');
  const [poolKeys, setPoolKeys] = useState<Set<string>>(() => new Set(SCOPED_POOL.map((e) => e.employeeKey)));
  const [projectScope, setProjectScope] = useState<ProjectScopeInput>(DEFAULT_PROJECT_SCOPE);
  const [allocationRun, setAllocationRun] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);
  const rec = selectedRequestId ? DUMMY_ALLOCATION_RECOMMENDATIONS[selectedRequestId] : undefined;

  const poolEmployees = useMemo(
    () => SCOPED_POOL.filter((e) => poolKeys.has(e.employeeKey)),
    [poolKeys]
  );

  const candidates = useMemo(
    () => (allocationRun ? computeAllocationCandidates(projectScope, poolEmployees) : []),
    [allocationRun, projectScope, poolEmployees]
  );

  const aiTeamPick = useMemo(
    () => candidates.filter((c) => c.aiRecommended || c.aiRank <= 2).map((c) => c.employeeId),
    [candidates]
  );

  useEffect(() => {
    if (selectedRequest) {
      setProjectScope((s) => ({
        ...s,
        projectName: selectedRequest.projectName,
        criticality: selectedRequest.criticality,
        timeline: selectedRequest.timeline === 'critical' ? 'aggressive' : selectedRequest.timeline,
      }));
      setAllocationRun(false);
    }
  }, [selectedRequestId]);

  const createRequest = () => {
    if (!projectName.trim()) return;
    const id = `alloc-req-${Date.now()}`;
    setRequests([
      {
        id,
        projectName: projectName.trim(),
        domain: 'fullstack',
        complexity: 'medium',
        criticality: 'medium',
        timeline: 'normal',
        teamSizeRequired: selectedRequest?.teamSizeRequired ?? 3,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      ...requests,
    ]);
    setSelectedRequestId(id);
    setProjectName('');
  };

  const handleRunAllocation = () => {
    setChecking(true);
    setAllocationRun(false);
    setTimeout(() => {
      const ranked = computeAllocationCandidates(projectScope, poolEmployees);
      const size = selectedRequest?.teamSizeRequired ?? 3;
      const top = ranked.slice(0, Math.min(size, ranked.length)).map((c) => c.employeeId);
      setSelectedTeamIds(new Set(top));
      setAllocationRun(true);
      setChecking(false);
      setRequests((list) =>
        list.map((r) => (r.id === selectedRequestId ? { ...r, status: 'ai_generated' as const } : r))
      );
    }, 900);
  };

  const updateScope = <K extends keyof ProjectScopeInput>(key: K, value: ProjectScopeInput[K]) => {
    setProjectScope((s) => ({ ...s, [key]: value }));
    setAllocationRun(false);
  };

  return (
    <div className="anim">
      <div className="ai-eval-header">
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
          Resource allocation
        </div>
        <h1>Project team fit</h1>
        <p>
          Define project context, pick an employee pool, run AI fit check. Behavioral fit first, then skills and
          availability. Manager approves the final team.
        </p>
      </div>

      <div className="ai-eval-card" style={{ marginBottom: 16 }}>
        <div className="ai-eval-card-title">Project requests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {requests.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`ai-eval-tab ${selectedRequestId === r.id ? 'active' : ''}`}
              onClick={() => setSelectedRequestId(r.id)}
            >
              {r.projectName}
              <span className="badge bt" style={{ marginLeft: 6 }}>
                {r.status}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="ai-eval-field" style={{ flex: '1 1 200px', margin: 0 }}>
            <label>New project</label>
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" />
          </div>
          <button type="button" className="secondary-btn" onClick={createRequest}>
            Add request
          </button>
        </div>
        {rec && (
          <div className="ai-eval-info teal" style={{ marginTop: 12 }}>
            {rec.teamCompositionSummary} · Confidence {rec.aiConfidence}%
            {rec.missingSkills.length > 0 && ` · Gap: ${rec.missingSkills.join(', ')}`}
          </div>
        )}
      </div>

      <div className="ai-eval-page">
        <EmployeeSidebar
          employees={SCOPED_POOL}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          poolKeys={poolKeys}
          onTogglePool={(key) =>
            setPoolKeys((s) => {
              const n = new Set(s);
              if (n.has(key)) n.delete(key);
              else n.add(key);
              return n;
            })
          }
          onSelectAllPool={() => setPoolKeys(new Set(SCOPED_POOL.map((e) => e.employeeKey)))}
          onClearPool={() => setPoolKeys(new Set())}
          listMode="pool"
          emptyMessage="No employees in directory."
        />
        <div className="ai-eval-main">
          <AllocationPanel
            projectScope={projectScope}
            updateScope={updateScope}
            poolEmployees={poolEmployees}
            poolIds={poolKeys}
            candidates={candidates}
            allocationRun={allocationRun}
            checking={checking}
            onRunCheck={handleRunAllocation}
            selectedTeamIds={selectedTeamIds}
            onToggleTeam={(id) =>
              setSelectedTeamIds((s) => {
                const n = new Set(s);
                if (n.has(id)) n.delete(id);
                else n.add(id);
                return n;
              })
            }
            aiTeamPick={aiTeamPick}
          />
        </div>
      </div>
    </div>
  );
}
