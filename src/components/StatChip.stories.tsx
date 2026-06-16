import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatChip } from './StatChip';

const meta = {
  title: 'Components/StatChip',
  component: StatChip,
  tags: ['autodocs'],
} satisfies Meta<typeof StatChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Lv 42' },
};

export const WithStyle: Story = {
  args: { label: 'P5', style: { color: '#d4af37', borderColor: '#d4af37' } },
};

export const MultipleChips: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <StatChip label="Lv 60" style={{ color: '#40c8a0', borderColor: '#40c8a0' }} />
      <StatChip label="P5" style={{ color: '#d4af37', borderColor: '#d4af37' }} />
      <StatChip label="R15" style={{ color: '#d4af37', borderColor: '#d4af37' }} />
      <StatChip label="E4" style={{ color: '#c88040', borderColor: '#c88040' }} />
    </div>
  ),
};
