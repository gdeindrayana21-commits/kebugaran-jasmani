import { AssessmentRecord, ScoreBenchmarksConfig, StudentInfo, FitnessTestType, SingleTestResult } from '../types';
import { getDefaultBenchmarksConfig } from './scoreCalculator';
import { DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';

const STORAGE_KEYS = {
  RECORDS: 'pjok_assessment_records_v1',
  BENCHMARKS: 'pjok_benchmarks_config_v1',
  CURRENT_TEACHER: 'pjok_teacher_name_v1',
  ACTIVE_DRAFT: 'pjok_active_draft_session_v1',
  PENDING_SYNC: 'pjok_pending_sync_queue_v1',
};

export interface ActiveDraftSession {
  recordId: string;
  student: StudentInfo;
  tests: Record<FitnessTestType, SingleTestResult>;
  notes: string;
  isLocked: boolean;
  lastUpdated: string;
}

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
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_RECORDS;
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

/**
 * Merge cloud records with local records intelligently:
 * Keeps whichever version is newer and never deletes local records that aren't yet on cloud.
 * Also preserves any completed tests across sync so scores are never wiped.
 */
export function mergeAssessmentRecords(
  cloudRecords: AssessmentRecord[],
  localRecords: AssessmentRecord[]
): AssessmentRecord[] {
  const map = new Map<string, AssessmentRecord>();

  // Add local records first
  for (const rec of localRecords) {
    if (rec && rec.id) {
      map.set(rec.id, rec);
    }
  }

  // Merge cloud records: if cloud record exists, combine completed tests
  for (const rec of cloudRecords) {
    if (!rec || !rec.id) continue;
    const existing = map.get(rec.id);
    if (!existing) {
      map.set(rec.id, rec);
    } else {
      const existingTime = new Date(existing.timestamp || 0).getTime();
      const cloudTime = new Date(rec.timestamp || 0).getTime();
      
      // Merge test results between cloud and local so no completed tests are lost
      const mergedTests = { ...(existing.tests || {}), ...(rec.tests || {}) };
      for (const tKey of Object.keys(existing.tests || {})) {
        const testId = tKey as FitnessTestType;
        const existTest = existing.tests?.[testId];
        const cloudTest = rec.tests?.[testId];
        // If local test is completed and cloud is not, preserve local
        if (existTest && existTest.status === 'selesai' && (!cloudTest || cloudTest.status !== 'selesai')) {
          mergedTests[testId] = existTest;
        }
      }

      const baseRecord = cloudTime >= existingTime ? rec : existing;
      map.set(rec.id, {
        ...baseRecord,
        tests: mergedTests as Record<FitnessTestType, SingleTestResult>,
      });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return result;
}

/**
 * Active In-Progress Draft Session
 * Saves test inputs as the student performs them so that closing the tab or browser
 * never causes data loss.
 */
export function getActiveDraft(): ActiveDraftSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic validation
    if (parsed && typeof parsed === 'object' && parsed.student && parsed.tests) {
      return parsed as ActiveDraftSession;
    }
    return null;
  } catch (err) {
    console.warn('Failed to parse active draft:', err);
    return null;
  }
}

export function saveActiveDraft(draft: ActiveDraftSession) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to persist active draft:', err);
  }
}

export function clearActiveDraft() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
  } catch (err) {
    console.warn('Failed to clear active draft:', err);
  }
}

/**
 * Pending Sync Queue for records created while offline or during unstable network.
 */
export function getPendingSyncRecords(): AssessmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function savePendingSyncRecords(records: AssessmentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save pending sync queue:', err);
  }
}

export function addPendingSyncRecord(record: AssessmentRecord) {
  try {
    const current = getPendingSyncRecords();
    const idx = current.findIndex((r) => r.id === record.id);
    let updated: AssessmentRecord[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = record;
    } else {
      updated = [record, ...current];
    }
    savePendingSyncRecords(updated);
  } catch (err) {
    console.warn('Failed to add pending record:', err);
  }
}

export function removePendingSyncRecord(recordId: string) {
  try {
    const current = getPendingSyncRecords();
    const filtered = current.filter((r) => r.id !== recordId);
    savePendingSyncRecords(filtered);
  } catch (err) {
    console.warn('Failed to remove pending record:', err);
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
