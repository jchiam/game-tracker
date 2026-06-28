import { FormGroup } from './FormGroup';

interface BuildCommentsProps {
  value: string;
  onChange: (value: string) => void;
  /** Section label. Default "Build Comments". */
  label?: string;
  placeholder?: string;
}

/**
 * A labeled free-text notes field for build comments. Reuses the canonical
 * `.form-group textarea` styling rather than a bespoke per-editor rule.
 */
export function BuildComments({
  value,
  onChange,
  label = 'Build Comments',
  placeholder,
}: BuildCommentsProps) {
  return (
    <FormGroup label={label}>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormGroup>
  );
}
