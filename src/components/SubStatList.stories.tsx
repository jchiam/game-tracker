import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SubStatList, type SubStatValue } from './SubStatList';
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
    variant: 'stat-only',
    values: [],
    options: STATS,
    namePrefix: 'substat',
    onChange: () => {},
  },
} satisfies Meta<typeof SubStatList>;

export default meta;
// SubStatList's props are a discriminated union, which collapses StoryObj<typeof meta>
// args to `never`; these stories are render-only, so use the unparameterized StoryObj.
type Story = StoryObj;

function StatValueList() {
  const [values, setValues] = useState<SubStatValue[]>([
    { type: 'CRIT Rate', value: '3.2%' },
    { type: 'CRIT DMG', value: '6.4%' },
  ]);
  return (
    <SubStatList
      variant="stat-value"
      values={values}
      options={STATS}
      namePrefix="substat"
      label="Substats (Max 4)"
      addLabel="+ Add Substat"
      excludeValues={['ATK%']}
      onChange={setValues}
    />
  );
}

function StatOnlyList() {
  const [values, setValues] = useState<string[]>(['ATK', 'CRIT Rate']);
  return (
    <SubStatList
      variant="stat-only"
      values={values}
      options={STATS}
      namePrefix="substat"
      label="Sub Stats (Max 4)"
      addLabel="+ Add Sub Stat"
      onChange={setValues}
    />
  );
}

export const StatValue: Story = {
  render: () => <StatValueList />,
};

export const StatOnly: Story = {
  render: () => <StatOnlyList />,
};
