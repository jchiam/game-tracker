import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/Modal';

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Test Modal" onClose={vi.fn()}>
        <p>Modal body</p>
      </Modal>,
    );
    expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Test" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEscPress instead of onClose when provided and Escape is pressed', () => {
    const onClose = vi.fn();
    const onEscPress = vi.fn();
    render(
      <Modal title="Test" onClose={onClose} onEscPress={onEscPress}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscPress).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay is mouse-downed', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Test" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.mouseDown(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not propagate mousedown from modal content to overlay', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Test" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.mouseDown(container.querySelector('.modal-content')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(
      <Modal title="Test" onClose={vi.fn()} footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not render footer div when footer is not provided', () => {
    const { container } = render(
      <Modal title="Test" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(container.querySelector('.modal-footer')).not.toBeInTheDocument();
  });

  it('applies optional className to modal-content', () => {
    const { container } = render(
      <Modal title="Test" onClose={vi.fn()} className="custom-modal">
        <p>Content</p>
      </Modal>,
    );
    expect(container.querySelector('.modal-content.custom-modal')).toBeInTheDocument();
  });
});
