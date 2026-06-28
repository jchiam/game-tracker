import type { CSSProperties } from 'react';
import { getProgressStyle } from '@/utils/progressGradient';

interface LevelSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  name: string;
  /** Show a numeric readout beside the slider. */
  showValue?: boolean;
}

/**
 * The canonical range control. The fill colour is computed internally from the
 * shared `progressGradient` over `[min, max]`, so every level slider shares the
 * cross-game investment gradient — callers never pass a fill colour.
 */
export function LevelSlider({ value, min, max, onChange, name, showValue }: LevelSliderProps) {
  const ps = getProgressStyle(value, min, max);
  const pct = max === min ? 100 : ((value - min) / (max - min)) * 100;

  const slider = (
    <input
      type="range"
      name={name}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="level-slider"
      style={
        {
          '--slider-fill-color': ps.color,
          '--slider-fill-glow': ps.glowColor,
          background: `linear-gradient(to right, ${ps.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        } as CSSProperties
      }
    />
  );

  if (!showValue) return slider;

  return (
    <div className="level-slider-row">
      {slider}
      <span className="level-value">{value}</span>
    </div>
  );
}
