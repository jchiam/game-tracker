import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TabbedEditorShell } from './TabbedEditorShell';

const meta = {
  title: 'Components/TabbedEditorShell',
  component: TabbedEditorShell,
  tags: ['autodocs'],
  argTypes: {
    initialTab: { control: 'select', options: ['partners', 'friends', 'map'] },
  },
  args: {
    title: 'Digivice -25th COLOR EVOLUTION- progress',
    bodyClassName: 'story-editor-body',
    tabs: [
      {
        id: 'partners',
        label: 'Partners',
        content: <p style={{ padding: '16px' }}>Partner evolution checklist goes here.</p>,
        footerExtra: (
          <button className="btn secondary-action" onClick={fn()}>
            Mark group done
          </button>
        ),
      },
      {
        id: 'friends',
        label: 'Friends',
        content: <p style={{ padding: '16px' }}>Friend List checklist goes here.</p>,
      },
      {
        id: 'map',
        label: 'Map',
        content: <p style={{ padding: '16px' }}>Area checklist goes here.</p>,
      },
    ],
    onClose: fn(),
  },
} satisfies Meta<typeof TabbedEditorShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpensOnThirdTab: Story = {
  args: { initialTab: 'map' },
};

/** A disabled tab (the Digimon progress tabs before any variant is owned). */
export const WithDisabledTab: Story = {
  args: {
    tabs: [
      {
        id: 'variants',
        label: 'Variants',
        content: <p style={{ padding: '16px' }}>Variant rows.</p>,
      },
      { id: 'partners', label: 'Partners', content: <p />, disabled: true },
      { id: 'map', label: 'Map', content: <p />, disabled: true },
    ],
  },
};
