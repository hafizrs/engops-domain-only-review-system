import { BAND_BADGE, BAND_LABELS } from '../../data/performanceDummy';
import type { PerformanceBand } from '../../types/performance';

export function BandBadge({ band }: { band: PerformanceBand }) {
  return <span className={`badge ${BAND_BADGE[band] ?? 'bb'}`}>{BAND_LABELS[band]}</span>;
}

export function StepBadge({ label, variant = 'bt' }: { label: string; variant?: string }) {
  return <span className={`badge ${variant}`}>{label}</span>;
}

export function statusVariant(status: string): string {
  if (status === 'submitted' || status === 'completed' || status === 'approved' || status === 'finalized')
    return 'bg';
  if (status === 'overdue' || status === 'failed' || status === 'at_risk') return 'br';
  if (status === 'processing' || status === 'pending' || status === 'in_review' || status === 'draft') return 'ba';
  return 'bb';
}
