import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { GameCardShell } from './GameCardShell';
import { GameBadge } from './GameBadge';
import { ProgressSection } from './ProgressSection';
import { StatChip } from './StatChip';

const meta = {
  title: 'Components/GameCardShell',
  component: GameCardShell,
  tags: ['autodocs'],
  argTypes: {
    temperScore: { control: { type: 'range', min: -1, max: 100, step: 1 } },
  },
  args: {
    name: 'Acheron',
    imageUrl: 'https://picsum.photos/seed/gamecard/250/250',
    entityNoun: 'Character',
    isFavorited: false,
    onToggleFavorite: fn(),
    onRemove: fn(),
    badges: (
      <>
        <GameBadge label="Thunder" variant="element" modifier="thunder" />
        <GameBadge label="Nihility" variant="path" modifier="nihility" />
      </>
    ),
    summaryStats: (
      <>
        <StatChip label="Lv 60" />
        <StatChip label="Traces ✓" />
        <StatChip label="Relics 4/6" />
      </>
    ),
    summaryLine: <span>Passerby 4 · Streetwise 2</span>,
    editBody: (
      <>
        <ProgressSection label="Level" value="60 / 80">
          <input type="range" min={1} max={80} defaultValue={60} style={{ width: '100%' }} />
        </ProgressSection>
        <ProgressSection label="Notes">
          <span>Any game-specific edit sections go in this slot.</span>
        </ProgressSection>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameCardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Favorited: Story = {
  args: {
    isFavorited: true,
  },
};

export const WithHeaderExtra: Story = {
  args: {
    headerExtra: (
      <div
        style={{
          padding: '2px 8px',
          borderRadius: '999px',
          border: '1px solid currentColor',
          fontSize: '0.75rem',
        }}
      >
        92.5%
      </div>
    ),
  },
};

/** The anodized temper edge — a 3px crown coloured by the card's score position on
 * the investment ramp. Omitted or negative scores render no edge. */
export const WithTemperEdge: Story = {
  args: {
    temperScore: 92,
  },
};

/** An array `summaryLine` renders one `.game-card-static-line` per entry, each
 * independently ellipsized — used when a card digests two equipment kinds
 * (e.g. HSR Light Cone + relic sets). */
export const MultiLineSummary: Story = {
  args: {
    summaryLine: [
      <span key="cone">Along the Passing Shore · Lv 80 · S1</span>,
      <span key="relics">Passerby 4 · Streetwise 2</span>,
    ],
  },
};

export const EmptySummaryLine: Story = {
  args: {
    summaryLine: <span>&mdash;</span>,
    summaryStats: (
      <>
        <StatChip label="Lv 1" />
        <StatChip label="Traces ✗" />
        <StatChip label="Relics 0/6" />
      </>
    ),
  },
};
