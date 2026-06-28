import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormGroup } from '@/components/FormGroup';

describe('FormGroup', () => {
  it('renders a .form-group wrapper with the label then children', () => {
    const { container } = render(
      <FormGroup label="Main Stat">
        <select aria-label="control" />
      </FormGroup>,
    );
    const group = container.querySelector('.form-group')!;
    expect(group).toBeInTheDocument();
    expect(group.querySelector('label')).toHaveTextContent('Main Stat');
    // Label precedes the control in source order
    expect(group.children[0].tagName).toBe('LABEL');
    expect(group.children[1].tagName).toBe('SELECT');
  });

  it('wires htmlFor onto the label', () => {
    render(
      <FormGroup label="Name" htmlFor="name-input">
        <input id="name-input" />
      </FormGroup>,
    );
    expect(screen.getByText('Name')).toHaveAttribute('for', 'name-input');
  });
});
