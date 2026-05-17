import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressSection } from '@/components/ProgressSection';

describe('ProgressSection', () => {
  it('renders label and children', () => {
    render(
      <ProgressSection label="Level">
        <input type="range" aria-label="level slider" />
      </ProgressSection>,
    );
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByLabelText('level slider')).toBeInTheDocument();
  });

  it('renders value when provided', () => {
    render(
      <ProgressSection label="Level" value="42 / 80">
        <div>content</div>
      </ProgressSection>,
    );
    expect(screen.getByText('42 / 80')).toBeInTheDocument();
    expect(screen.getByText('42 / 80')).toHaveClass('section-value');
  });

  it('omits value span when not provided', () => {
    const { container } = render(
      <ProgressSection label="Traces">
        <div>content</div>
      </ProgressSection>,
    );
    expect(container.querySelector('.section-value')).not.toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(
      <ProgressSection label="Build" className="build-prefs-display">
        <div>content</div>
      </ProgressSection>,
    );
    expect(container.firstChild).toHaveClass('progress-section', 'build-prefs-display');
  });
});
