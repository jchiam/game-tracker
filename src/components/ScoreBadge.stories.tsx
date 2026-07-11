import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScoreBadge } from './ScoreBadge';

const meta = {
  title: 'Components/ScoreBadge',
  component: ScoreBadge,
  tags: ['autodocs'],
  args: {
    score: 82,
  },
  argTypes: {
    score: { control: { type: 'range', min: -1, max: 100, step: 1 } },
  },
} satisfies Meta<typeof ScoreBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each grade colours the percentage; the rail gradient is identical for every grade —
 * the marker position, not the hue, encodes the score. */
export const GradeS: Story = { args: { score: 95 } };
export const GradeA: Story = { args: { score: 82 } };
export const GradeB: Story = { args: { score: 58 } };
export const GradeC: Story = { args: { score: 34 } };
export const GradeD: Story = { args: { score: 12 } };

/** A negative score is the insufficient-data sentinel — the badge renders nothing. */
export const InsufficientData: Story = { args: { score: -1 } };

export const AllGrades: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <ScoreBadge score={95} />
      <ScoreBadge score={82} />
      <ScoreBadge score={58} />
      <ScoreBadge score={34} />
      <ScoreBadge score={12} />
    </div>
  ),
};

/** Marker positions at the grade boundaries (30/50/70/90) and the rail extremes. */
export const BoundaryMarkers: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <ScoreBadge score={0} />
      <ScoreBadge score={30} />
      <ScoreBadge score={50} />
      <ScoreBadge score={70} />
      <ScoreBadge score={90} />
      <ScoreBadge score={100} />
    </div>
  ),
};
