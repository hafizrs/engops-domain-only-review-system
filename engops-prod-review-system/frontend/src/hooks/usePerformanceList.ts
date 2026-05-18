import { useMemo, useState } from 'react';
import {
  ACTIVE_CYCLE_ID,
  DUMMY_PERFORMANCE_STATES,
  DUMMY_REVIEW_CYCLES,
} from '../data/performanceDummy';
import type { PerformanceFilters } from '../types/performance';

const PAGE_SIZE = 20;

export const DEFAULT_PERF_FILTERS: PerformanceFilters = {
  cycleId: ACTIVE_CYCLE_ID,
  department: 'all',
  managerId: 'all',
  roleLevel: 'all',
  band: 'all',
  aiStatus: 'all',
  reviewGap: 'all',
  search: '',
};

export function usePerformanceList(initialFilters = DEFAULT_PERF_FILTERS) {
  const [filters, setFilters] = useState<PerformanceFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'band' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = DUMMY_PERFORMANCE_STATES.filter((s) => s.cycleId === filters.cycleId);
    if (filters.department !== 'all') list = list.filter((s) => s.employee.department === filters.department);
    if (filters.managerId !== 'all') list = list.filter((s) => s.employee.managerId === filters.managerId);
    if (filters.roleLevel !== 'all') list = list.filter((s) => s.employee.currentRoleLevel === filters.roleLevel);
    if (filters.band !== 'all') list = list.filter((s) => s.performanceBand === filters.band);
    if (filters.aiStatus !== 'all') list = list.filter((s) => s.reviewStatus.aiAnalysis === filters.aiStatus);
    if (filters.reviewGap === 'missing') list = list.filter((s) => s.missingReviews);
    if (filters.reviewGap === 'at_risk') list = list.filter((s) => s.riskFlag);
    if (filters.reviewGap === 'promotion') list = list.filter((s) => s.promotionReady);
    const q = filters.search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.employee.fullName.toLowerCase().includes(q) ||
          s.employee.email.toLowerCase().includes(q) ||
          s.employee.employeeCode.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.employee.fullName.localeCompare(b.employee.fullName);
      else if (sortBy === 'score')
        cmp = (a.scoreSummary.calibratedScore ?? -1) - (b.scoreSummary.calibratedScore ?? -1);
      else if (sortBy === 'band') cmp = a.performanceBand.localeCompare(b.performanceBand);
      else cmp = new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime();
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filters, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const departments = useMemo(
    () => [...new Set(DUMMY_PERFORMANCE_STATES.map((s) => s.employee.department))].sort(),
    []
  );
  const managers = useMemo(() => {
    const m = new Map<string, string>();
    DUMMY_PERFORMANCE_STATES.forEach((s) => m.set(s.employee.managerId, s.employee.managerName));
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectPage = () => setSelectedIds(new Set(pageItems.map((s) => s.employeeId)));
  const clearSelection = () => setSelectedIds(new Set());

  return {
    filters,
    setFilters: (f: PerformanceFilters) => {
      setFilters(f);
      setPage(1);
    },
    page,
    setPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filtered,
    pageItems,
    totalPages,
    pageSize: PAGE_SIZE,
    departments,
    managers,
    cycles: DUMMY_REVIEW_CYCLES,
    selectedIds,
    toggleSelect,
    selectPage,
    clearSelection,
  };
}
