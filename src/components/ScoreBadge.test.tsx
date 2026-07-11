import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBadge } from './ScoreBadge';

describe('ScoreBadge', () => {
  it('renders the rounded percentage and grade letter', () => {
    render(<ScoreBadge score={82} />);
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('positions the rail marker at the score percentage', () => {
    const { container } = render(<ScoreBadge score={73} />);
    const rail = container.querySelector('.score-badge-rail') as HTMLElement;
    expect(rail.style.getPropertyValue('--score-pos')).toBe('73%');
  });

  it('renders nothing for a negative sentinel score', () => {
    const { container } = render(<ScoreBadge score={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it.each([
    [95, 'grade-s', 'S'],
    [90, 'grade-s', 'S'],
    [89, 'grade-a', 'A'],
    [70, 'grade-a', 'A'],
    [69, 'grade-b', 'B'],
    [50, 'grade-b', 'B'],
    [49, 'grade-c', 'C'],
    [30, 'grade-c', 'C'],
    [29, 'grade-d', 'D'],
    [0, 'grade-d', 'D'],
  ])('score %i gets class %s and letter %s', (score, gradeClass, letter) => {
    const { container } = render(<ScoreBadge score={score} />);
    expect(container.querySelector(`.score-badge.${gradeClass}`)).toBeInTheDocument();
    expect(screen.getByText(letter)).toBeInTheDocument();
  });
});
