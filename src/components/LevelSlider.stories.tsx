import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LevelSlider } from './LevelSlider';
import '@/styles/tokens.css';
import '@/styles/controls.css';

const meta = {
  title: 'Components/LevelSlider',
  component: LevelSlider,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, padding: 24, background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    name: 'level',
    value: 45,
    min: 1,
    max: 90,
    onChange: () => {},
  },
} satisfies Meta<typeof LevelSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultSlider() {
  const [value, setValue] = useState(45);
  return <LevelSlider name="level" value={value} min={1} max={90} onChange={setValue} />;
}

function ReadoutSlider() {
  const [value, setValue] = useState(12);
  return (
    <LevelSlider
      name="cartridge-level"
      value={value}
      min={0}
      max={20}
      showValue
      onChange={setValue}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultSlider />,
};

export const WithReadout: Story = {
  render: () => <ReadoutSlider />,
};

/** The fill walks the rust→teal investment gradient as the value climbs. */
export const GradientWalk: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {[1, 30, 60, 90].map((v) => (
        <LevelSlider
          key={v}
          name={`lvl-${v}`}
          value={v}
          min={1}
          max={90}
          showValue
          onChange={() => {}}
        />
      ))}
    </div>
  ),
};
