import { AssessmentRecord, ScoreBenchmarksConfig, StudentInfo } from '../types';
import { getDefaultBenchmarksConfig } from './scoreCalculator';
import { DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';

const STORAGE_KEYS = {
  RECORDS: 'pjok_assessment_records_v1',
  BENCHMARKS: 'pjok_benchmarks_config_v1',
  CURRENT_TEACHER: 'pjok_teacher_name_v1',
};

export const INITIAL_SAMPLE_RECORDS: AssessmentRecord[] = [
  {
    id: 'rec-sample-1',
    timestamp: new Date().toISOString(),
    student: {
      name: 'Andi Pratama',
      studentClass: 'X.1',
      attendanceNumber: '01',
      gender: 'L',
      examinerName: DEFAULT_TEACHER_NAME,
      testDate: new Date().toISOString().split('T')[0],
    },
    tests: {
      push_up: { testId: 'push_up', reps: 20, timeSeconds: 15, timeFormatted: '00:15', score: 80, predicate: 'BAIK', status: 'selesai' },
      sit_up: { testId: 'sit_up', reps: 22, timeSeconds: 15, timeFormatted: '00:15', score: 90, predicate: 'SANGAT BAIK', status: 'selesai' },
      back_up: { testId: 'back_up', reps: 18, timeSeconds: 15, timeFormatted: '00:15', score: 80, predicate: 'BAIK', status: 'selesai' },
      jongkok_bangun: { testId: 'jongkok_bangun', reps: 20, timeSeconds: 15, timeFormatted: '00:15', score: 80, predicate: 'BAIK', status: 'selesai' },
      lari_bolak_balik: { testId: 'lari_bolak_balik', reps: 8, timeSeconds: 30, timeFormatted: '00:30', score: 80, predicate: 'BAIK', status: 'selesai' },
      naik_turun_tangga: { testId: 'naik_turun_tangga', reps: 21, timeSeconds: 30, timeFormatted: '00:30', score: 90, predicate: 'SANGAT BAIK', status: 'selesai' },
    },
    totalScore: 500,
    finalScore: 83.33,
    predicate: 'BAIK',
    notes: 'Kondisi fisik sangat prima dan teknik gerakan konsisten.',
  },
  {
    id: 'rec-sample-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    student: {
      name: 'Ni Kadek Budiastuti',
      studentClass: 'X.1',
      attendanceNumber: '14',
      gender: 'P',
      examinerName: DEFAULT_TEACHER_NAME,
      testDate: new Date().toISOString().split('T')[0],
    },
    tests: {
      push_up: { testId: 'push_up', reps: 26, timeSeconds: 15, timeFormatted: '00:15', score: 100, predicate: 'SANGAT BAIK', status: 'selesai' },
      sit_up: { testId: 'sit_up', reps: 27, timeSeconds: 15, timeFormatted: '00:15', score: 100, predicate: 'SANGAT BAIK', status: 'selesai' },
      back_up: { testId: 'back_up', reps: 25, timeSeconds: 15, timeFormatted: '00:15', score: 90, predicate: 'SANGAT BAIK', status: 'selesai' },
      jongkok_bangun: { testId: 'jongkok_bangun', reps: 24, timeSeconds: 15, timeFormatted: '00:15', score: 90, predicate: 'SANGAT BAIK', status: 'selesai' },
      lari_bolak_balik: { testId: 'lari_bolak_balik', reps: 11, timeSeconds: 30, timeFormatted: '00:30', score: 100, predicate: 'SANGAT BAIK', status: 'selesai' },
      naik_turun_tangga: { testId: 'naik_turun_tangga', reps: 26, timeSeconds: 30, timeFormatted: '00:30', score: 100, predicate: 'SANGAT BAIK', status: 'selesai' },
    },
    totalScore: 580,
    finalScore: 96.67,
    predicate: 'SANGAT BAIK',
    notes: 'Performa luar biasa di seluruh aspek kelincahan dan daya tahan.',
  },
];

export function getSavedRecords(): AssessmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(INITIAL_SAMPLE_RECORDS));
      return INITIAL_SAMPLE_RECORDS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load assessment records from storage:', err);
    return INITIAL_SAMPLE_RECORDS;
  }
}

export function saveRecords(records: AssessmentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save assessment records:', err);
  }
}

export function getSavedBenchmarks(): ScoreBenchmarksConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENCHMARKS);
    if (!raw) {
      const defaults = getDefaultBenchmarksConfig();
      localStorage.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultBenchmarksConfig();
  }
}

export function saveBenchmarks(benchmarks: ScoreBenchmarksConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(benchmarks));
  } catch (err) {
    console.error('Failed to save benchmarks:', err);
  }
}

export function getSavedTeacherName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_TEACHER) || DEFAULT_TEACHER_NAME;
  } catch {
    return DEFAULT_TEACHER_NAME;
  }
}

export function saveTeacherName(name: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TEACHER, name);
  } catch (err) {
    console.error('Failed to save teacher name:', err);
  }
}
