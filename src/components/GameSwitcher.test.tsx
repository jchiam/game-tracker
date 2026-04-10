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

  it('marks reverse-1999 as active when on that route', () => {
    renderWithProviders(<GameSwitcher />, { route: '/reverse-1999' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const r1999Link = screen.getByRole('link', { name: /reverse: 1999/i });
    expect(r1999Link).toHaveClass('active');
  });

  it('does not mark the inactive game as active', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const r1999Link = screen.getByRole('link', { name: /reverse: 1999/i });
    expect(r1999Link).not.toHaveClass('active');
  });

  it('trigger button has active class when dropdown is open', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    const trigger = screen.getByRole('button', { name: /switch game/i });
    fireEvent.click(trigger);
    expect(trigger).toHaveClass('active');
  });

  it('trigger button loses active class when dropdown closes', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    const trigger = screen.getByRole('button', { name: /switch game/i });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger).not.toHaveClass('active');
  });

  it('shows active indicator for the current game', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const hsrLink = screen.getByRole('link', { name: /honkai star rail/i });
    expect(hsrLink).toHaveTextContent('●');
  });

  it('does not show active indicator for the inactive game', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const r1999Link = screen.getByRole('link', { name: /reverse: 1999/i });
    expect(r1999Link).not.toHaveTextContent('●');
  });

  it('game links navigate to the correct routes', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByRole('link', { name: /honkai star rail/i })).toHaveAttribute(
      'href',
      '/honkai-star-rail',
    );
    expect(screen.getByRole('link', { name: /reverse: 1999/i })).toHaveAttribute(
      'href',
      '/reverse-1999',
    );
  });

  it('"Back to Selection" link navigates to /', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    expect(screen.getByRole('link', { name: /back to selection/i })).toHaveAttribute('href', '/');
  });

  it('clicking a game link closes the dropdown', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    fireEvent.click(screen.getByRole('link', { name: /reverse: 1999/i }));
    expect(screen.queryByText('Switch Game')).not.toBeInTheDocument();
  });

  it('clicking "Back to Selection" closes the dropdown', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    fireEvent.click(screen.getByRole('link', { name: /back to selection/i }));
    expect(screen.queryByText('Switch Game')).not.toBeInTheDocument();
  });

  it('clicking inside the dropdown does not close it', () => {
    renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    fireEvent.click(screen.getByRole('button', { name: /switch game/i }));
    const dropdown = screen.getByText('Switch Game').closest('.switcher-dropdown')!;
    fireEvent.mouseDown(dropdown);
    expect(screen.getByText('Switch Game')).toBeInTheDocument();
  });

  it('renders the current game icon in the trigger', () => {
    const { container } = renderWithProviders(<GameSwitcher />, { route: '/honkai-star-rail' });
    const img = container.querySelector('.current-game-icon-img');
    expect(img).toHaveAttribute('src', '/assets/icons/hsr-icon.webp');
  });
});
