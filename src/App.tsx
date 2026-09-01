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
  saveBenchmarks, getSavedTeacherName 
} from './utils/storage';
import { calculateSummary } from './utils/scoreCalculator';
import { exportSingleRecordToExcel, exportRecordsToExcel } from './utils/exportUtils';
import { sound } from './utils/soundEffects';

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
  RotateCcw, Award, ChevronRight, Activity, BookOpen, Layers
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

  // Student Identity Form State
  const [student, setStudent] = useState<StudentInfo>({
    name: '',
    studentClass: 'X.1',
    attendanceNumber: '',
    gender: 'L',
    examinerName: getSavedTeacherName(),
    testDate: new Date().toISOString().split('T')[0],
  });
  const [isStudentLocked, setIsStudentLocked] = useState(false);

  // 6 Test Results State for currently evaluated student
  const [tests, setTests] = useState<Record<FitnessTestType, SingleTestResult>>(INITIAL_TESTS_STATE);
  const [notes, setNotes] = useState<string>('');
  const [isSavedInRecap, setIsSavedInRecap] = useState<boolean>(false);

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

  // Load initial records on mount
  useEffect(() => {
    const saved = getSavedRecords();
    setRecords(saved);
    setBenchmarksConfig(getSavedBenchmarks());
  }, []);

  // Save tests result callback from Modal
  const handleSaveSingleTest = (result: SingleTestResult) => {
    setTests((prev) => ({
      ...prev,
      [result.testId]: result,
    }));
    setIsSavedInRecap(false);

    const testName = FITNESS_TESTS.find((t) => t.id === result.testId)?.shortTitle || 'Tes';
    showToast(
      `${testName} Selesai!`,
      `Jumlah: ${result.reps} • Waktu: ${result.timeFormatted} • Nilai: ${result.score} (${result.predicate})`,
      'success'
    );
  };

  // Check if student identity is sufficiently ready
  const isStudentReady = isStudentLocked || (student.name.trim().length > 0 && student.studentClass.length > 0);

  // Completed test counts
  const summary = calculateSummary(tests);

  // Save full Assessment Record to class database
  const handleSaveCurrentAssessment = () => {
    if (!student.name.trim()) {
      alert('Nama Siswa wajib diisi sebelum menyimpan hasil!');
      return;
    }

    const newRecordId = `rec-${Date.now()}`;
    const newRecord: AssessmentRecord = {
      id: newRecordId,
      timestamp: new Date().toISOString(),
      student: { ...student },
      tests: { ...tests },
      totalScore: summary.totalScore,
      finalScore: summary.finalScore,
      predicate: summary.predicate,
      notes: notes.trim(),
    };

    // Check if record with same name & class already exists, update or add
    const existingIndex = records.findIndex(
      (r) =>
        r.student.name.toLowerCase() === student.name.toLowerCase() &&
        r.student.studentClass === student.studentClass
    );

    let updatedRecords: AssessmentRecord[];
    if (existingIndex >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIndex] = { ...newRecord, id: records[existingIndex].id };
    } else {
      updatedRecords = [newRecord, ...records];
    }

    setRecords(updatedRecords);
    saveRecords(updatedRecords);
    setIsSavedInRecap(true);
    sound.playFinish();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(
      'Hasil Penilaian Tersimpan!',
      `Data nilai ${student.name} (Kelas ${student.studentClass}) berhasil dimasukkan ke Rekap Kelas.`,
      'success'
    );
  };

  // Reset to Next Student (PENILAIAN SISWA BERIKUTNYA)
  const handleNextStudent = () => {
    // If not saved and has progress, prompt confirmation
    if (summary.completedCount > 0 && !isSavedInRecap) {
      if (!confirm('Hasil siswa saat ini belum disimpan ke rekap. Lanjutkan ke siswa berikutnya?')) {
        return;
      }
    }

    setStudent({
      name: '',
      studentClass: student.studentClass, // Keep the same class for teacher's convenience during batch class testing
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
      'Form identitas telah direset. Silakan masukkan nama siswa berikutnya.',
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

  // Delete record from class recap
  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
    showToast('Data Dihapus', 'Data penilaian telah dihapus dari rekap.', 'warn');
  };

  // View existing record from recap into active assessment form
  const handleSelectRecordToView = (record: AssessmentRecord) => {
    setStudent(record.student);
    setIsStudentLocked(true);
    setTests(record.tests);
    setNotes(record.notes || '');
    setIsSavedInRecap(true);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce transition-all">
          <div className="bg-slate-900 border border-emerald-500/60 text-white px-4 py-3 rounded-xl shadow-2xl shadow-emerald-950/60 flex items-start gap-3 max-w-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-emerald-300">{toastMessage.title}</p>
              <p className="text-xs text-slate-300 mt-0.5">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header with App Title, School & Teacher Banner */}
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* VIEW 1: PENILAIAN / FORM TES */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            
            {/* Step 1: Student Identity Form */}
            <StudentIdentityForm
              student={student}
              setStudent={setStudent}
              isLocked={isStudentLocked}
              setIsLocked={setIsStudentLocked}
              onResetStudent={() => {
                if (confirm('Kosongkan formulir identitas siswa?')) {
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
                }
              }}
              completedTestsCount={summary.completedCount}
            />

            {/* Step 2: 6 Fitness Test Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    6 MENU TES KEBUGARAN JASMANI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Klik salah satu kartu tes untuk membuka stopwatch digital dan mencatat repetisi gerakan
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-slate-400">Progres:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {summary.completedCount} / 6 Tes
                  </span>
                </div>
              </div>

              {/* Grid of 6 Athletic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              isAlreadySaved={isSavedInRecap}
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
            onStartNewAssessment={() => {
              handleNextStudent();
              setActiveTab('assessment');
            }}
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
            saveBenchmarks(updated);
            showToast('Rentang Nilai Diperbarui', 'Standar konversi nilai telah berhasil disimpan.', 'success');
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* App Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <strong>{DEFAULT_SCHOOL_NAME}</strong> • Aplikasi Penilaian PJOK Kelas X
          </p>
          <p className="text-[11px] text-slate-400">
            Guru Pengampu: <strong className="text-emerald-400">{DEFAULT_TEACHER_NAME}</strong>
          </p>
        </div>
      </footer>

    </div>
  );
}
