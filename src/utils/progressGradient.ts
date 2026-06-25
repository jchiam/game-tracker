// ─── Investment-progress color gradient ─────────────────────────────
//
// Single source of truth for the cross-game "uninvested → complete"
// color language. Maps a normalized progress value to a set of CSS color
// strings (text / border / glow / active-background) by interpolating
// continuously through the anchor stops below.

export interface ProgressStyle {
  color: string;
  borderColor: string;
  glowColor: string;
  activeBg: string;
}

// Anchor points for the continuous gradient
// Rust → Amber → Gold → Teal (absence → radiance)
export const COLOR_STOPS = [
  { pct: 0, r: 138, g: 96, b: 80 }, // #8a6050 dull rust, lacking / uninvested
  { pct: 0.33, r: 200, g: 128, b: 64 }, // #c88040 warm amber, kindling
  { pct: 0.67, r: 212, g: 175, b: 55 }, // #d4af37 gold, forged
  { pct: 1, r: 64, g: 200, b: 160 }, // #40c8a0 teal, complete
];

function lerpColor(pct: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, pct));
  let lo = COLOR_STOPS[0];
  let hi = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].pct && clamped <= COLOR_STOPS[i + 1].pct) {
      lo = COLOR_STOPS[i];
      hi = COLOR_STOPS[i + 1];
      break;
    }
  }
  const span = hi.pct - lo.pct;
  const t = span === 0 ? 1 : (clamped - lo.pct) / span;
  return [
    Math.round(lo.r + t * (hi.r - lo.r)),
    Math.round(lo.g + t * (hi.g - lo.g)),
    Math.round(lo.b + t * (hi.b - lo.b)),
  ];
}

export function getProgressStyle(value: number, min: number, max: number): ProgressStyle {
  const pct = max === min ? 1 : (value - min) / (max - min);
  const [r, g, b] = lerpColor(pct);
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
    glowColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
    activeBg: `rgba(${r}, ${g}, ${b}, 0.12)`,
  };
}
