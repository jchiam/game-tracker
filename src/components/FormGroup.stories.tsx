import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FormGroup } from './FormGroup';
import { Select } from './Select';
import '@/styles/tokens.css';
import '@/styles/controls.css';
import './Modal.css';

const meta = {
  title: 'Components/FormGroup',
  component: FormGroup,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320, padding: 24, background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Main Stat',
  },
} satisfies Meta<typeof FormGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSelect: Story = {
  args: {
    children: (
      <Select name="main-stat" value="ATK%" options={['HP%', 'ATK%', 'DEF%']} onChange={fn()} />
    ),
  },
};

export const WithInput: Story = {
  args: {
    label: 'Build Name',
    children: <input name="name" placeholder="Enter a name…" />,
  },
};

/** `className="is-gated"` dims the whole group — used to gate a stat control behind an
 * unmet precondition (e.g. no equipped set). The control's own `disabled` blocks interaction. */
export const Gated: Story = {
  args: {
    className: 'is-gated',
    children: (
      <Select
        name="main-stat"
        value="ATK%"
        options={['HP%', 'ATK%', 'DEF%']}
        onChange={fn()}
        disabled
      />
    ),
  },
};

/** A fixed, non-editable main stat shown via the shared `.readonly-stat` class. */
export const ReadonlyFixedMain: Story = {
  args: {
    children: <span className="readonly-stat">HP (Fixed)</span>,
  },
};
