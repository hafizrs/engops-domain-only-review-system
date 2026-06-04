import React from 'react';

type Variant = 'full' | 'compact' | 'mark';

type Props = {
  variant?: Variant;
  tagline?: string;
};

export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className={`brand-mark brand-mark--${size}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.15" />
        <path
          d="M8 12.5l2.5 2.5L16 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 8h5M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    </span>
  );
}

export function BrandLogo({ variant = 'full', tagline }: Props) {
  if (variant === 'mark') {
    return <BrandMark size="sm" />;
  }

  const line =
    tagline ??
    (variant === 'compact' ? 'Selise · Engineering Operations' : 'Selise · Performance reviews');

  return (
    <div className={`brand-lockup brand-lockup--${variant}`}>
      <BrandMark size={variant === 'compact' ? 'md' : 'md'} />
      <div className="brand-copy">
        <span className="brand-name">EngOps Eval</span>
        <span className="brand-tagline">{line}</span>
      </div>
    </div>
  );
}
