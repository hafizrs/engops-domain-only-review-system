import { useCallback, useEffect, useMemo, useState } from 'react';
import { streamAiEvaluationRun, type AiEvalStreamEvent } from '../../api/aiEvaluationStream';
import { api } from '../../api/client';
import {
  DEFAULT_EVAL_CONFIG,
  type EvaluationConfig,
  type ReviewFormRef,
  type ScopedEmployee,
  type StoredAiEvaluation,
  type StreamProgressItem,
  type SubmissionRef,
  buildEvaluatedEmployees,
  buildScopedEmployees,
  employeeKey,
  filterSubmissionsByConfig,
  mapApiEvaluationToStored,
  mapInsightsFields,
  reconcileStoredKeys,
  sortReviewFormsByCreatedDesc,
} from '../../data/evaluationData';

const PIPELINE_STEPS: { node: string; label: string }[] = [
  { node: 'load_context', label: 'Loading employee context and role weights' },
  { node: 'load_submissions', label: 'Reviewing submissions in scope' },
  { node: 'normalize', label: 'Normalizing dimension scores' },
  { node: 'evidence', label: 'Extracting review evidence' },
  { node: 'analyze_360', label: 'Analyzing 360° feedback patterns' },
  { node: 'bias', label: 'Running bias checks' },
  { node: 'above_role', label: 'Detecting above-role signals' },
  { node: 'risks', label: 'Identifying risk patterns' },
  { node: 'evidence_strength', label: 'Calculating evidence strength' },
  { node: 'calibrate', label: 'Calibrating performance score' },
  { node: 'ai_performance', label: 'Generating Performance tab (AI)' },
  { node: 'ai_behavioral', label: 'Generating Behavioral tab (AI)' },
  { node: 'ai_insights', label: 'Generating AI Insights tab (AI)' },
  { node: 'safety', label: 'Running safety validation' },
  { node: 'format', label: 'Finalizing structured evaluation' },
];

function initialStreamProgress(): StreamProgressItem[] {
  return PIPELINE_STEPS.map((s, i) => ({
    node: s.node,
    label: s.label,
    done: false,
    active: i === 0,
  }));
}

function mapApiForm(f: Record<string, unknown>): ReviewFormRef {
  return {
    id: String(f._id),
    code: String(f.code),
    title: String(f.title),
    role: String(f.role ?? 'mid'),
    isActive: f.isActive !== false,
    createdAt: String(f.createdAt ?? ''),
    submissionCount: 0,
  };
}

function mapApiSubmission(s: Record<string, unknown>, form?: ReviewFormRef): SubmissionRef {
  const preview =
    typeof s.answers === 'object' && s.answers
      ? Object.values(s.answers as Record<string, unknown>)
          .slice(0, 2)
          .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 120))
          .join(' · ')
      : 'Review responses submitted.';

  return {
    id: String(s._id),
    formId: String(s.formId),
    formCode: String(s.formCode),
    formTitle: form?.title ?? String(s.formCode),
    reviewerName: String(s.reviewerName),
    reviewerEmail: String(s.reviewerEmail),
    revieweeName: String(s.revieweeName),
    revieweeEmail: s.revieweeEmail ? String(s.revieweeEmail) : undefined,
    totalScore: Number(s.totalScore ?? 0),
    submittedAt: String(s.submittedAt),
    answersPreview: preview,
    dimensionScores: (s.dimensionScores as SubmissionRef['dimensionScores']) ?? [],
  };
}

export function useEvaluationData() {
  const [forms, setForms] = useState<ReviewFormRef[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionRef[]>([]);
  const [config, setConfig] = useState<EvaluationConfig>(DEFAULT_EVAL_CONFIG);
  const [stored, setStored] = useState<Record<string, StoredAiEvaluation>>({});
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState<StreamProgressItem[]>([]);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const [loadingStored, setLoadingStored] = useState(false);

  useEffect(() => {
    setLoadingForms(true);
    setFormsError(null);
    api
      .get('/review-forms')
      .then((r) => {
        setForms(sortReviewFormsByCreatedDesc((r.data as Record<string, unknown>[]).map(mapApiForm)));
      })
      .catch((err) => {
        setForms([]);
        setFormsError(err?.response?.data?.message ?? 'Could not load review forms');
      })
      .finally(() => setLoadingForms(false));
  }, []);

  const loadSubmissionsForForms = useCallback(
    async (formIds: string[]) => {
      if (!formIds.length) {
        setAllSubmissions([]);
        return;
      }
      setLoadingSubs(true);
      setSubsError(null);
      try {
        const selected = forms.filter((f) => formIds.includes(f.id));
        const batches = await Promise.all(
          selected.map(async (f) => {
            const res = await api.get(`/submissions/form/${f.code}`);
            return (res.data as Record<string, unknown>[]).map((s) => mapApiSubmission(s, f));
          })
        );
        setAllSubmissions(batches.flat());
      } catch (err: unknown) {
        setAllSubmissions([]);
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Could not load submissions';
        setSubsError(msg);
      } finally {
        setLoadingSubs(false);
      }
    },
    [forms]
  );

  useEffect(() => {
    if (!loadingForms) {
      loadSubmissionsForForms(config.selectedFormIds);
    }
  }, [config.selectedFormIds, loadSubmissionsForForms, loadingForms]);

  useEffect(() => {
    let cancelled = false;
    setLoadingStored(true);

    api
      .get('/ai-evaluations')
      .then((res) => {
        if (cancelled) return;
        const docs = (res.data as Record<string, unknown>[]) ?? [];
        setStored((prev) => {
          const next = { ...prev };
          for (const doc of docs) {
            const email = String(doc.revieweeEmail ?? '').trim().toLowerCase();
            const name = String(doc.revieweeName ?? '').trim();
            const key = employeeKey(name, email);
            const mapped = mapApiEvaluationToStored(doc, key);
            const existing = next[key];
            if (!existing?.generatedAt) {
              next[key] = mapped;
              continue;
            }
            if (mapped.generatedAt && mapped.generatedAt >= existing.generatedAt) {
              next[key] = mapped;
            }
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStored(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scopedSubmissions = useMemo(
    () => filterSubmissionsByConfig(allSubmissions, config, forms),
    [allSubmissions, config, forms]
  );

  const scopeOnlyEmployees = useMemo(
    () => buildScopedEmployees(scopedSubmissions, {}, forms),
    [scopedSubmissions, forms]
  );

  const normalizedStored = useMemo(
    () => reconcileStoredKeys(stored, scopeOnlyEmployees),
    [stored, scopeOnlyEmployees]
  );

  const scopedEmployees = useMemo(
    () => buildScopedEmployees(scopedSubmissions, normalizedStored, forms),
    [scopedSubmissions, normalizedStored, forms]
  );

  const evaluatedEmployees = useMemo(() => buildEvaluatedEmployees(stored), [stored]);

  const configReady = config.selectedFormIds.length > 0;

  const handleStreamEvent = (event: AiEvalStreamEvent, key: string, draft: StoredAiEvaluation) => {
    if (event.message) setStreamMessage(event.message);

    if (event.event === 'node_complete' && event.node) {
      setStreamProgress((prev) => {
        const list = prev.length ? prev : initialStreamProgress();
        const idx = list.findIndex((p) => p.node === event.node);
        return list.map((p, i) => ({
          ...p,
          done: p.node === event.node ? true : p.done,
          active: i === idx + 1,
        }));
      });
    }

    if (event.event === 'section' && event.section && event.data) {
      if (event.section === 'performance') draft.performanceSection = event.data as Record<string, unknown>;
      if (event.section === 'behavioral') draft.behavioralSection = event.data as Record<string, unknown>;
      if (event.section === 'insights') {
        const ins = event.data as Record<string, unknown>;
        draft.insightsSection = ins;
        const mapped = mapInsightsFields({ insightsSection: ins }, ins);
        draft.aiStrengths = mapped.aiStrengths;
        draft.aiRisks = mapped.aiRisks;
        draft.aiBiasFlags = mapped.aiBiasFlags;
        draft.aiDevelopmentPlan = mapped.aiDevelopmentPlan;
        draft.aiTalkingPoints = mapped.aiTalkingPoints;
      }
    }

    if (event.event === 'complete' && event.data) {
      const mapped = mapApiEvaluationToStored(event.data as Record<string, unknown>, key);
      Object.assign(draft, mapped);
    }

    if (event.event === 'saved' && event.data) {
      const mapped = mapApiEvaluationToStored(event.data as Record<string, unknown>, key);
      Object.assign(draft, mapped);
      if (event.evaluationId) draft.evaluationId = event.evaluationId;
    }
  };

  const generateForEmployees = async (keys: string[]) => {
    setGenerateError(null);
    setStreamMessage(null);
    setStreamProgress(initialStreamProgress());
    const next = { ...stored };

    for (const key of keys) {
      const emp = scopedEmployees.find((e) => e.employeeKey === key);
      if (!emp) continue;

      const draft: StoredAiEvaluation = {
        evaluationId: '',
        employeeKey: key,
        status: 'generated',
        includedSubmissionIds: emp.submissionIds,
        sourceFormCodes: emp.formsInvolved,
        generatedAt: new Date().toISOString(),
      };

      try {
        await streamAiEvaluationRun(
          {
            revieweeName: emp.employeeName,
            revieweeEmail: emp.email,
            formIds: config.selectedFormIds,
            dateFrom: config.dateFrom || undefined,
            dateTo: config.dateTo || undefined,
            currentRoleLevel: emp.role,
            track: 'fullstack',
          },
          (event) => handleStreamEvent(event, key, draft)
        );
        if (!draft.evaluationId && draft.aiSummary) {
          draft.status = 'generated';
        }
        next[key] = draft;
        setStored({ ...stored, ...next });
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : 'AI evaluation failed';
        setGenerateError(text);
        setStreamProgress([]);
        throw new Error(text);
      }
    }

    setStreamProgress((prev) => prev.map((p) => ({ ...p, done: true, active: false })));
    setStored(next);
  };

  const updateStoredStatus = async (
    key: string,
    status: StoredAiEvaluation['status'],
    note?: string
  ) => {
    const cur = stored[key];
    if (!cur?.evaluationId) return;

    if (status === 'approved') {
      await api.post(`/ai-evaluations/${cur.evaluationId}/approve`, {
        managerNote: note,
        managerEditedSummary: note,
      });
    }

    setStored((prev) => ({
      ...prev,
      [key]: {
        ...cur,
        status,
        approvedAt: status === 'approved' ? new Date().toISOString() : cur.approvedAt,
        managerNote: note ?? cur.managerNote,
      },
    }));
  };

  return {
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
    stored,
    loadingStored,
    generateForEmployees,
    updateStoredStatus,
  };
}
