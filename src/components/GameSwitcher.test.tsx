import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GameSwitcher } from '@/components/GameSwitcher';
import { renderWithProviders } from '@/test/utils';

describe('GameSwitcher', () => {
  it('renders nothing on the selection page (/)', () => {
    const { container } = renderWithProviders(<GameSwitcher />, { route: '/' });
    expect(container.firstChild).toBeNull();
  });

  it('renders the trigger button on a game route', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    expect(screen.getByRole('button', { name: /switch game/i })).toBeInTheDocument();
  });

  it('dropdown is hidden initially', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    expect(screen.queryByText('Switch Game')).not.toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByText('Switch Game')).toBeInTheDocument();
  });

  it('shows both games in the dropdown', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByText('Honkai Star Rail')).toBeInTheDocument();
    expect(screen.getByText('Reverse: 1999')).toBeInTheDocument();
  });

  it('closes dropdown when trigger is clicked again', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    const trigger = screen.getByRole('button', { name: /switch game/i });
    fireEvent.click(trigger);
    expect(screen.getByText('Switch Game')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText('Switch Game')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByText('Switch Game')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Switch Game')).not.toBeInTheDocument();
  });

  it('shows "Back to Selection" link in dropdown', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByText('Back to Selection')).toBeInTheDocument();
  });

  it('marks the current game as active', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const hsrLink = screen.getByRole('link', { name: /honkai star rail/i });
    expect(hsrLink).toHaveClass('active');
  });

  it('works on the reverse-1999 route', () => {
    renderWithProviders(<GameSwitcher />, { route: '/reverse-1999' });
    expect(screen.getByRole('button', { name: /switch game/i })).toBeInTheDocument();
  });
});
