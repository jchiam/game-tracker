import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleChips, type ToggleChipOption } from '@/components/ToggleChips';

const skills: ToggleChipOption[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'dodge', label: 'Dodge' },
  { value: 'assist', label: 'Assist' },
];

describe('ToggleChips', () => {
  it('emits only the clicked option and leaves the others on', () => {
    const onToggle = vi.fn();
    render(<ToggleChips options={skills} values={['basic', 'dodge']} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Assist'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('assist');
    expect(screen.getByText('Basic')).toHaveClass('active');
    expect(screen.getByText('Dodge')).toHaveClass('active');
  });

  it('emits the value when an on option is clicked, so the host can turn it off', () => {
    const onToggle = vi.fn();
    render(<ToggleChips options={skills} values={['basic']} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Basic'));
    expect(onToggle).toHaveBeenCalledWith('basic');
  });

  it('renders the empty state with no pills on', () => {
    render(<ToggleChips options={skills} values={[]} onToggle={vi.fn()} />);
    for (const { label } of skills) {
      expect(screen.getByText(label)).not.toHaveClass('active');
      expect(screen.getByText(label)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('renders the all-on state with every pill on', () => {
    render(<ToggleChips options={skills} values={skills.map((s) => s.value)} onToggle={vi.fn()} />);
    for (const { label } of skills) {
      expect(screen.getByText(label)).toHaveClass('active');
      expect(screen.getByText(label)).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it("exposes each pill's pressed state to assistive technology", () => {
    render(<ToggleChips options={skills} values={['dodge']} onToggle={vi.fn()} />);
    expect(screen.getByText('Basic')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Dodge')).toHaveAttribute('aria-pressed', 'true');
  });

  it('emits the per-option modifier class hook', () => {
    render(
      <ToggleChips
        options={[{ value: 'basic', label: 'Basic', modifier: 'skill-basic' }]}
        values={[]}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText('Basic')).toHaveClass('toggle-btn', 'skill-basic');
  });

  it('applies the host row-wrapper className and compact size', () => {
    const { container } = render(
      <ToggleChips
        options={skills}
        values={[]}
        size="compact"
        className="skill-row"
        onToggle={vi.fn()}
      />,
    );
    expect(container.querySelector('.segmented-buttons.skill-row')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toHaveClass('compact');
  });

  it('does not opt buttons out of the base per-button hover', () => {
    render(<ToggleChips options={skills} values={[]} onToggle={vi.fn()} />);
    expect(screen.getByText('Basic')).not.toHaveClass('is-rung');
  });
});
