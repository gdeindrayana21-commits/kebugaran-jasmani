import React from 'react';
import { FITNESS_TESTS, PREDICATES, DEFAULT_TEACHER_NAME, DEFAULT_SCHOOL_NAME } from '../constants/fitnessTests';
import { AthleticIllustration } from './AthleticIllustrations';
import { BookOpen, CheckCircle, Clock, Award, ShieldCheck, Sparkles, Smartphone } from 'lucide-react';

export const TeacherGuide: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Guide Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-['Outfit']">
              PANDUAN PRAKTIK GURU PJOK DI LAPANGAN
            </h2>
            <p className="text-xs text-slate-400">
              Standar Operasional Penilaian Tes Kebugaran Jasmani Kelas X • {DEFAULT_SCHOOL_NAME}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <Smartphone className="w-4 h-4" /> 1. Penggunaan di HP / Tablet
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Aplikasi telah dirancang mobile-friendly. Guru dapat memegang HP di tepi lapangan, menekan tombol stopwatch besar, dan mencatat repetisi siswa dengan tombol sentuh cepat (+1, +5, +10).
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <Clock className="w-4 h-4" /> 2. Stopwatch Otomatis
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Setiap tes memiliki stopwatch digital independen. Tekan <strong>MULAI</strong> untuk meniup peluit dan memulai waktu, lalu tekan <strong>SELESAI</strong> saat durasi berakhir.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Award className="w-4 h-4" /> 3. Konversi Skor Presisi
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Nilai per tes dan Nilai Akhir (Rata-rata 6 tes) dihitung secara instan bersama predikat: SANGAT BAIK (90-100), BAIK (80-89), CUKUP (70-79), KURANG (60-69), SANGAT KURANG (&lt;60).
            </p>
          </div>
        </div>
      </div>

      {/* Detail 6 Tes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Rincian 6 Rangkaian Tes Kebugaran Jasmani
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FITNESS_TESTS.map((test) => (
            <div key={test.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-slate-950 rounded-xl p-2 flex items-center justify-center border border-slate-800 flex-shrink-0">
                  <AthleticIllustration type={test.id} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">
                      {test.number}
                    </span>
                    <h4 className="text-sm font-black text-white">{test.title}</h4>
                  </div>
                  <p className="text-[11px] text-cyan-300 font-semibold">{test.targetMuscles}</p>
                  <p className="text-xs text-slate-400">{test.description}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300">
                <p className="font-bold text-slate-200 mb-1">Panduan Teknik yang Dihitung Benar:</p>
                <ul className="space-y-0.5 list-disc list-inside text-slate-400">
                  {test.techniqueTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
