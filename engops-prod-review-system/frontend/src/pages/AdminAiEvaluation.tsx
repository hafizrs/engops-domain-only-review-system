import { useEffect, useMemo, useState } from 'react';
import type { ScopedEmployee } from '../data/evaluationData';
import { AdminContextBar } from './ai-evaluation/AdminContextBar';
import { AiInsightsPanel } from './ai-evaluation/AiInsightsPanel';
import { BehavioralPanel } from './ai-evaluation/BehavioralPanel';
import { EmployeeSidebar } from './ai-evaluation/EmployeeSidebar';
import { GeneratePanel, type GenerateScope } from './ai-evaluation/GeneratePanel';
import { PerformancePanel } from './ai-evaluation/PerformancePanel';
import { EvaluatedEmployeesPanel } from './ai-evaluation/EvaluatedEmployeesPanel';
import { SetupPanel } from './ai-evaluation/SetupPanel';
import { useEvaluationData } from './ai-evaluation/useEvaluationData';
import './ai-evaluation/ai-evaluation.css';

type Workflow = 'setup' | 'generate' | 'review';
type ReviewTab = 'performance' | 'behavioral' | 'ai-insights';

const WORKFLOWS: { id: Workflow; label: string }[] = [
  { id: 'setup', label: '1 · Scope' },
  { id: 'generate', label: '2 · Generate' },
  { id: 'review', label: '3 · Results' },
];

const RESULTS_TABS: { id: ReviewTab; label: string }[] = [
  { id: 'performance', label: 'Performance' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'ai-insights', label: 'AI insights' },
];

export function AdminAiEvaluation() {
  const {
    forms,
    config,
    setConfig,
    scopedSubmissions,
    scopedEmployees,
    evaluatedEmployees,
    configReady,
    loadingForms,
    loadingSubs,
    formsError,
    subsError,
    generateError,
    streamProgress,
    streamMessage,
    loadingStored,
    generateForEmployees,
  } = useEvaluationData();

  const [workflow, setWorkflow] = useState<Workflow>('setup');
  const [reviewTab, setReviewTab] = useState<ReviewTab>('performance');
  const [selectedKey, setSelectedKey] = useState('');
  const [generateScope, setGenerateScope] = useState<GenerateScope>('single');
  const [generating, setGenerating] = useState(false);

  const sidebarEmployees = workflow === 'review' ? evaluatedEmployees : scopedEmployees;

  useEffect(() => {
    const list = sidebarEmployees;
    if (!list.length) {
      setSelectedKey('');
      return;
    }
    if (!list.some((e) => e.employeeKey === selectedKey)) {
      setSelectedKey(list[0].employeeKey);
    }
  }, [sidebarEmployees, selectedKey]);

  const employee: ScopedEmployee | undefined =
    workflow === 'review'
      ? evaluatedEmployees.find((e) => e.employeeKey === selectedKey)
      : scopedEmployees.find((e) => e.employeeKey === selectedKey);

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

  const goGenerate = () => {
    if (configReady && scopedEmployees.length) setWorkflow('generate');
  };

  const hasAnyEvaluated = evaluatedEmployees.length > 0;

  const openResults = (key: string) => {
    const match =
      evaluatedEmployees.find((e) => e.employeeKey === key) ??
      evaluatedEmployees.find((e) => e.email.toLowerCase() === key.toLowerCase());
    setSelectedKey(match?.employeeKey ?? key);
    setWorkflow('review');
    setReviewTab('performance');
  };

  const workflowDisabled = (id: Workflow) => {
    if (id === 'setup') return false;
    if (id === 'review') return !hasAnyEvaluated;
    return !configReady;
  };

  return (
    <div className="anim">
      <div className="ai-eval-header">
        <p className="page-eyebrow">AI evaluation</p>
        <h1 className="page-title" style={{ fontSize: 28 }}>
          Performance review from submissions
        </h1>
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
            disabled={workflowDisabled(w.id)}
            onClick={() => setWorkflow(w.id)}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="ai-eval-page">
        {workflow !== 'setup' && (
          <EmployeeSidebar
            employees={sidebarEmployees}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            poolKeys={new Set()}
            onTogglePool={() => {}}
            onSelectAllPool={() => {}}
            onClearPool={() => {}}
            listMode={workflow === 'review' ? 'evaluated' : 'view'}
            emptyMessage={
              workflow === 'review'
                ? loadingStored
                  ? 'Loading saved evaluations…'
                  : 'No saved AI evaluations yet. Complete Generate first.'
                : undefined
            }
          />
        )}

        <div className={`ai-eval-main ${workflow === 'setup' ? 'ai-eval-main-full' : ''}`}>
          {workflow === 'setup' && (
            <>
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
              <EvaluatedEmployeesPanel
                employees={evaluatedEmployees}
                loading={loadingStored}
                onViewResults={openResults}
              />
            </>
          )}

          {workflow === 'generate' && (
            <>
            <EvaluatedEmployeesPanel
              employees={evaluatedEmployees}
              loading={loadingStored}
              onViewResults={openResults}
            />
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
              onViewReview={openResults}
            />
            </>
          )}

          {workflow === 'review' && employee && (
            <>
              <div className="ai-eval-employee-banner">
                <h3>{employee.employeeName}</h3>
                <p>
                  Saved AI evaluation · {employee.calibratedScore}% · {employee.performanceBand}
                  {employee.storedEval?.status && (
                    <> · <strong>{employee.storedEval.status}</strong></>
                  )}
                </p>
                {employee.storedEval?.generatedAt && (
                  <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text3)' }}>
                    Generated {new Date(employee.storedEval.generatedAt).toLocaleString()}
                    {employee.formsInvolved.length > 0 && <> · Forms: {employee.formsInvolved.join(', ')}</>}
                  </p>
                )}
              </div>

              <div className="ai-eval-tabs">
                {RESULTS_TABS.map((t) => (
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

              <div className={`ai-eval-panel ${reviewTab === 'performance' ? 'active' : ''}`}>
                <PerformancePanel employee={employee} />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'behavioral' ? 'active' : ''}`}>
                <BehavioralPanel employee={employee} />
              </div>
              <div className={`ai-eval-panel ${reviewTab === 'ai-insights' ? 'active' : ''}`}>
                <AiInsightsPanel employee={employee} />
              </div>
            </>
          )}

          {workflow === 'review' && !employee && (
            <div className="ai-eval-info">
              {loadingStored
                ? 'Loading saved evaluations…'
                : 'No saved AI evaluations yet. Use Generate to create one, then return here.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
