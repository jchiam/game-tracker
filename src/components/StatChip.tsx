import type { CSSProperties } from 'react';

interface StatChipProps {
  label: string;
  style?: CSSProperties;
}

export function StatChip({ label, style }: StatChipProps) {
  return (
    <span className="stat-chip" style={style}>
      {label}
    </span>
  );
}
