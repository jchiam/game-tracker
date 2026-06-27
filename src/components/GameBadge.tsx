interface GameBadgeProps {
  label: string;
  variant: string;
  modifier: string;
}

export function GameBadge({ label, variant, modifier }: GameBadgeProps) {
  return <span className={`game-badge ${variant}-badge ${variant}-${modifier}`}>{label}</span>;
}
