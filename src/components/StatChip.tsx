import type { CSSProperties } from 'react';

interface StatChipProps {
  label: string;
  style?: CSSProperties;
  className?: string;
}

export function StatChip({ label, style, className }: StatChipProps) {
  return (
    <span className={className ? `stat-chip ${className}` : 'stat-chip'} style={style}>
      {label}
    </span>
  );
}
