import React, { useState, useEffect } from 'react';
import { 
  StudentInfo, FitnessTestType, SingleTestResult, 
  AssessmentRecord, ScoreBenchmarksConfig 
} from './types';
import { 
  FITNESS_TESTS, DEFAULT_TEACHER_NAME, DEFAULT_SCHOOL_NAME 
} from './constants/fitnessTests';
import { 
  getSavedRecords, saveRecords, getSavedBenchmarks, 
  saveBenchmarks, getSavedTeacherName, getActiveDraft,
  saveActiveDraft, clearActiveDraft 
} from './utils/storage';
import { calculateSummary } from './utils/scoreCalculator';
import { exportSingleRecordToExcel, exportRecordsToExcel } from './utils/exportUtils';
import { sound } from './utils/soundEffects';
import { 
  subscribeToRecords, saveRecordToFirestore, 
  deleteRecordFromFirestore, deleteMultipleRecordsFromFirestore,
  deleteAllRecordsFromFirestore, deleteRecordsByClassFromFirestore,
  subscribeToBenchmarks, saveBenchmarksToFirestore 
} from './utils/firebaseService';
import { mergeWithExistingStudentAssessment, consolidateAssessmentRecords } from './utils/consolidationUtils';

import { Header } from './components/Header';
import { StudentIdentityForm } from './components/StudentIdentityForm';
import { TestCard } from './components/TestCard';
import { ActiveTestModal } from './components/ActiveTestModal';
import { StudentSummaryDashboard } from './components/StudentSummaryDashboard';
import { ClassRecapTable } from './components/ClassRecapTable';
import { ScoreSettingsModal } from './components/ScoreSettingsModal';
import { PrintOfficialSheet } from './components/PrintOfficialSheet';
import { TeacherGuide } from './components/TeacherGuide';

import { 
  Sparkles, CheckCircle2, AlertTriangle, Users, 
  RotateCcw, Award, ChevronRight, Activity, BookOpen, Layers,
  Settings, Wifi, WifiOff, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

const INITIAL_TESTS_STATE: Record<FitnessTestType, SingleTestResult> = {
  push_up: { testId: 'push_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
  sit_up: { testId: 'sit_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
  back_up: { testId: 'back_up', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
  jongkok_bangun: { testId: 'jongkok_bangun', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
  lari_bolak_balik: { testId: 'lari_bolak_balik', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
  naik_turun_tangga: { testId: 'naik_turun_tangga', reps: null, timeSeconds: 0, timeFormatted: '00:00', score: null, predicate: null, status: 'belum' },
};

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'assessment' | 'recap' | 'settings' | 'guide'>('assessment');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userRole, setUserRole] = useState<'guru' | 'murid'>('guru');

  // Real-time Firestore connection status
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check for existing active draft to restore if student or teacher exited earlier
  const initialDraft = getActiveDraft();
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(() => {
    return !!(
      initialDraft &&
      (initialDraft.student?.name?.trim() ||
        (Object.values(initialDraft.tests || {}) as SingleTestResult[]).some((t) => t.status === 'selesai'))
    );
  });

  const [currentRecordId, setCurrentRecordId] = useState<string>(() => {
    return initialDraft?.recordId || `rec-${Date.now()}`;
  });

  // Student Identity Form State (restored from draft if available)
  const [student, setStudent] = useState<StudentInfo>(() => {
    if (initialDraft && initialDraft.student && initialDraft.student.name) {
      return initialDraft.student;
    }
    return {
      name: '',
      studentClass: 'X.1',
      attendanceNumber: '',
      gender: 'L',
      examinerName: getSavedTeacherName(),
      testDate: new Date().toISOString().split('T')[0],
    };
  });
  const [isStudentLocked, setIsStudentLocked] = useState<boolean>(() => {
    return initialDraft ? initialDraft.isLocked : false;
  });

  // 6 Test Results State for currently evaluated student
  const [tests, setTests] = useState<Record<FitnessTestType, SingleTestResult>>(() => {
    return initialDraft?.tests || INITIAL_TESTS_STATE;
  });
  const [notes, setNotes] = useState<string>(() => {
    return initialDraft?.notes || '';
  });
  const [isSavedInRecap, setIsSavedInRecap] = useState<boolean>(false);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  // Modal active test execution
  const [activeTestId, setActiveTestId] = useState<FitnessTestType | null>(null);

  // Persistent database records and benchmarks
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [benchmarksConfig, setBenchmarksConfig] = useState<ScoreBenchmarksConfig>(getSavedBenchmarks());

  // Print Mode State
  const [recordForPrint, setRecordForPrint] = useState<AssessmentRecord | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-save draft to local storage whenever student, test progress, or notes change
  useEffect(() => {
    const hasAnyData = student.name.trim().length > 0 || (Object.values(tests) as SingleTestResult[]).some((t) => t.status === 'selesai');
    if (hasAnyData) {
      saveActiveDraft({
        recordId: currentRecordId,
        student,
        tests,
        notes,
        isLocked: isStudentLocked,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [student, tests, notes, isStudentLocked, currentRecordId]);

  // Event listeners for page hide / tab close / sleep to ensure complete persistence
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedProgress = student.name.trim().length > 0 && (Object.values(tests) as SingleTestResult[]).some((t) => t.status === 'selesai') && !isSavedInRecap;
      if (hasUnsavedProgress) {
        saveActiveDraft({
          recordId: currentRecordId,
          student,
          tests,
          notes,
          isLocked: isStudentLocked,
          lastUpdated: new Date().toISOString(),
        });
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && student.name.trim().length > 0) {
        saveActiveDraft({
          recordId: currentRecordId,
          student,
          tests,
          notes,
          isLocked: isStudentLocked,
          lastUpdated: new Date().toISOString(),
        });

        // Also auto-sync to Firestore if at least 1 test is completed
        const currentSummary = calculateSummary(tests);
        if (currentSummary.completedCount > 0) {
          const autoRecord: AssessmentRecord = {
            id: currentRecordId,
            timestamp: new Date().toISOString(),
            student: { ...student },
            tests: { ...tests },
            totalScore: currentSummary.totalScore,
            finalScore: currentSummary.finalScore,
            predicate: currentSummary.predicate,
            notes: notes.trim(),
          };
          saveRecordToFirestore(autoRecord).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [student, tests, notes, isStudentLocked, currentRecordId, isSavedInRecap]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    // Online/offline window listeners
    const handleOnline = () => setIsRealtimeConnected(true);
    const handleOffline = () => setIsRealtimeConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to assessment records in Firestore
    setIsSyncing(true);
    const unsubRecords = subscribeToRecords(
      (updatedRecords) => {
        setRecords(updatedRecords);
        setIsSyncing(false);
        setIsRealtimeConnected(true);
      },
      () => {
        setIsSyncing(false);
        setIsRealtimeConnected(false);
      }
    );

    // Subscribe to benchmarks in Firestore
    const unsubBenchmarks = subscribeToBenchmarks((updatedBenchmarks) => {
      setBenchmarksConfig(updatedBenchmarks);
    });

    return () => {
      unsubRecords();
      unsubBenchmarks();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save single test result from Modal with immediate Real-Time Auto-Save
  const handleSaveSingleTest = (result: SingleTestResult) => {
    const updatedTests = {
      ...tests,
      [result.testId]: result,
    };
    setTests(updatedTests);

    // 1. Immediately persist active draft to local storage
    saveActiveDraft({
      recordId: currentRecordId,
      student,
      tests: updatedTests,
      notes,
      isLocked: isStudentLocked,
      lastUpdated: new Date().toISOString(),
    });

    const currentSummary = calculateSummary(updatedTests);

    // 2. AUTO-SAVE TO CLOUD FIRESTORE IN REAL-TIME:
    // When student has entered their name, immediately sync to Cloud so data is NEVER lost even if tab is closed
    if (student.name.trim()) {
      const autoRecord: AssessmentRecord = {
        id: currentRecordId,
        timestamp: new Date().toISOString(),
        student: { ...student },
        tests: updatedTests,
        totalScore: currentSummary.totalScore,
        finalScore: currentSummary.finalScore,
        predicate: currentSummary.predicate,
        notes: notes.trim(),
      };
      saveRecordToFirestore(autoRecord).catch((err) => {
        console.warn('Auto-save sync queued offline:', err);
      });
    }

    const testName = FITNESS_TESTS.find((t) => t.id === result.testId)?.shortTitle || 'Tes';

    if (currentSummary.isAllCompleted) {
      setIsSavedInRecap(true);
      sound.playFinish();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast(
        '🏆 Semua 6 Tes Selesai & Otomatis Tersimpan!',
        `Nilai Akhir ${student.name}: ${currentSummary.finalScore.toFixed(2)} (${currentSummary.predicate}). Data aman di Cloud Firestore.`,
        'success'
      );
    } else {
      setIsSavedInRecap(false);
      showToast(
        `${testName} Selesai & Tersimpan!`,
        `Jumlah: ${result.reps} • Waktu: ${result.timeFormatted} • Nilai: ${result.score} (${result.predicate}) • Tersimpan otomatis`,
        'success'
      );
    }
  };

  // Check if student identity is sufficiently ready
  const isStudentReady = isStudentLocked || (student.name.trim().length > 0 && student.studentClass.length > 0);

  // Completed test counts
  const summary = calculateSummary(tests);

  // Save full Assessment Record to real-time Cloud Firestore database
  const handleSaveCurrentAssessment = async () => {
    if (!student.name.trim()) {
      alert('Nama Siswa wajib diisi sebelum menyimpan hasil!');
      return;
    }

    setIsSavingRecord(true);
    const initialRecordToSave: AssessmentRecord = {
      id: currentRecordId,
      timestamp: new Date().toISOString(),
      student: { ...student },
      tests: { ...tests },
      totalScore: summary.totalScore,
      finalScore: summary.finalScore,
      predicate: summary.predicate,
      notes: notes.trim(),
    };

    // Intelligently merge with any existing assessment for this student from other assessors
    const recordToSave = mergeWithExistingStudentAssessment(initialRecordToSave, records);

    // Update local state if merged with other tests
    if (recordToSave.id !== currentRecordId) {
      setCurrentRecordId(recordToSave.id);
    }
    setTests(recordToSave.tests);
    setStudent(recordToSave.student);

    try {
      await saveRecordToFirestore(recordToSave);
      setIsSavedInRecap(true);
      sound.playFinish();

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      const completedCount = recordToSave.completedTestsCount ?? 1;
      const statusNote = completedCount === 6 
        ? 'Lengkap (6/6 Tes dari 6 Pos Selesai)' 
        : `${completedCount}/6 Tes Pos Dinilai`;

      showToast(
        'Tersimpan Real-time!',
        `Data nilai ${student.name} (${statusNote}) berhasil disinkronkan ke Database Cloud.`,
        'success'
      );
    } catch (err) {
      console.error('Save error:', err);
      showToast(
        'Tersimpan di Penyimpanan Lokal',
        'Data tersimpan di cache dan akan disinkronkan saat koneksi online aktif kembali.',
        'info'
      );
      setIsSavedInRecap(true);
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Reset to Next Student (PENILAIAN SISWA BERIKUTNYA)
  const handleNextStudent = () => {
    clearActiveDraft();
    const newId = `rec-${Date.now()}`;
    setCurrentRecordId(newId);
    setHasRestoredDraft(false);

    setStudent({
      name: '',
      studentClass: student.studentClass, // Keep the same class for teacher's convenience
      attendanceNumber: student.attendanceNumber ? String(parseInt(student.attendanceNumber, 10) + 1 || '') : '',
      gender: 'L',
      examinerName: student.examinerName,
      testDate: student.testDate,
    });
    setIsStudentLocked(false);
    setTests(INITIAL_TESTS_STATE);
    setNotes('');
    setIsSavedInRecap(false);
    setActiveTestId(null);
    sound.playStart();

    showToast(
      'Sesi Siswa Baru Siap!',
      'Formulir telah direset. Silakan masukkan data siswa berikutnya.',
      'info'
    );
  };

  // Print current student result
  const handlePrintCurrentStudent = () => {
    const currentRecord: AssessmentRecord = {
      id: 'current-temp',
      timestamp: new Date().toISOString(),
      student: { ...student },
      tests: { ...tests },
      totalScore: summary.totalScore,
      finalScore: summary.finalScore,
      predicate: summary.predicate,
      notes: notes,
    };
    setRecordForPrint(currentRecord);
  };

  // Download Excel for current student
  const handleDownloadExcelCurrent = () => {
    if (!student.name.trim()) {
      alert('Nama siswa belum diisi!');
      return;
    }
    const currentRecord: AssessmentRecord = {
      id: 'current-temp',
      timestamp: new Date().toISOString(),
      student: { ...student },
      tests: { ...tests },
      totalScore: summary.totalScore,
      finalScore: summary.finalScore,
      predicate: summary.predicate,
      notes: notes,
    };
    exportSingleRecordToExcel(currentRecord);
  };

  // Delete record from Firestore database (supports consolidated sourceRecordIds)
  // Delete record from Firestore database (supports consolidated sourceRecordIds) with INSTANT OPTIMISTIC RESPONSE
  const handleDeleteRecord = async (id: string, sourceIds?: string[]) => {
    // 1. INSTANT OPTIMISTIC UI UPDATE (0ms)
    const targetIds = sourceIds && sourceIds.length > 0 ? sourceIds : [id];
    const targetSet = new Set([...targetIds, id]);

    setRecords((prev) =>
      prev.filter(
        (r) => !targetSet.has(r.id) && !(r.sourceRecordIds && r.sourceRecordIds.some((sid) => targetSet.has(sid)))
      )
    );
    showToast('Data Dihapus', 'Data penilaian telah dihapus.', 'warn');

    // 2. Asynchronous Firestore deletion in background
    try {
      if (sourceIds && sourceIds.length > 0) {
        await deleteMultipleRecordsFromFirestore(sourceIds);
      } else {
        await deleteRecordFromFirestore(id);
      }
    } catch (err) {
      console.error('Failed to delete record from Firestore:', err);
      showToast('Kendala Jaringan Cloud', 'Data dihapus secara lokal, sinkronisasi cloud tertunda.', 'warn');
    }
  };

  // Delete multiple records (bulk delete from checkbox selection) with INSTANT OPTIMISTIC RESPONSE
  const handleDeleteMultipleRecords = async (ids: string[], allSourceIds?: string[]) => {
    const targetIds = allSourceIds && allSourceIds.length > 0 ? allSourceIds : ids;
    const targetSet = new Set([...ids, ...targetIds]);

    // 1. INSTANT OPTIMISTIC UI UPDATE (0ms)
    setRecords((prev) =>
      prev.filter(
        (r) => !targetSet.has(r.id) && !(r.sourceRecordIds && r.sourceRecordIds.some((sid) => targetSet.has(sid)))
      )
    );
    showToast(
      'Data Terpilih Dihapus',
      `Sebanyak ${ids.length} data rekapan siswa berhasil dihapus.`,
      'warn'
    );

    // 2. Asynchronous Firestore batch deletion in background
    try {
      await deleteMultipleRecordsFromFirestore(targetIds);
    } catch (err) {
      console.error('Failed to delete multiple records from Firestore:', err);
      showToast('Kendala Jaringan Cloud', 'Data dihapus secara lokal, sinkronisasi cloud tertunda.', 'warn');
    }
  };

  // Delete current active student assessment from database
  const handleDeleteCurrentStudent = async () => {
    try {
      const existing = records.find(
        (r) =>
          r.id === currentRecordId ||
          (r.student.name.trim().toLowerCase() === student.name.trim().toLowerCase() &&
            r.student.studentClass === student.studentClass)
      );

      clearActiveDraft();
      handleNextStudent();

      if (existing) {
        await handleDeleteRecord(existing.id, existing.sourceRecordIds);
      } else if (currentRecordId) {
        await handleDeleteRecord(currentRecordId);
      }
    } catch (err) {
      console.error('Failed to delete current student:', err);
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus rekapan siswa.', 'warn');
    }
  };

  // Delete all records or filtered class records from Firestore database with INSTANT OPTIMISTIC RESPONSE
  const handleDeleteAllRecords = async (classFilter?: string) => {
    try {
      if (classFilter && classFilter !== 'ALL') {
        // 1. INSTANT OPTIMISTIC UI UPDATE (0ms)
        setRecords((prev) => prev.filter((r) => r.student.studentClass !== classFilter));
        showToast(
          'Riwayat Kelas Dihapus',
          `Data penilaian Kelas ${classFilter} berhasil dibersihkan.`,
          'info'
        );
        // 2. Asynchronous Firestore deletion
        await deleteRecordsByClassFromFirestore(classFilter);
      } else {
        // 1. INSTANT OPTIMISTIC UI UPDATE (0ms)
        setRecords([]);
        clearActiveDraft();
        showToast(
          'Semua Riwayat Dihapus',
          'Seluruh data penilaian telah dibersihkan.',
          'info'
        );
        // 2. Asynchronous Firestore deletion
        await deleteAllRecordsFromFirestore();
      }
    } catch (err) {
      console.error('Failed to delete all records from Firestore:', err);
      showToast('Kendala Jaringan Cloud', 'Terjadi kendala saat menghapus data di cloud.', 'warn');
    }
  };

  // View existing record from recap into active assessment form
  const handleSelectRecordToView = (record: AssessmentRecord) => {
    setCurrentRecordId(record.id);
    setStudent(record.student);
    setIsStudentLocked(true);
    setTests(record.tests);
    setNotes(record.notes || '');
    setIsSavedInRecap(true);
    setHasRestoredDraft(false);
    setActiveTab('assessment');
    showToast('Data Dimuat', `Menampilkan data penilaian ${record.student.name}`, 'info');
  };

  // Active test modal navigation helpers
  const currentTestIndex = activeTestId ? FITNESS_TESTS.findIndex((t) => t.id === activeTestId) : -1;
  const hasNextTest = currentTestIndex >= 0 && currentTestIndex < FITNESS_TESTS.length - 1;
  const hasPrevTest = currentTestIndex > 0;

  const handleNavigateNextTest = () => {
    if (hasNextTest) {
      setActiveTestId(FITNESS_TESTS[currentTestIndex + 1].id);
    }
  };

  const handleNavigatePrevTest = () => {
    if (hasPrevTest) {
      setActiveTestId(FITNESS_TESTS[currentTestIndex - 1].id);
    }
  };

  // If in Print Mode, render official printable A4 document
  if (recordForPrint) {
    return (
      <PrintOfficialSheet
        record={recordForPrint}
        onBack={() => setRecordForPrint(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 pb-20 md:pb-6">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-bounce transition-all">
          <div className="bg-slate-900 border border-emerald-500/60 text-white px-4 py-3 rounded-xl shadow-2xl shadow-emerald-950/60 flex items-start gap-3 max-w-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-300">{toastMessage.title}</p>
              <p className="text-xs text-slate-300 mt-0.5">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header with Realtime Indicator & School Banner */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setShowSettingsModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        savedRecordsCount={records.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isRealtimeConnected={isRealtimeConnected}
        isSyncing={isSyncing}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* VIEW 1: PENILAIAN / FORM TES */}
        {activeTab === 'assessment' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Sesi Pemulihan Draft Otomatis jika siswa keluar browser sebelumnya */}
            {hasRestoredDraft && student.name && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3 text-emerald-200">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                      <span>Sesi Penilaian Aktif Dipulihkan!</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                        Anti Hilang
                      </span>
                    </p>
                    <p className="text-[11px] text-emerald-300/90 mt-0.5">
                      Melanjutkan data <strong className="text-white">{student.name}</strong> (Kelas {student.studentClass}, Absen {student.attendanceNumber || '-'}) • <strong className="text-emerald-400">{summary.completedCount} dari 6 tes tersimpan</strong>. Nilai aman di browser dan database.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setHasRestoredDraft(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-md shadow-emerald-950/50"
                  >
                    Lanjutkan Penilaian
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Mulai sesi siswa baru dan hapus sesi yang sedang aktif ini?')) {
                        handleNextStudent();
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                  >
                    Siswa Baru
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Student Identity Form */}
            <StudentIdentityForm
              student={student}
              setStudent={setStudent}
              isLocked={isStudentLocked}
              setIsLocked={setIsStudentLocked}
              userRole={userRole}
              existingRecords={records}
              onLoadExistingRecord={handleSelectRecordToView}
              hasRestoredDraft={hasRestoredDraft}
              onResetStudent={() => {
                if (confirm('Kosongkan formulir identitas dan tes saat ini?')) {
                  clearActiveDraft();
                  setCurrentRecordId(`rec-${Date.now()}`);
                  setHasRestoredDraft(false);
                  setStudent({
                    name: '',
                    studentClass: 'X.1',
                    attendanceNumber: '',
                    gender: 'L',
                    examinerName: DEFAULT_TEACHER_NAME,
                    testDate: new Date().toISOString().split('T')[0],
                  });
                  setIsStudentLocked(false);
                  setTests(INITIAL_TESTS_STATE);
                  setNotes('');
                  setIsSavedInRecap(false);
                }
              }}
              completedTestsCount={summary.completedCount}
            />

            {/* Step 2: 6 Fitness Test Cards */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    <span>6 MENU TES KEBUGARAN JASMANI</span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Klik kartu tes untuk membuka stopwatch digital dan input repetisi gerakan
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-slate-400">Progres:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {summary.completedCount} / 6 Selesai
                  </span>
                </div>
              </div>

              {/* Grid of 6 Athletic Cards (1 col mobile, 2 cols tablet, 3 cols desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {FITNESS_TESTS.map((config) => (
                  <TestCard
                    key={config.id}
                    config={config}
                    result={tests[config.id]}
                    onOpenTest={(id) => {
                      if (!student.name.trim()) {
                        alert('Silakan isi Nama Siswa pada formulir di atas sebelum melakukan tes!');
                        return;
                      }
                      setIsStudentLocked(true);
                      setActiveTestId(id);
                    }}
                    isStudentReady={isStudentReady}
                  />
                ))}
              </div>
            </div>

            {/* Step 3: Rekap Nilai Siswa & Visual Dashboard Card */}
            <StudentSummaryDashboard
              student={student}
              tests={tests}
              notes={notes}
              setNotes={setNotes}
              onSaveRecord={handleSaveCurrentAssessment}
              onNextStudent={handleNextStudent}
              onPrintSheet={handlePrintCurrentStudent}
              onDownloadExcel={handleDownloadExcelCurrent}
              onViewClassRecap={() => setActiveTab('recap')}
              onOpenTest={(id) => {
                setIsStudentLocked(true);
                setActiveTestId(id);
              }}
              onDeleteCurrentStudent={handleDeleteCurrentStudent}
              isAlreadySaved={isSavedInRecap}
              isSaving={isSavingRecord}
            />

          </div>
        )}

        {/* VIEW 2: REKAP PENILAIAN KELAS */}
        {activeTab === 'recap' && (
          <ClassRecapTable
            records={records}
            onSelectRecordToView={handleSelectRecordToView}
            onSelectRecordToPrint={(rec) => setRecordForPrint(rec)}
            onDeleteRecord={handleDeleteRecord}
            onDeleteMultipleRecords={handleDeleteMultipleRecords}
            onDeleteAllRecords={handleDeleteAllRecords}
            onStartNewAssessment={() => {
              handleNextStudent();
              setActiveTab('assessment');
            }}
            isRealtimeConnected={isRealtimeConnected}
          />
        )}

        {/* VIEW 3: PANDUAN GURU */}
        {activeTab === 'guide' && (
          <TeacherGuide />
        )}

      </main>

      {/* Active Single Test Execution Modal with Giant Stopwatch */}
      {activeTestId && (
        <ActiveTestModal
          config={FITNESS_TESTS.find((t) => t.id === activeTestId)!}
          currentResult={tests[activeTestId]}
          student={student}
          benchmarksConfig={benchmarksConfig}
          onSaveResult={handleSaveSingleTest}
          onClose={() => setActiveTestId(null)}
          onNavigateNextTest={handleNavigateNextTest}
          onNavigatePrevTest={handleNavigatePrevTest}
          hasNextTest={hasNextTest}
          hasPrevTest={hasPrevTest}
          totalCompletedCount={summary.completedCount}
        />
      )}

      {/* Score Settings Benchmarks Modal */}
      {showSettingsModal && (
        <ScoreSettingsModal
          benchmarksConfig={benchmarksConfig}
          onSaveBenchmarks={(updated) => {
            setBenchmarksConfig(updated);
            saveBenchmarksToFirestore(updated).catch(() => {});
            showToast('Rentang Nilai Disimpan Real-time', 'Standar konversi nilai telah disinkronkan ke cloud.', 'success');
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Ultra convenient on smartphones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'assessment'
                ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Form Nilai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recap')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-h-[48px] relative ${
              activeTab === 'recap'
                ? 'text-cyan-400 bg-cyan-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Rekap</span>
            {records.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-cyan-500 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                {records.length > 99 ? '99+' : records.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition min-h-[48px] ${
              activeTab === 'guide'
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Panduan</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition min-h-[48px]"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Rentang</span>
          </button>
        </div>
      </nav>

      {/* App Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <strong>{DEFAULT_SCHOOL_NAME}</strong> • Penilaian PJOK Kebugaran Jasmani
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Guru: <strong className="text-emerald-400">{DEFAULT_TEACHER_NAME}</strong></span>
            <span>•</span>
            <span className="text-cyan-300">Firebase Firestore Real-time</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
