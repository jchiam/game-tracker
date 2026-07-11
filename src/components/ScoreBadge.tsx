import type { CSSProperties } from 'react';
import { getScoreGrade } from '@/utils/scoring';
import './ScoreBadge.css';

interface ScoreBadgeProps {
  /** Equipment match score in 0–100, or a negative sentinel for insufficient data. */
  score: number;
}

/**
 * The shared roster-card score badge for every game. Renders a miniature Temper-rail
 * readout — rounded percentage, grade letter, and a full-ramp rail with a marker at the
 * score position — or nothing when the score is negative (insufficient data). The
 * percentage colour comes from the game-agnostic `--color-score-grade-*` ramp.
 */
export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score < 0) return null;
  const grade = getScoreGrade(score);
  return (
    <div className={`score-badge grade-${grade.toLowerCase()}`}>
      <span className="score-badge-readout">
        <span className="score-badge-value">{score.toFixed(0)}%</span>
        <span className="score-badge-grade">{grade}</span>
      </span>
      <span className="score-badge-rail" style={{ '--score-pos': `${score}%` } as CSSProperties} />
    </div>
  );
}
