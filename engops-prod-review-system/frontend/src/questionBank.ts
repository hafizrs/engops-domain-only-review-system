export { DIMS, type DimensionDef, type DimQuestion } from './dims';

export const ROLE_LABELS: Record<string, string> = {
  junior: 'Junior Engineer',
  mid: 'Mid Engineer',
  senior: 'Senior Engineer',
  lead: 'Lead / Staff Engineer',
  manager: 'Engineering Manager',
};

export const DIM_COLORS: Record<string, string> = {
  technical_judgment: '#F87171',
  delivery_execution: '#7B6EF6',
  quality: '#2DD4BF',
  communication: '#A89BFF',
  ownership_growth: '#34D399',
};
