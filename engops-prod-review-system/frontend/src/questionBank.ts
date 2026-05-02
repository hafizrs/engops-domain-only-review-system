export { DIMS, type DimensionDef, type DimQuestion } from './dims';

export const ROLE_LABELS: Record<string, string> = {
  junior: 'Junior Engineer',
  mid: 'Mid Engineer',
  senior: 'Senior Engineer',
  lead: 'Lead / Staff Engineer',
  manager: 'Engineering Manager',
};

export const DIM_COLORS: Record<string, string> = {
  delivery: '#7B6EF6',
  quality: '#2DD4BF',
  execution: '#FBBF24',
  decision: '#60A5FA',
  ownership: '#34D399',
  technical: '#F87171',
  communication: '#A89BFF',
};
