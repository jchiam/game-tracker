import type { ReactNode } from 'react';

interface ProgressSectionProps {
  label: string;
  value?: string | number;
  className?: string;
  children: ReactNode;
}

export function ProgressSection({ label, value, className, children }: ProgressSectionProps) {
  return (
    <div className={`progress-section${className ? ` ${className}` : ''}`}>
      <div className="section-header">
        <span>{label}</span>
        {value !== undefined && <span className="section-value">{value}</span>}
      </div>
      {children}
    </div>
  );
}
