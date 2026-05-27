import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import {
  buildScopedEmployees,
  sortReviewFormsByCreatedDesc,
  type ReviewFormRef,
  type ScopedEmployee,
  type SubmissionRef,
} from '../data/evaluationData';
import { ROLE_LABELS } from '../questionBank';
import type { EmployeeRole } from '../types/aiEvaluation';

const ROLES: EmployeeRole[] = ['junior', 'mid', 'senior', 'lead', 'manager'];

export type BandKey = 'Excellent' | 'Good' | 'Needs Focus' | 'At Risk';

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
    answersPreview: '',
    dimensionScores: (s.dimensionScores as SubmissionRef['dimensionScores']) ?? [],
  };
}

export function isTechnicalSpotlight(e: ScopedEmployee): boolean {
  const t = e.managerScores.technical_judgment ?? 0;
  const q = e.managerScores.quality ?? 0;
  const c = e.managerScores.communication ?? 0;
  return (t + q) / 2 >= 3.8 && c > 0 && c < 3.2;
}

export type RoleGroupSummary = {
  role: EmployeeRole;
  label: string;
  count: number;
  avgScore: number | null;
  excellent: number;
  good: number;
  needsFocus: number;
  atRisk: number;
};

export type FormWithCount = ReviewFormRef & { submissionCount: number };

export function useDashboardPerformance() {
  const [forms, setForms] = useState<ReviewFormRef[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const formsRes = await api.get('/review-forms');
        const mapped = sortReviewFormsByCreatedDesc(
          (formsRes.data as Record<string, unknown>[]).map(mapApiForm)
        );
        if (cancelled) return;
        setForms(mapped);

        if (!mapped.length) {
          setSubmissions([]);
          return;
        }

        const batches = await Promise.all(
          mapped.map(async (f) => {
            try {
              const res = await api.get(`/submissions/form/${f.code}`);
              return (res.data as Record<string, unknown>[]).map((s) => mapApiSubmission(s, f));
            } catch {
              return [] as SubmissionRef[];
            }
          })
        );
        if (cancelled) return;
        setSubmissions(batches.flat());
      } catch (err: unknown) {
        if (!cancelled) {
          setForms([]);
          setSubmissions([]);
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not load dashboard data';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const employees = useMemo(
    () => buildScopedEmployees(submissions, {}, forms),
    [submissions, forms]
  );

  const formsWithCounts = useMemo((): FormWithCount[] => {
    return forms.map((f) => ({
      ...f,
      submissionCount: submissions.filter((s) => s.formCode === f.code).length,
    }));
  }, [forms, submissions]);

  const roleGroups = useMemo((): RoleGroupSummary[] => {
    return ROLES.map((role) => {
      const group = employees.filter((e) => e.role === role);
      const avgScore =
        group.length > 0
          ? Math.round(group.reduce((a, e) => a + e.avgSubmissionScore, 0) / group.length)
          : null;
      return {
        role,
        label: ROLE_LABELS[role] ?? role,
        count: group.length,
        avgScore,
        excellent: group.filter((e) => e.performanceBand === 'Excellent').length,
        good: group.filter((e) => e.performanceBand === 'Good').length,
        needsFocus: group.filter((e) => e.performanceBand === 'Needs Focus').length,
        atRisk: group.filter((e) => e.performanceBand === 'At Risk').length,
      };
    });
  }, [employees]);

  const bandDistribution = useMemo(() => {
    const dist: Record<BandKey, number> = {
      Excellent: 0,
      Good: 0,
      'Needs Focus': 0,
      'At Risk': 0,
    };
    for (const e of employees) {
      const b = e.performanceBand as BandKey;
      if (b in dist) dist[b] += 1;
    }
    return dist;
  }, [employees]);

  const kpis = useMemo(() => {
    const uniqueReviewees = employees.length;
    const totalSubs = submissions.length;
    const avg =
      employees.length > 0
        ? Math.round(employees.reduce((a, e) => a + e.avgSubmissionScore, 0) / employees.length)
        : null;
    const rolesCovered = new Set(employees.map((e) => e.role)).size;
    const technicalSpotlight = employees.filter(isTechnicalSpotlight).length;
    const needsAttention = employees.filter(
      (e) => e.performanceBand === 'At Risk' || e.performanceBand === 'Needs Focus'
    ).length;
    const formsWithoutSubs = formsWithCounts.filter((f) => f.submissionCount === 0).length;
    const lastSubmissionAt =
      submissions.length > 0
        ? submissions.reduce((latest, s) => {
            const t = new Date(s.submittedAt).getTime();
            return t > latest ? t : latest;
          }, 0)
        : null;

    return {
      uniqueReviewees,
      totalSubs,
      avg,
      rolesCovered,
      formCount: forms.length,
      technicalSpotlight,
      needsAttention,
      formsWithoutSubs,
      lastSubmissionAt,
    };
  }, [employees, submissions, forms.length, formsWithCounts]);

  const recentSubmissions = useMemo(() => {
    return [...submissions]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 6);
  }, [submissions]);

  return {
    forms: formsWithCounts,
    employees,
    roleGroups,
    bandDistribution,
    kpis,
    recentSubmissions,
    loading,
    error,
    reload,
  };
}

export type { ScopedEmployee };
