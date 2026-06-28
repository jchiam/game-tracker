import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { PreferenceChain } from './PreferenceChain';
import type { StatPreference } from '@/types';

const meta = {
  title: 'Components/PreferenceChain',
  component: PreferenceChain,
  tags: ['autodocs'],
  args: {
    values: [],
    options: [],
    onChange: () => {},
    namePrefix: 'story-pref',
  },
} satisfies Meta<typeof PreferenceChain>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component to hold state in Storybook
function PreferenceChainInteractive() {
  const [values, setValues] = useState<StatPreference[]>([
    { stat: 'ATK%', operator: '>', orderIndex: 0 },
    { stat: 'Crit Rate', operator: '>=', orderIndex: 1 },
    { stat: 'Crit DMG', operator: null, orderIndex: 2 },
  ]);

  const options = ['ATK%', 'Crit Rate', 'Crit DMG', 'Speed', 'HP%', 'DEF%'];

  return (
    <div
      style={{
        maxWidth: '400px',
        padding: '16px',
        background: 'rgba(25, 25, 35, 0.95)',
        borderRadius: '8px',
        border: '1px solid var(--color-ui-border)',
      }}
    >
      <PreferenceChain
        values={values}
        options={options}
        onChange={setValues}
        namePrefix="story-pref-interactive"
      />
    </div>
  );
}

export const Default: Story = {
  args: {
    values: [
      { stat: 'ATK%', operator: '>', orderIndex: 0 },
      { stat: 'Crit Rate', operator: null, orderIndex: 1 },
    ],
    options: ['ATK%', 'Crit Rate', 'Crit DMG', 'Speed'],
    onChange: fn(),
    namePrefix: 'story-pref-default',
  },
};

export const Interactive: Story = {
  render: () => <PreferenceChainInteractive />,
};

// Ranked-list mode: pure ranking, no operators, value≠label, reorder + per-item remove
function RankedListInteractive() {
  const [values, setValues] = useState<string[]>(['defender', 'last-light']);

  const options = [
    { value: 'defender', label: 'Defender' },
    { value: 'last-light', label: 'Last Light' },
    { value: 'sunder', label: 'Sunder' },
    { value: 'aegis', label: 'Aegis' },
  ];

  return (
    <div
      style={{
        maxWidth: '400px',
        padding: '16px',
        background: 'rgba(25, 25, 35, 0.95)',
        borderRadius: '8px',
        border: '1px solid var(--color-ui-border)',
      }}
    >
      <PreferenceChain
        variant="ranked-list"
        values={values}
        options={options}
        onChange={setValues}
        namePrefix="story-ranked-interactive"
        addLabel="+ Add Weapon"
      />
    </div>
  );
}

export const RankedList: Story = {
  render: () => <RankedListInteractive />,
};
