import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSection } from './ProgressSection';

const meta = {
  title: 'Components/ProgressSection',
  component: ProgressSection,
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithValue: Story = {
  args: {
    label: 'Level',
    value: '42 / 80',
  },
  render: (args) => (
    <ProgressSection {...args}>
      <input type="range" min={1} max={80} defaultValue={42} style={{ width: '100%' }} />
    </ProgressSection>
  ),
};

export const WithoutValue: Story = {
  args: {
    label: 'Traces',
  },
  render: (args) => (
    <ProgressSection {...args}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" defaultChecked />
        Ascension 2 Trace Unlocked
      </label>
    </ProgressSection>
  ),
};

export const WithClassName: Story = {
  args: {
    label: 'Target Build',
    className: 'build-prefs-display',
  },
  render: (args) => (
    <ProgressSection {...args}>
      <span>Speed boots with ATK% substats</span>
    </ProgressSection>
  ),
};
