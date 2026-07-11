import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { EquipmentEditorShell } from './EquipmentEditorShell';

const meta = {
  title: 'Components/EquipmentEditorShell',
  component: EquipmentEditorShell,
  tags: ['autodocs'],
  args: {
    title: 'Relics — Storybook',
    equipTabLabel: 'Equip Relics',
    bodyClassName: 'story-editor-body',
    equipContent: <p style={{ padding: '16px' }}>Per-game equip tab content goes here.</p>,
    preferencesContent: (
      <p style={{ padding: '16px' }}>Per-game Build Preferences content goes here.</p>
    ),
    onClose: fn(),
  },
} satisfies Meta<typeof EquipmentEditorShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEquipFooterExtra: Story = {
  args: {
    title: 'Edit Cartridge - Storybook',
    equipTabLabel: 'Equip Cartridge',
    equipFooterExtra: (
      <button className="btn secondary-action danger" onClick={fn()}>
        Un-equip Cartridge
      </button>
    ),
  },
};
