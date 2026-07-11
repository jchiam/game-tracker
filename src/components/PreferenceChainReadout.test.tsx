import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreferenceChainReadout } from './PreferenceChainReadout';
import type { StatPreference } from '@/types';

const chain: StatPreference[] = [
  { stat: 'ATK%', operator: '>=', orderIndex: 0 },
  { stat: 'CRIT Rate', operator: '>', orderIndex: 1 },
  { stat: 'CRIT DMG', operator: null, orderIndex: 2 },
];

describe('PreferenceChainReadout', () => {
  it('renders the label and a stat badge per entry', () => {
    render(<PreferenceChainReadout label="Subs" chain={chain} />);
    expect(screen.getByText('Subs')).toHaveClass('pref-display-label');
    expect(screen.getByText('ATK%')).toHaveClass('pref-stat-badge');
    expect(screen.getByText('CRIT Rate')).toHaveClass('pref-stat-badge');
    expect(screen.getByText('CRIT DMG')).toHaveClass('pref-stat-badge');
  });

  it('renders >= as ≥ and other operators verbatim, none on a null operator', () => {
    const { container } = render(<PreferenceChainReadout label="Subs" chain={chain} />);
    const operators = [...container.querySelectorAll('.pref-operator-badge')];
    expect(operators.map((o) => o.textContent)).toEqual(['≥', '>']);
  });

  it('resolves stat labels via formatStat', () => {
    const ids: StatPreference[] = [{ stat: 'attack-pct', operator: null, orderIndex: 0 }];
    render(
      <PreferenceChainReadout
        label="Moon"
        chain={ids}
        formatStat={(s) => (s === 'attack-pct' ? 'ATK %' : s)}
      />,
    );
    expect(screen.getByText('ATK %')).toHaveClass('pref-stat-badge');
    expect(screen.queryByText('attack-pct')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty chain', () => {
    const { container } = render(<PreferenceChainReadout label="Subs" chain={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
