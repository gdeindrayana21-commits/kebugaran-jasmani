import { AssessmentRecord, FitnessTestType, SingleTestResult, StudentInfo } from '../types';
import { calculateSummary } from './scoreCalculator';

export const ALL_FITNESS_TEST_IDS: FitnessTestType[] = [
  'push_up',
  'sit_up',
  'back_up',
  'jongkok_bangun',
  'lari_bolak_balik',
  'naik_turun_tangga',
];

export const TEST_LABEL_MAP: Record<FitnessTestType, string> = {
  push_up: 'Push Up',
  sit_up: 'Sit Up',
  back_up: 'Back Up',
  jongkok_bangun: 'Jongkok Bangun',
  lari_bolak_balik: 'Lari Bolak-Balik',
  naik_turun_tangga: 'Naik Turun Tangga',
};

/**
 * Check if a single test result contains valid, completed assessment data.
 */
export function isTestCompleted(test?: SingleTestResult): boolean {
  if (!test) return false;
  if (test.status === 'selesai') return true;
  if (typeof test.score === 'number' && test.score > 0) return true;
  if (typeof test.reps === 'number' && test.reps > 0) return true;
  return false;
}

/**
 * Normalize attendance number for reliable matching (e.g. '01' -> '1', ' 08 ' -> '8')
 */
export function normalizeAttendanceNumber(absen?: string): string {
  if (!absen) return '';
  const trimmed = absen.trim();
  const parsed = parseInt(trimmed, 10);
  return !isNaN(parsed) ? String(parsed) : trimmed;
}

/**
 * Normalize student name (lowercase, stripped spaces)
 */
export function normalizeStudentName(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check whether two StudentInfo objects belong to the exact same student.
 * Compares class AND (attendance number OR student name).
 * Prevents false positives where different students have the same attendance number.
 */
export function isSameStudent(a: StudentInfo, b: StudentInfo): boolean {
  if (!a || !b) return false;

  const classA = (a.studentClass || '').trim().toUpperCase();
  const classB = (b.studentClass || '').trim().toUpperCase();

  // Different class cannot be the same student
  if (classA !== classB) return false;

  const absenA = normalizeAttendanceNumber(a.attendanceNumber);
  const absenB = normalizeAttendanceNumber(b.attendanceNumber);
  const nameA = normalizeStudentName(a.name);
  const nameB = normalizeStudentName(b.name);

  const hasBothNames = nameA.length >= 2 && nameB.length >= 2;
  const namesMatch = nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA);

  // If both records have distinct names that do NOT match, they CANNOT be the same student,
  // even if attendance number is the same (e.g. unedited default, typo, or different student).
  if (hasBothNames && !namesMatch) {
    return false;
  }

  // Exact name match in the same class
  if (hasBothNames && nameA === nameB) {
    return true;
  }

  // Name substring match with matching or missing attendance number
  if (hasBothNames && namesMatch) {
    if (!absenA || !absenB || absenA === absenB) {
      return true;
    }
  }

  // Match by attendance number ONLY if names are not in conflict
  if (absenA && absenB && absenA === absenB) {
    if (!nameA || !nameB || namesMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Consolidates multiple assessment records for the same student into a single unified record.
 * When the 6 evaluators have submitted their scores for a student, all 6 tests are merged into 1 record.
 * The total score, final score (average over 6), and predicate are computed from all 6 completed tests.
 */
export function consolidateAssessmentRecords(records: AssessmentRecord[]): AssessmentRecord[] {
  if (!records || records.length === 0) return [];

  // Group records by student
  const groups: AssessmentRecord[][] = [];

  for (const rec of records) {
    if (!rec || !rec.student) continue;

    let foundGroup = false;
    for (const group of groups) {
      if (isSameStudent(group[0].student, rec.student)) {
        group.push(rec);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([rec]);
    }
  }

  // Process each group into a single consolidated record
  const consolidatedList: AssessmentRecord[] = [];

  for (const group of groups) {
    if (group.length === 1) {
      // Single record: count completed tests and ensure metadata is set
      const rec = group[0];
      const completedCount = ALL_FITNESS_TEST_IDS.filter((id) => isTestCompleted(rec.tests?.[id])).length;
      consolidatedList.push({
        ...rec,
        completedTestsCount: completedCount,
        examinersList: rec.student.examinerName ? [rec.student.examinerName] : [],
        sourceRecordIds: [rec.id],
      });
      continue;
    }

    // Multiple records for the same student (e.g. from 6 different assessors)
    // Sort ascending by timestamp so newer inputs can update older ones
    group.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

    const latestRec = group[group.length - 1];

    // Pick best student name (longest string, usually most complete)
    let bestName = group[0].student.name || '';
    for (const r of group) {
      if (r.student.name && r.student.name.trim().length > bestName.trim().length) {
        bestName = r.student.name.trim();
      }
    }

    // Pick cleanest attendance number
    let bestAbsen = group[0].student.attendanceNumber || '';
    for (const r of group) {
      if (r.student.attendanceNumber && r.student.attendanceNumber.trim()) {
        bestAbsen = r.student.attendanceNumber.trim();
        break;
      }
    }

    // Collect all unique examiner names
    const examinersSet = new Set<string>();
    group.forEach((r) => {
      if (r.student.examinerName && r.student.examinerName.trim()) {
        examinersSet.add(r.student.examinerName.trim());
      }
    });
    const examinersList = Array.from(examinersSet);
    const combinedExaminers = examinersList.length > 0 ? examinersList.join(', ') : latestRec.student.examinerName;

    // Merge the 6 fitness tests
    const mergedTests: Record<FitnessTestType, SingleTestResult> = {
      push_up: { testId: 'push_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
      sit_up: { testId: 'sit_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
      back_up: { testId: 'back_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
      jongkok_bangun: { testId: 'jongkok_bangun', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
      lari_bolak_balik: { testId: 'lari_bolak_balik', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
      naik_turun_tangga: { testId: 'naik_turun_tangga', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
    };

    const notesList: string[] = [];
    const sourceRecordIds: string[] = [];

    for (const r of group) {
      sourceRecordIds.push(r.id);
      if (r.notes && r.notes.trim() && !notesList.includes(r.notes.trim())) {
        notesList.push(r.notes.trim());
      }

      for (const testId of ALL_FITNESS_TEST_IDS) {
        const testItem = r.tests?.[testId];
        if (isTestCompleted(testItem)) {
          const current = mergedTests[testId];
          // Take if not yet set, or if this test has higher score or is completed
          if (!isTestCompleted(current) || (testItem.score ?? 0) >= (current.score ?? 0)) {
            mergedTests[testId] = { ...testItem };
          }
        }
      }
    }

    // Recompute total score, final score (average over 6), and predicate
    const summary = calculateSummary(mergedTests);

    // Primary ID to represent this student record
    const primaryId = group[0].id;

    consolidatedList.push({
      id: primaryId,
      timestamp: latestRec.timestamp,
      student: {
        ...latestRec.student,
        name: bestName,
        attendanceNumber: bestAbsen,
        examinerName: combinedExaminers,
      },
      tests: mergedTests,
      totalScore: summary.totalScore,
      finalScore: summary.finalScore,
      predicate: summary.predicate,
      notes: notesList.join(' | '),
      completedTestsCount: summary.completedCount,
      examinersList,
      sourceRecordIds,
    });
  }

  // Sort by class then attendance number
  consolidatedList.sort((a, b) => {
    if (a.student.studentClass !== b.student.studentClass) {
      return a.student.studentClass.localeCompare(b.student.studentClass);
    }
    const numA = parseInt(a.student.attendanceNumber, 10) || 0;
    const numB = parseInt(b.student.attendanceNumber, 10) || 0;
    if (numA !== numB) return numA - numB;
    return a.student.name.localeCompare(b.student.name);
  });

  return consolidatedList;
}

/**
 * Merge an in-progress or newly saved assessment with existing records for this student.
 * Ensures that if other evaluators have already submitted other tests for this student,
 * those tests are NOT erased when saving.
 */
export function mergeWithExistingStudentAssessment(
  newRecord: AssessmentRecord,
  existingRecords: AssessmentRecord[]
): AssessmentRecord {
  // Find any existing record for this student
  const matching = existingRecords.find((r) => isSameStudent(r.student, newRecord.student));
  if (!matching) {
    // CRITICAL: Ensure newRecord does not accidentally reuse an ID belonging to a different student in existingRecords
    const idUsedByOtherStudent = existingRecords.some(
      (r) => r.id === newRecord.id && !isSameStudent(r.student, newRecord.student)
    );
    if (idUsedByOtherStudent) {
      return {
        ...newRecord,
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
    }
    return newRecord;
  }

  // Merge tests: keep existing completed tests, and apply new completed tests
  const mergedTests = { ...matching.tests };

  for (const testId of ALL_FITNESS_TEST_IDS) {
    const newTest = newRecord.tests?.[testId];
    if (isTestCompleted(newTest)) {
      mergedTests[testId] = { ...newTest };
    }
  }

  // Combine examiner names
  const examinersSet = new Set<string>();
  if (matching.student.examinerName) {
    matching.student.examinerName.split(',').forEach((s) => s.trim() && examinersSet.add(s.trim()));
  }
  if (newRecord.student.examinerName) {
    newRecord.student.examinerName.split(',').forEach((s) => s.trim() && examinersSet.add(s.trim()));
  }
  const examinersList = Array.from(examinersSet);

  // Combine notes
  const notesSet = new Set<string>();
  if (matching.notes?.trim()) notesSet.add(matching.notes.trim());
  if (newRecord.notes?.trim()) notesSet.add(newRecord.notes.trim());

  const summary = calculateSummary(mergedTests);

  return {
    ...matching,
    id: matching.id, // preserve existing document ID
    timestamp: newRecord.timestamp || new Date().toISOString(),
    student: {
      ...newRecord.student,
      name: newRecord.student.name.length >= matching.student.name.length ? newRecord.student.name : matching.student.name,
      examinerName: examinersList.join(', ') || newRecord.student.examinerName,
    },
    tests: mergedTests,
    totalScore: summary.totalScore,
    finalScore: summary.finalScore,
    predicate: summary.predicate,
    notes: Array.from(notesSet).join(' | '),
    completedTestsCount: summary.completedCount,
    examinersList,
    sourceRecordIds: [matching.id, newRecord.id].filter((v, i, a) => a.indexOf(v) === i),
  };
}
