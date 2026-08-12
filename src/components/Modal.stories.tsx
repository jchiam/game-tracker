import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Modal } from './Modal';
import './Modal.css';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClose: fn(),
    title: 'Example Modal',
    children: <p>This is a basic modal with some content inside it.</p>,
  },
};

export const WithFooter: Story = {
  args: {
    onClose: fn(),
    title: 'Confirm Action',
    children: <p>Are you sure you want to proceed with this action?</p>,
    footer: (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button className="btn secondary-action">Cancel</button>
        <button className="btn primary-action">Save</button>
      </div>
    ),
  },
};

export const WithBodySlot: Story = {
  args: {
    onClose: fn(),
    title: 'Body Slot',
    bodyClassName: 'modal-body',
    children: (
      <>
        <p>
          Passing <code>bodyClassName="modal-body"</code> wraps children in the canonical padded,
          scrollable body. Extend it with a per-modal modifier class for overrides. Omit the prop
          only for deliberately full-bleed layouts.
        </p>
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i}>Scrollable content row {i + 1}</p>
        ))}
      </>
    ),
    footer: <button className="btn primary-action">Done</button>,
  },
};

export const WithForm: Story = {
  args: {
    onClose: fn(),
    title: 'Edit Settings',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label>Display Name</label>
          <input type="text" defaultValue="Trailblazer" />
        </div>
        <div className="form-group">
          <label>UID</label>
          <input type="text" defaultValue="800123456" />
        </div>
      </div>
    ),
  },
};
