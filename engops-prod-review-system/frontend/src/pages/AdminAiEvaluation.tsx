import { useEffect, useMemo, useState } from 'react';
import type { ScopedEmployee } from '../data/evaluationData';
import { AdminContextBar } from './ai-evaluation/AdminContextBar';
import { AiInsightsPanel } from './ai-evaluation/AiInsightsPanel';
import { BehavioralPanel } from './ai-evaluation/BehavioralPanel';
import { DecisionPanel } from './ai-evaluation/DecisionPanel';
import { EmployeeSidebar } from './ai-evaluation/EmployeeSidebar';
import { GeneratePanel, type GenerateScope } from './ai-evaluation/GeneratePanel';
import { PerformancePanel } from './ai-evaluation/PerformancePanel';
import { SetupPanel } from './ai-evaluation/SetupPanel';
import { SubmissionEvidencePanel } from './ai-evaluation/SubmissionEvidencePanel';
import { useEvaluationData } from './ai-evaluation/useEvaluationData';
import './ai-evaluation/ai-evaluation.css';

type Workflow = 'setup' | 'generate' | 'review';
type ReviewTab = 'evidence' | 'performance' | 'behavioral' | 'ai-insights' | 'decision';

const WORKFLOWS: { id: Workflow; label: string }[] = [
  { id: 'setup', label: '1 · Scope' },
  { id: 'generate', label: '2 · Generate' },
  { id: 'review', label: '3 · Review' },
];

const REVIEW_TABS: { id: ReviewTab; label: string }[] = [
  { id: 'evidence', label: 'Submissions' },
  { id: 'performance', label: 'Performance' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'ai-insights', label: 'AI insights' },
  { id: 'decision', label: 'Decision' },
];

export function AdminAiEvaluation() {
  const {
    forms,
    config,
    setConfig,
    scopedSubmissions,
    scopedEmployees,
    configReady,
    loadingForms,
    loadingSubs,
    formsError,
    subsError,
    generateError,
    streamProgress,
    streamMessage,
    stored,
    generateForEmployees,
    updateStoredStatus,
  } = useEvaluationData();

  const [workflow, setWorkflow] = useState<Workflow>('setup');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('evidence');
  const [selectedKey, setSelectedKey] = useState('');
  const [generateScope, setGenerateScope] = useState<GenerateScope>('single');
  const [generating, setGenerating] = useState(false);
  const [managerDecision, setManagerDecision] = useState<'pending' | 'approved' | 'override'>('pending');
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    if (!scopedEmployees.length) {
      setSelectedKey('');
      return;
    }
    if (!scopedEmployees.some((e) => e.employeeKey === selectedKey)) {
      setSelectedKey(scopedEmployees[0].employeeKey);
    }
  }, [scopedEmployees, selectedKey]);

  const employee: ScopedEmployee | undefined = scopedEmployees.find((e) => e.employeeKey === selectedKey);
  const employeeSubs = useMemo(() => {
    if (!employee) return [];
    return scopedSubmissions.filter((s) => employee.submissionIds.includes(s.id));
  }, [employee, scopedSubmissions]);

  const generateTargets = useMemo(() => {
    if (generateScope === 'all') return scopedEmployees;
    const one = scopedEmployees.find((e) => e.employeeKey === selectedKey);
    return one ? [one] : [];
  }, [generateScope, scopedEmployees, selectedKey]);

  const handleGenerate = () => {
    const keys = generateTargets.map((e) => e.employeeKey);
    if (!keys.length) return;
    setGenerating(true);
    generateForEmployees(keys)
      .catch(() => {})
      .finally(() => setGenerating(false));
  };

  const hasGenerated =
    employee?.storedEval?.status === 'generated' ||
    employee?.storedEval?.status === 'approved' ||
    employee?.storedEval?.status === 'override';

  const goGenerate = () => {
    if (configReady && scopedEmployees.length) setWorkflow('generate');
  };

  return (
    <div className="anim">
      <div className="ai-eval-header">
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
          AI evaluation
        </div>
        <h1>Performance review from submissions</h1>
        <p>
          Select review forms and dates, generate AI drafts from those responses only, then review and approve. Manager
          approves; AI does not finalize outcomes.
        </p>
      </div>

      <AdminContextBar
        scopedSubmissionCount={scopedSubmissions.length}
        scopedEmployeeCount={scopedEmployees.length}
        selectedFormCount={config.selectedFormIds.length}
        formsError={formsError}
        subsError={subsError}
      />

      {generateError && (
        <div className="ai-eval-info red" style={{ marginBottom: 14 }}>
          {generateError}
        </div>
      )}

      <div className="ai-eval-workflow-tabs">
        {WORKFLOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`ai-eval-workflow-tab ${workflow === w.id ? 'active' : ''}`}
            disabled={w.id !== 'setup' && !configReady}
            onClick={() => setWorkflow(w.id)}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="ai-eval-page">
        {workflow !== 'setup' && (
          <EmployeeSidebar
            employees={scopedEmployees}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            poolKeys={new Set()}
            onTogglePool={() => {}}
            onSelectAllPool={() => {}}
            onClearPool={() => {}}
            listMode="view"
          />
        )}

        <div className={`ai-eval-main ${workflow === 'setup' ? 'ai-eval-main-full' : ''}`}>
          {workflow === 'setup' && (
            <SetupPanel
              forms={forms}
              config={config}
              setConfig={setConfig}
              scopedSubmissions={scopedSubmissions}
              scopedEmployeeCount={scopedEmployees.length}
              loadingForms={loadingForms}
              loadingSubs={loadingSubs}
              onContinue={goGenerate}
            />
          )}

          {workflow === 'generate' && (
            <GeneratePanel
              scope={generateScope}
              setScope={setGenerateScope}
              targetEmployees={generateTargets}
              generating={generating}
              streamProgress={streamProgress}
              streamMessage={streamMessage}
              onGenerate={handleGenerate}
              selectedKey={selectedKey}
              selectedName={employee?.employeeName}
              onViewReview={(key) => {
                setSelectedKey(key);
                setWorkflow('review');
              }}
            />
          )}

          {workflow === 'review' && employee && (
            <>
              {!hasGenerated && (
                <div className="ai-eval-info amber" style={{ marginBottom: 14 }}>
                  AI review not generated yet. Go to Generate and run for this reviewee.
                </div>
              )}
              <div
                style={{
                  marginBottom: 16,
                  padding: '14px 18px',
                  background: 'var(--s2)',
                  borderRadius: 12,
                  border: '1px solid var(--border2)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 16 }}>{employee.employeeName}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                  {employee.title} · {employee.department} · {employee.submissionCount} submission(s) in scope
                </div>
                <div style={{ marginTop: 8 }}>
                  {employee.techStack.map((t) => (
                    <span key={t} className="ai-eval-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ai-eval-tabs">
                {REVIEW_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`ai-eval-tab ${reviewTab === t.id ? 'active' : ''}`}
                    onClick={() => setReviewTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={`ai-eval-panel ${reviewTab === 'evidence' ? 'active' : ''}`}>
                <SubmissionEvidencePanel
                  employee={employee}
                  submissions={employeeSubs}
                  storedEval={stored[employee.employeeKey]}
                />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'performance' ? 'active' : ''}`}>
                <PerformancePanel employee={employee} />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'behavioral' ? 'active' : ''}`}>
                <BehavioralPanel employee={employee} />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'ai-insights' ? 'active' : ''}`}>
                <AiInsightsPanel employee={employee} />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'decision' ? 'active' : ''}`}>
                <DecisionPanel
                  employee={employee}
                  managerDecision={managerDecision}
                  setManagerDecision={(v) => {
                    setManagerDecision(v);
                    if (v === 'approved') {
                      void updateStoredStatus(employee.employeeKey, 'approved').catch(() => {});
                    }
                    if (v === 'override') {
                      void updateStoredStatus(employee.employeeKey, 'override', overrideReason).catch(() => {});
                    }
                  }}
                  overrideReason={overrideReason}
                  setOverrideReason={setOverrideReason}
                  hasOverride={employee.storedEval?.status === 'override'}
                />
              </div>
            </>
          )}

          {workflow === 'review' && !employee && (
            <div className="ai-eval-info">Select a reviewee from the sidebar or complete Setup first.</div>
          )}
        </div>
      </div>
    </div>
  );
}
