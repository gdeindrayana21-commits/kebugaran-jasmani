export type FitnessTestType =
  | 'push_up'
  | 'sit_up'
  | 'back_up'
  | 'jongkok_bangun'
  | 'lari_bolak_balik'
  | 'naik_turun_tangga';

export type Gender = 'L' | 'P';

export interface StudentInfo {
  name: string;
  studentClass: string;
  attendanceNumber: string;
  gender: Gender;
  examinerName: string;
  testDate: string;
}

export interface ScoreBenchmark {
  min: number;
  max: number | null; // null means >= min
  score: number;
  label?: string;
}

export interface TestConfig {
  id: FitnessTestType;
  number: number;
  title: string;
  shortTitle: string;
  unit: string;
  targetMuscles: string;
  description: string;
  techniqueTips: string[];
  defaultDurationSeconds: number; // e.g. 15s or 30s or 60s
  defaultBenchmarks: ScoreBenchmark[];
}

export interface SingleTestResult {
  testId: FitnessTestType;
  reps: number | null;
  timeSeconds: number;
  timeFormatted: string;
  score: number | null;
  predicate: string | null;
  status: 'belum' | 'berlangsung' | 'selesai';
  notes?: string;
  completedAt?: string;
}

export interface AssessmentRecord {
  id: string;
  timestamp: string;
  student: StudentInfo;
  tests: Record<FitnessTestType, SingleTestResult>;
  totalScore: number;
  finalScore: number;
  predicate: string;
  notes?: string;
}

export type ScoreBenchmarksConfig = Record<FitnessTestType, ScoreBenchmark[]>;

export interface PredicateInfo {
  name: string;
  minScore: number;
  maxScore: number;
  colorClass: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}
