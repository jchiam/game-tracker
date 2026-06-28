import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

/* ─── Helper: read computed CSS variable ─── */
function getVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ─── Shared layout styles ─── */
const pageStyle: React.CSSProperties = {
  background: '#0a0a0f',
  padding: '32px',
  fontFamily: "'Inter', system-ui, sans-serif",
  color: '#f0f0f5',
  minHeight: '100vh',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '48px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '16px',
  color: '#d4af37',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '12px',
  marginTop: '24px',
  color: '#a0a0b5',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '12px',
};

/* ─── Color Swatch ─── */
interface SwatchProps {
  variable: string;
}

function Swatch({ variable }: SwatchProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getVar(variable));
  }, [variable]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px',
        borderRadius: '6px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '4px',
          backgroundColor: `var(${variable})`,
          border: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
      />
      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#f0f0f5',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {variable}
        </div>
        <div
          style={{
            fontSize: '0.7rem',
            color: '#a0a0b5',
            fontFamily: 'monospace',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Color Group ─── */
interface ColorGroupProps {
  label: string;
  variables: string[];
}

function ColorGroup({ label, variables }: ColorGroupProps) {
  return (
    <div>
      <h3 style={subheadingStyle}>{label}</h3>
      <div style={gridStyle}>
        {variables.map((v) => (
          <Swatch key={v} variable={v} />
        ))}
      </div>
    </div>
  );
}

/* ─── Colors Section ─── */
function ColorsSection() {
  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Colors</h2>

      <ColorGroup
        label="Background"
        variables={[
          '--color-bg-base',
          '--color-bg-surface',
          '--color-bg-surface-hover',
          '--color-bg-elevated',
        ]}
      />

      <ColorGroup
        label="Text"
        variables={[
          '--color-text-primary',
          '--color-text-secondary',
          '--color-text-dim',
          '--color-text-on-primary',
        ]}
      />

      <ColorGroup
        label="Brand"
        variables={[
          '--color-brand-primary',
          '--color-brand-primary-glow',
          '--color-brand-primary-muted',
          '--color-brand-accent',
        ]}
      />

      <ColorGroup
        label="UI"
        variables={[
          '--color-ui-border',
          '--color-ui-border-strong',
          '--color-ui-danger',
          '--color-ui-danger-bg',
          '--color-ui-warning',
          '--color-ui-interactive-hover',
        ]}
      />

      <ColorGroup
        label="Input"
        variables={[
          '--color-input-surface',
          '--color-input-surface-focus',
          '--color-input-surface-subtle',
          '--color-focus-glow',
        ]}
      />

      <ColorGroup
        label="Game: Honkai Star Rail"
        variables={[
          '--color-hsr-element-lightning',
          '--color-hsr-element-fire',
          '--color-hsr-element-ice',
          '--color-hsr-element-quantum',
          '--color-hsr-element-wind',
          '--color-hsr-element-imaginary',
          '--color-hsr-element-physical',
        ]}
      />

      <ColorGroup
        label="Game: Reverse 1999"
        variables={[
          '--color-r1999-afflatus-plant',
          '--color-r1999-afflatus-star',
          '--color-r1999-afflatus-beast',
          '--color-r1999-afflatus-mineral',
          '--color-r1999-afflatus-intellect',
          '--color-r1999-afflatus-spirit',
        ]}
      />

      <ColorGroup
        label="Game: Neverness to Everness"
        variables={[
          '--color-n2e-esper-anima',
          '--color-n2e-esper-chaos',
          '--color-n2e-esper-cosmos',
          '--color-n2e-esper-incantation',
          '--color-n2e-esper-lakshana',
          '--color-n2e-esper-psyche',
        ]}
      />

      <ColorGroup
        label="Tier"
        variables={['--color-tier-splus', '--color-tier-s', '--color-tier-a', '--color-tier-b']}
      />
    </section>
  );
}

/* ─── Typography Section ─── */
function TypographySection() {
  const sizes = [
    { variable: '--typography-font-size-xs', label: 'xs', value: '0.7rem' },
    { variable: '--typography-font-size-sm', label: 'sm', value: '0.8rem' },
    { variable: '--typography-font-size-base', label: 'base', value: '0.9rem' },
    { variable: '--typography-font-size-md', label: 'md', value: '1rem' },
    { variable: '--typography-font-size-lg', label: 'lg', value: '1.1rem' },
    { variable: '--typography-font-size-xl', label: 'xl', value: '1.2rem' },
    { variable: '--typography-font-size-xl2', label: 'xl2', value: '1.25rem' },
    { variable: '--typography-font-size-2xl', label: '2xl', value: '1.5rem' },
    { variable: '--typography-font-size-3xl', label: '3xl', value: '1.8rem' },
    { variable: '--typography-font-size-4xl', label: '4xl', value: '2.2rem' },
    { variable: '--typography-font-size-5xl', label: '5xl', value: '3rem' },
    { variable: '--typography-font-size-display', label: 'display', value: '4rem' },
  ];

  const weights = [
    { label: 'normal', value: 400 },
    { label: 'medium', value: 500 },
    { label: 'semibold', value: 600 },
    { label: 'bold', value: 700 },
    { label: 'extrabold', value: 800 },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Typography</h2>

      <h3 style={subheadingStyle}>Font Sizes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sizes.map(({ variable, label: _label, value }) => (
          <div
            key={variable}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                fontSize: `var(${variable})`,
                fontWeight: 500,
                minWidth: '200px',
              }}
            >
              The quick brown fox
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#a0a0b5',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {variable} ({value})
            </span>
          </div>
        ))}
      </div>

      <h3 style={subheadingStyle}>Font Weights</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {weights.map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: value,
                minWidth: '200px',
              }}
            >
              The quick brown fox
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#a0a0b5',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {label} ({value})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Spacing Section ─── */
function SpacingSection() {
  const spacings = [
    { variable: '--spacing-1', label: '1', value: '2px' },
    { variable: '--spacing-2', label: '2', value: '4px' },
    { variable: '--spacing-3', label: '3', value: '6px' },
    { variable: '--spacing-sm', label: 'sm', value: '8px' },
    { variable: '--spacing-5', label: '5', value: '10px' },
    { variable: '--spacing-6', label: '6', value: '12px' },
    { variable: '--spacing-md', label: 'md', value: '16px' },
    { variable: '--spacing-lg', label: 'lg', value: '24px' },
    { variable: '--spacing-xl', label: 'xl', value: '32px' },
    { variable: '--spacing-2xl', label: '2xl', value: '48px' },
    { variable: '--spacing-3xl', label: '3xl', value: '64px' },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Spacing</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {spacings.map(({ variable, label: _label, value }) => (
          <div
            key={variable}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: `var(${variable})`,
                height: '16px',
                backgroundColor: '#d4af37',
                borderRadius: '2px',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: '#a0a0b5',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              {variable} ({value})
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Border Radius Section ─── */
function BorderRadiusSection() {
  const radii = [
    { variable: '--border-radius-xs', label: 'xs', value: '2px' },
    { variable: '--border-radius-sm', label: 'sm', value: '4px' },
    { variable: '--border-radius-md', label: 'md', value: '8px' },
    { variable: '--border-radius-badge', label: 'badge', value: '10px' },
    { variable: '--border-radius-lg', label: 'lg', value: '16px' },
    { variable: '--border-radius-xl', label: 'xl', value: '20px' },
    { variable: '--border-radius-full', label: 'full', value: '9999px' },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Border Radius</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
        }}
      >
        {radii.map(({ variable, label: _label, value }) => (
          <div
            key={variable}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#d4af37',
                borderRadius: `var(${variable})`,
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f0f0f5',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {variable}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: '#a0a0b5',
                fontFamily: 'monospace',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Shadows Section ─── */
function ShadowsSection() {
  const shadows = [
    { variable: '--shadow-sm', label: 'sm' },
    { variable: '--shadow-md', label: 'md' },
    { variable: '--shadow-lg', label: 'lg' },
    { variable: '--shadow-xl', label: 'xl' },
    { variable: '--shadow-glow-primary', label: 'glow-primary' },
    { variable: '--shadow-glow-sm', label: 'glow-sm' },
    { variable: '--shadow-inset-glow', label: 'inset-glow' },
    { variable: '--shadow-slider-track-inset', label: 'slider-track-inset' },
    { variable: '--shadow-modal', label: 'modal' },
    { variable: '--shadow-card-hover', label: 'card-hover' },
  ];

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Shadows</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '24px',
        }}
      >
        {shadows.map(({ variable, label: _label }) => (
          <div
            key={variable}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '80px',
                backgroundColor: 'rgba(30, 30, 42, 0.9)',
                borderRadius: '8px',
                boxShadow: `var(${variable})`,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f0f0f5',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {variable}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Full Design Tokens Page ─── */
function DesignTokens() {
  return (
    <div style={pageStyle}>
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: '8px',
          color: '#f0f0f5',
        }}
      >
        Design Tokens
      </h1>
      <p
        style={{
          fontSize: '0.9rem',
          color: '#a0a0b5',
          marginBottom: '40px',
        }}
      >
        Visual reference for the Game Tracker design token system. All values are read from CSS
        custom properties at runtime.
      </p>
      <ColorsSection />
      <TypographySection />
      <SpacingSection />
      <BorderRadiusSection />
      <ShadowsSection />
    </div>
  );
}

/* ─── Storybook Meta ─── */
const meta = {
  title: 'Design System/Tokens',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Colors: Story = {
  render: () => (
    <div style={pageStyle}>
      <ColorsSection />
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div style={pageStyle}>
      <TypographySection />
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div style={pageStyle}>
      <SpacingSection />
    </div>
  ),
};

export const BorderRadius: Story = {
  render: () => (
    <div style={pageStyle}>
      <BorderRadiusSection />
    </div>
  ),
};

export const Shadows: Story = {
  render: () => (
    <div style={pageStyle}>
      <ShadowsSection />
    </div>
  ),
};

export const AllTokens: Story = {
  render: () => <DesignTokens />,
};
