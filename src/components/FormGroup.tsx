import type { ReactNode } from 'react';

interface FormGroupProps {
  label: string;
  htmlFor?: string;
  /** Extra classes appended to `.form-group` (e.g. a gated/disabled modifier). */
  className?: string;
  children: ReactNode;
}

/**
 * The canonical labeled-control wrapper. Formalizes the global `.form-group`
 * pattern (label above a control) so call sites stop hand-writing the markup.
 */
export function FormGroup({ label, htmlFor, className, children }: FormGroupProps) {
  return (
    <div className={className ? `form-group ${className}` : 'form-group'}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
