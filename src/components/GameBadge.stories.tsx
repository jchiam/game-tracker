import type { Meta, StoryObj } from '@storybook/react-vite';
import { GameBadge } from './GameBadge';
import '@/pages/honkai-star-rail/components/CharacterCard.css';
import '@/pages/reverse1999/components/ArcanistCard.css';
import '@/pages/neverness-to-everness/components/CharacterCard.css';
import '@/pages/arknights-endfield/components/OperatorCard.css';
import '@/App.css';

const meta = {
  title: 'Components/GameBadge',
  component: GameBadge,
  tags: ['autodocs'],
  args: {
    label: 'Fire',
    variant: 'element',
    modifier: 'fire',
  },
} satisfies Meta<typeof GameBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HSRElement: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Fire" variant="element" modifier="fire" />
      <GameBadge label="Ice" variant="element" modifier="ice" />
      <GameBadge label="Lightning" variant="element" modifier="lightning" />
      <GameBadge label="Wind" variant="element" modifier="wind" />
      <GameBadge label="Quantum" variant="element" modifier="quantum" />
      <GameBadge label="Imaginary" variant="element" modifier="imaginary" />
      <GameBadge label="Physical" variant="element" modifier="physical" />
    </div>
  ),
};

export const HSRPath: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Destruction" variant="path" modifier="destruction" />
      <GameBadge label="The Hunt" variant="path" modifier="the-hunt" />
      <GameBadge label="Erudition" variant="path" modifier="erudition" />
      <GameBadge label="Harmony" variant="path" modifier="harmony" />
      <GameBadge label="Nihility" variant="path" modifier="nihility" />
      <GameBadge label="Preservation" variant="path" modifier="preservation" />
      <GameBadge label="Abundance" variant="path" modifier="abundance" />
      <GameBadge label="Remembrance" variant="path" modifier="remembrance" />
    </div>
  ),
};

export const R1999Afflatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Plant" variant="afflatus" modifier="plant" />
      <GameBadge label="Star" variant="afflatus" modifier="star" />
      <GameBadge label="Beast" variant="afflatus" modifier="beast" />
      <GameBadge label="Mineral" variant="afflatus" modifier="mineral" />
      <GameBadge label="Intellect" variant="afflatus" modifier="intellect" />
      <GameBadge label="Spirit" variant="afflatus" modifier="spirit" />
    </div>
  ),
};

export const R1999Damage: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Mental" variant="damage" modifier="mental" />
      <GameBadge label="Reality" variant="damage" modifier="real" />
    </div>
  ),
};

export const N2EEsper: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Anima" variant="esper" modifier="anima" />
      <GameBadge label="Chaos" variant="esper" modifier="chaos" />
      <GameBadge label="Cosmos" variant="esper" modifier="cosmos" />
      <GameBadge label="Incantation" variant="esper" modifier="incantation" />
      <GameBadge label="Lakshana" variant="esper" modifier="lakshana" />
      <GameBadge label="Psyche" variant="esper" modifier="psyche" />
    </div>
  ),
};

export const N2EArc: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Gas" variant="arc" modifier="gas" />
      <GameBadge label="Liquid" variant="arc" modifier="liquid" />
      <GameBadge label="Plasma" variant="arc" modifier="plasma" />
      <GameBadge label="Solid" variant="arc" modifier="solid" />
      <GameBadge label="Synthesis" variant="arc" modifier="synthesis" />
    </div>
  ),
};

export const AEClass: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Caster" variant="ae-class" modifier="caster" />
      <GameBadge label="Defender" variant="ae-class" modifier="defender" />
      <GameBadge label="Guard" variant="ae-class" modifier="guard" />
      <GameBadge label="Striker" variant="ae-class" modifier="striker" />
      <GameBadge label="Supporter" variant="ae-class" modifier="supporter" />
      <GameBadge label="Vanguard" variant="ae-class" modifier="vanguard" />
    </div>
  ),
};

export const AEElement: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Physical" variant="ae-element" modifier="physical" />
      <GameBadge label="Cryo" variant="ae-element" modifier="cryo" />
      <GameBadge label="Electric" variant="ae-element" modifier="electric" />
      <GameBadge label="Heat" variant="ae-element" modifier="heat" />
      <GameBadge label="Nature" variant="ae-element" modifier="nature" />
    </div>
  ),
};

export const AEWeapon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <GameBadge label="Sword" variant="ae-weapon" modifier="sword" />
      <GameBadge label="Greatsword" variant="ae-weapon" modifier="greatsword" />
      <GameBadge label="Polearm" variant="ae-weapon" modifier="polearm" />
      <GameBadge label="Handcannon" variant="ae-weapon" modifier="handcannon" />
      <GameBadge label="Arts Unit" variant="ae-weapon" modifier="arts-unit" />
    </div>
  ),
};
