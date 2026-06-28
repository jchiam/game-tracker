import type { ReactNode } from 'react';

interface FormGroupProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

/**
 * The canonical labeled-control wrapper. Formalizes the global `.form-group`
 * pattern (label above a control) so call sites stop hand-writing the markup.
 */
export function FormGroup({ label, htmlFor, children }: FormGroupProps) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
