import type { Meta, StoryObj } from '@storybook/react-vite';
import { PreferenceChainReadout } from './PreferenceChainReadout';

const meta = {
  title: 'Components/PreferenceChainReadout',
  component: PreferenceChainReadout,
  tags: ['autodocs'],
  args: {
    label: 'Subs',
    chain: [],
  },
} satisfies Meta<typeof PreferenceChainReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithOperators: Story = {
  args: {
    label: 'Subs',
    chain: [
      { stat: 'ATK%', operator: '>=', orderIndex: 0 },
      { stat: 'CRIT Rate', operator: '>', orderIndex: 1 },
      { stat: 'CRIT DMG', operator: null, orderIndex: 2 },
    ],
  },
};

export const IdVocabularyWithFormatStat: Story = {
  args: {
    label: 'Moon',
    chain: [
      { stat: 'attack-pct', operator: 'OR', orderIndex: 0 },
      { stat: 'crit-rate', operator: null, orderIndex: 1 },
    ],
    formatStat: (stat: string) =>
      ({ 'attack-pct': 'ATK %', 'crit-rate': 'CRIT Rate' })[stat] ?? stat,
  },
};

export const SingleEntry: Story = {
  args: {
    label: 'Body',
    chain: [{ stat: 'CRIT DMG', operator: null, orderIndex: 0 }],
  },
};
