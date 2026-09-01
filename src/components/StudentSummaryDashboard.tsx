import React, { useEffect } from 'react';
import { StudentInfo, SingleTestResult, FitnessTestType } from '../types';
import { FITNESS_TESTS } from '../constants/fitnessTests';
import { calculateSummary, getPredicate } from '../utils/scoreCalculator';
import { 
  Trophy, Award, Clock, User, School, Hash, Download, Printer, 
  RotateCcw, Save, Users, CheckCircle2, ChevronRight, BarChart3, 
  FileSpreadsheet, MessageSquare, Sparkles, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/soundEffects';

interface StudentSummaryDashboardProps {
  student: StudentInfo;
  tests: Record<FitnessTestType, SingleTestResult>;
  notes: string;
  setNotes: (notes: string) => void;
  onSaveRecord: () => void;
  onNextStudent: () => void;
  onPrintSheet: () => void;
  onDownloadExcel: () => void;
  onViewClassRecap: () => void;
  onOpenTest: (testId: FitnessTestType) => void;
  isAlreadySaved: boolean;
}

export const StudentSummaryDashboard: React.FC<StudentSummaryDashboardProps> = ({
  student,
  tests,
  notes,
  setNotes,
  onSaveRecord,
  onNextStudent,
  onPrintSheet,
  onDownloadExcel,
  onViewClassRecap,
  onOpenTest,
  isAlreadySaved,
}) => {
  const summary = calculateSummary(tests);
  const predicateInfo = getPredicate(summary.finalScore);

  useEffect(() => {
    if (summary.isAllCompleted) {
      sound.playFinish();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  }, [summary.isAllCompleted]);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
      {/* Background athletic glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Completion Banner */}
      {summary.isAllCompleted ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-6 text-slate-950 shadow-xl shadow-emerald-950/40">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-slate-950/20 backdrop-blur-md flex items-center justify-center text-slate-950 border border-slate-950/20">
                <Trophy className="w-8 h-8 fill-amber-300 text-slate-950" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-950/20 uppercase tracking-wider mb-1">
                  🏆 HASIL TES SELESAI!
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Outfit']">
                  {student.name} – {student.studentClass}
                </h3>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  6 Rangkaian Tes Kebugaran Jasmani telah lengkap dinilai.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/30 px-5 py-3 rounded-xl border border-white/20 backdrop-blur-sm">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-100 block">NILAI AKHIR</span>
                <span className="text-3xl font-black text-white font-['JetBrains_Mono']">
                  {summary.finalScore.toFixed(2)}
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-emerald-100 block">PREDIKAT</span>
                <span className="text-sm font-black text-amber-200">
                  {summary.predicate}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>
              Progres Penilaian: <strong className="text-white">{summary.completedCount} dari 6 Tes</strong> telah selesai.
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Lengkapi sisa tes untuk menghitung Nilai Akhir resmi secara presisi.
          </span>
        </div>
      )}

      {/* Visual Identity Dashboard Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-cyan-400" /> Nama Siswa
          </span>
          <p className="text-sm font-black text-white mt-1 truncate" title={student.name}>
            {student.name || '-'}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <School className="w-3 h-3 text-emerald-400" /> Kelas
          </span>
          <p className="text-sm font-black text-cyan-300 mt-1">
            {student.studentClass || '-'}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3 h-3 text-amber-400" /> No. Absen
          </span>
          <p className="text-sm font-black text-white mt-1">
            {student.attendanceNumber || '-'}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> Total Waktu
          </span>
          <p className="text-sm font-black text-purple-300 font-mono mt-1">
            {summary.totalTimeFormatted}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" /> Nilai Akhir
          </span>
          <p className="text-lg font-black text-emerald-400 font-['JetBrains_Mono'] mt-0.5">
            {summary.finalScore.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" /> Predikat
          </span>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-black border text-center mt-1 ${predicateInfo.badgeBg}`}>
            {summary.predicate}
          </span>
        </div>
      </div>

      {/* Main Table: REKAP HASIL PENILAIAN KEBUGARAN JASMANI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            REKAP HASIL PENILAIAN KEBUGARAN JASMANI
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Rumus: Nilai Akhir = Total Nilai ÷ 6
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/90 text-slate-300 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-4">Jenis Tes</th>
                <th className="py-3 px-4 text-center">Jumlah Gerakan</th>
                <th className="py-3 px-4 text-center">Waktu</th>
                <th className="py-3 px-4 text-center">Nilai</th>
                <th className="py-3 px-4 text-center">Predikat</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {FITNESS_TESTS.map((test, index) => {
                const res = tests[test.id];
                const isDone = res && typeof res.score === 'number';
                const testPred = isDone ? getPredicate(res.score!) : null;

                return (
                  <tr key={test.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{test.shortTitle}</span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">({test.targetMuscles.split('&')[0]})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isDone ? (
                        <span className="font-bold text-white">
                          {res.reps} <span className="text-xs text-slate-400 font-normal">{test.unit}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Belum diisi</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {isDone ? res.timeFormatted : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-black font-['JetBrains_Mono'] text-base">
                      {isDone ? (
                        <span className="text-emerald-400">{res.score}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {testPred ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${testPred.badgeBg}`}>
                          {testPred.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-500 border border-slate-800">
                          BELUM DINILAI
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenTest(test.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition"
                      >
                        {isDone ? 'Ubah' : 'Nilai'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Total & Nilai Akhir */}
            <tfoot className="bg-slate-900/95 font-bold border-t-2 border-slate-800 text-xs sm:text-sm">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-slate-300">
                  TOTAL NILAI (6 TES):
                </td>
                <td className="py-3 px-4 text-center text-lg font-black font-['JetBrains_Mono'] text-white">
                  {summary.totalScore}
                </td>
                <td colSpan={2} className="py-3 px-4 text-slate-400 text-xs">
                  {summary.completedCount}/6 Tes Terisi
                </td>
              </tr>
              <tr className="bg-slate-950">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-emerald-400 font-extrabold">
                  NILAI AKHIR (TOTAL ÷ 6):
                </td>
                <td className="py-3.5 px-4 text-center text-xl font-black font-['JetBrains_Mono'] text-emerald-400">
                  {summary.finalScore.toFixed(2)}
                </td>
                <td colSpan={2} className="py-3.5 px-4">
                  <span className={`inline-block px-3 py-1 rounded-md text-xs font-black border ${predicateInfo.badgeBg}`}>
                    PREDIKAT: {summary.predicate}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Visual Bar Chart: 6 Test Scores */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          GRAFIK PERFORMA NILAI 6 TES KEBUGARAN JASMANI
        </h4>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 pt-4 pb-2 px-2 border-b border-slate-800">
          {FITNESS_TESTS.map((test) => {
            const res = tests[test.id];
            const scoreVal = res?.score ?? 0;
            const heightPercent = Math.max(8, (scoreVal / 100) * 100);

            return (
              <div key={test.id} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-black font-mono text-emerald-400 mb-1 group-hover:scale-110 transition">
                  {scoreVal > 0 ? scoreVal : '0'}
                </span>
                <div className="w-full max-w-[36px] bg-slate-900 rounded-t-lg overflow-hidden flex items-end h-28 border border-slate-800">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 transition-all duration-500 rounded-t-md group-hover:from-emerald-500 group-hover:to-cyan-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-full text-center" title={test.shortTitle}>
                  {test.shortTitle.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teacher Notes Field */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          Catatan Evaluasi Guru Penilai (Akan masuk ke Lembar Cetak A4)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan kebugaran jasmani siswa, misal: 'Daya tahan otot sangat baik, perlu peningkatan kelincahan shuttle run'..."
          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* ACTION BUTTONS TOOLBAR (All required buttons) */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* SIMPAN HASIL */}
          <button
            id="btn-save-summary-record"
            type="button"
            onClick={onSaveRecord}
            className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-lg ${
              isAlreadySaved
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/40 cursor-pointer'
            }`}
          >
            <Save className="w-4 h-4" />
            {isAlreadySaved ? '✓ Tersimpan di Rekap' : '💾 SIMPAN HASIL'}
          </button>

          {/* PENILAIAN SISWA BERIKUTNYA */}
          <button
            id="btn-next-student"
            type="button"
            onClick={onNextStudent}
            className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/30 flex items-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            🔄 PENILAIAN SISWA BERIKUTNYA
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CETAK HASIL (Lembar Resmi A4) */}
          <button
            id="btn-print-student-sheet"
            type="button"
            onClick={onPrintSheet}
            className="px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            🖨 CETAK HASIL (A4)
          </button>

          {/* DOWNLOAD EXCEL */}
          <button
            id="btn-download-excel-student"
            type="button"
            onClick={onDownloadExcel}
            className="px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            ⬇ DOWNLOAD EXCEL
          </button>

          {/* LIHAT REKAP KELAS */}
          <button
            id="btn-view-recap-table"
            type="button"
            onClick={onViewClassRecap}
            className="px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-400" />
            📊 LIHAT REKAP
          </button>
        </div>
      </div>

    </div>
  );
};
