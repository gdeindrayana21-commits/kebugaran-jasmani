import { FitnessTestType, ScoreBenchmark, ScoreBenchmarksConfig, SingleTestResult } from '../types';
import { FITNESS_TESTS, PREDICATES } from '../constants/fitnessTests';

export function getDefaultBenchmarksConfig(): ScoreBenchmarksConfig {
  const config: Partial<ScoreBenchmarksConfig> = {};
  for (const test of FITNESS_TESTS) {
    config[test.id] = [...test.defaultBenchmarks];
  }
  return config as ScoreBenchmarksConfig;
}

export function calculateTestScore(
  testId: FitnessTestType,
  reps: number,
  benchmarksConfig: ScoreBenchmarksConfig
): number {
  if (reps < 0 || isNaN(reps)) return 0;

  const benchmarks = benchmarksConfig[testId] || FITNESS_TESTS.find(t => t.id === testId)?.defaultBenchmarks || [];

  // Sort descending by min to match the highest reached threshold first
  const sorted = [...benchmarks].sort((a, b) => (b.min - a.min));

  for (const item of sorted) {
    if (item.max === null) {
      if (reps >= item.min) return item.score;
    } else {
      if (reps >= item.min && reps <= item.max) return item.score;
    }
  }

  // Fallback to the lowest score in benchmark or 50
  return benchmarks[0]?.score ?? 50;
}

export function getPredicate(score: number): {
  name: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
} {
  for (const pred of PREDICATES) {
    if (score >= pred.minScore && score <= pred.maxScore) {
      return pred;
    }
  }
  return PREDICATES[PREDICATES.length - 1];
}

export function formatTimeMMSS(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateSummary(tests: Record<FitnessTestType, SingleTestResult>) {
  const testValues = Object.values(tests);
  const completedCount = testValues.filter(t => t.score !== null && t.score !== undefined).length;
  
  let totalScore = 0;
  let totalSeconds = 0;

  for (const t of testValues) {
    if (typeof t.score === 'number') {
      totalScore += t.score;
    }
    if (typeof t.timeSeconds === 'number') {
      totalSeconds += t.timeSeconds;
    }
  }

  // Final score is total divided by 6 (or completed count if strictly calculated over 6)
  const finalScore = completedCount > 0 ? Number((totalScore / 6).toFixed(2)) : 0;
  const predicate = getPredicate(finalScore).name;

  return {
    totalScore,
    finalScore,
    totalSeconds,
    totalTimeFormatted: formatTimeMMSS(totalSeconds),
    predicate,
    isAllCompleted: completedCount === 6,
    completedCount,
  };
}
