import type { StatPreference } from '@/types';

interface PreferenceChainReadoutProps {
  label: string;
  chain: StatPreference[];
  /** Resolves a stored stat value to its display label; omitted = render as-is. */
  formatStat?: (stat: string) => string;
}

/**
 * Read-only twin of `PreferenceChain`: one Target Build chain row — label plus
 * stat badges with operator badges (`>=` shown as `≥`). Renders nothing for an
 * empty chain. Uses the shared `card.css` readout classes.
 */
export function PreferenceChainReadout({ label, chain, formatStat }: PreferenceChainReadoutProps) {
  if (chain.length === 0) return null;
  return (
    <div className="pref-display-row">
      <span className="pref-display-label">{label}</span>
      <div className="pref-display-chain">
        {chain.map((p, i) => (
          <span key={i}>
            <span className="pref-stat-badge">{formatStat ? formatStat(p.stat) : p.stat}</span>
            {p.operator && (
              <span className="pref-operator-badge">{p.operator === '>=' ? '≥' : p.operator}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
