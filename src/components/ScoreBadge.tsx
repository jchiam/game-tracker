import { getScoreGrade } from '@/utils/scoring';
import './ScoreBadge.css';

interface ScoreBadgeProps {
  /** Equipment match score in 0–100, or a negative sentinel for insufficient data. */
  score: number;
}

/**
 * The shared roster-card score badge for every game. Renders a graded pill showing the
 * rounded percentage, or nothing when the score is negative (insufficient data). Grade
 * colour comes from the game-agnostic `--color-score-grade-*` ramp.
 */
export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score < 0) return null;
  const grade = getScoreGrade(score).toLowerCase();
  return (
    <div className={`score-badge grade-${grade}`}>
      <span>{score.toFixed(0)}%</span>
    </div>
  );
}
