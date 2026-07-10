import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubStatList } from './SubStatList';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const STATS = ['HP', 'HP%', 'ATK', 'ATK%', 'DEF', 'DEF%', 'CRIT Rate', 'CRIT DMG', 'SPD'];

const meta = {
  title: 'Components/SubStatList',
  component: SubStatList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 24, background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    values: [],
    options: STATS,
    namePrefix: 'substat',
    onChange: () => {},
  },
} satisfies Meta<typeof SubStatList>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatList() {
  const [values, setValues] = useState<string[]>(['ATK', 'CRIT Rate']);
  return (
    <SubStatList
      values={values}
      options={STATS}
      namePrefix="substat"
      label="Sub Stats (Max 4)"
      addLabel="+ Add Sub Stat"
      excludeValues={['ATK%']}
      onChange={setValues}
    />
  );
}

// Options as `{ value, label }` pairs: the stored value (a stable id) differs from the
// shown in-game label — e.g. P5X Revelation substats.
const ID_STATS = [
  { value: 'attack', label: 'Attack' },
  { value: 'attack-pct', label: 'Attack%' },
  { value: 'damage-mult', label: 'Damage Mult. +' },
  { value: 'crit-rate', label: 'Crit Rate' },
  { value: 'crit-mult', label: 'Crit Mult.' },
];

function IdLabelList() {
  const [values, setValues] = useState<string[]>(['damage-mult', 'crit-mult']);
  return (
    <SubStatList
      values={values}
      options={ID_STATS}
      namePrefix="substat"
      label="Substats — id/label options"
      addLabel="+ Add Substat"
      excludeValues={['attack']}
      onChange={setValues}
    />
  );
}

export const StatOnly: Story = {
  render: () => <StatList />,
};

export const IdLabelOptions: Story = {
  render: () => <IdLabelList />,
};
