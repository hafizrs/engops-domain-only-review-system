
import type { AiEvaluationRecord, BehavioralProfile, EmployeeRole } from "../../types/aiEvaluation";

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

export function getDepartments(employees: AiEvaluationRecord[] = []) {
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
