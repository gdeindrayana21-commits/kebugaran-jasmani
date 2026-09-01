import React, { useState, useEffect, useRef } from 'react';
import { TestConfig, SingleTestResult, ScoreBenchmarksConfig, StudentInfo } from '../types';
import { AthleticIllustration } from './AthleticIllustrations';
import { calculateTestScore, getPredicate, formatTimeMMSS } from '../utils/scoreCalculator';
import { sound } from '../utils/soundEffects';
import { 
  Play, Pause, Square, RotateCcw, Check, ArrowRight, ArrowLeft, 
  X, Award, Clock, Activity, Plus, Minus, Info, Volume2, ShieldCheck, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveTestModalProps {
  config: TestConfig;
  currentResult?: SingleTestResult;
  student: StudentInfo;
  benchmarksConfig: ScoreBenchmarksConfig;
  onSaveResult: (result: SingleTestResult) => void;
  onClose: () => void;
  onNavigateNextTest: () => void;
  onNavigatePrevTest: () => void;
  hasNextTest: boolean;
  hasPrevTest: boolean;
  totalCompletedCount: number;
}

export const ActiveTestModal: React.FC<ActiveTestModalProps> = ({
  config,
  currentResult,
  student,
  benchmarksConfig,
  onSaveResult,
  onClose,
  onNavigateNextTest,
  onNavigatePrevTest,
  hasNextTest,
  hasPrevTest,
  totalCompletedCount,
}) => {
  // Timer state
  const [seconds, setSeconds] = useState<number>(currentResult?.timeSeconds || 0);
  const [milliseconds, setMilliseconds] = useState<number>(0);
  const [timerStatus, setTimerStatus] = useState<'siap' | 'berlangsung' | 'jeda' | 'selesai'>(
    currentResult?.status === 'selesai' ? 'selesai' : 'siap'
  );

  // Reps state
  const [reps, setReps] = useState<string>(
    currentResult?.reps !== null && currentResult?.reps !== undefined ? String(currentResult.reps) : ''
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>((currentResult?.timeSeconds || 0) * 1000);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update stopwatch interval
  useEffect(() => {
    if (timerStatus === 'berlangsung') {
      startTimeRef.current = performance.now();
      timerRef.current = setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current + accumulatedMsRef.current;
        const totalSecs = Math.floor(elapsed / 1000);
        const msFrac = Math.floor((elapsed % 1000) / 10); // 2 digits ms
        setSeconds(totalSecs);
        setMilliseconds(msFrac);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [timerStatus]);

  // Handle Controls
  const handleStart = () => {
    sound.playWhistle();
    setTimerStatus('berlangsung');
  };

  const handlePause = () => {
    accumulatedMsRef.current += performance.now() - startTimeRef.current;
    setTimerStatus('jeda');
    sound.playTick();
  };

  const handleFinish = () => {
    if (timerStatus === 'berlangsung') {
      accumulatedMsRef.current += performance.now() - startTimeRef.current;
    }
    setTimerStatus('selesai');
    sound.playFinish();
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    accumulatedMsRef.current = 0;
    setSeconds(0);
    setMilliseconds(0);
    setTimerStatus('siap');
    sound.playTick();
  };

  // Quick rep adjustment with sound
  const handleRepChange = (val: number | string) => {
    sound.playRepSound();
    if (typeof val === 'number') {
      const current = parseInt(reps, 10) || 0;
      const updated = Math.max(0, current + val);
      setReps(String(updated));
    } else {
      if (val === '') {
        setReps('');
        return;
      }
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setReps(String(parsed));
      }
    }
  };

  // Calculate live score
  const numericReps = reps.trim() !== '' ? parseInt(reps, 10) : null;
  const isRepsValid = numericReps !== null && !isNaN(numericReps) && numericReps >= 0;
  const calculatedScore = isRepsValid ? calculateTestScore(config.id, numericReps, benchmarksConfig) : null;
  const predicateInfo = calculatedScore !== null ? getPredicate(calculatedScore) : null;

  // Handle Save and Advance
  const handleSaveAndCommit = (shouldAdvance = false) => {
    if (!isRepsValid) {
      alert('Silakan masukkan jumlah gerakan yang berhasil dilakukan siswa!');
      return;
    }

    const resultToSave: SingleTestResult = {
      testId: config.id,
      reps: numericReps,
      timeSeconds: seconds,
      timeFormatted: formatTimeMMSS(seconds),
      score: calculatedScore,
      predicate: predicateInfo?.name || null,
      status: 'selesai',
      completedAt: new Date().toISOString(),
    };

    onSaveResult(resultToSave);
    sound.playFinish();

    // Mini celebration
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (shouldAdvance && hasNextTest) {
      onNavigateNextTest();
    } else if (!shouldAdvance) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96vh]">
        
        {/* Modal Header - Sticky Top */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm sm:text-base flex-shrink-0">
              {config.number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <span className="font-bold uppercase tracking-wider text-cyan-400 truncate">
                  {config.unit} • Waktu: {config.defaultDurationSeconds}s
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-300 font-medium truncate hidden sm:inline">{student.name} ({student.studentClass})</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white font-['Outfit'] tracking-tight truncate">
                {config.title}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-test-modal"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          
          {/* Top Row: Athlete Illustration + Target Muscles Tips */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800/80">
            <div className="md:col-span-4 flex items-center justify-center p-2 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="w-full h-24 sm:h-28 max-w-[160px] sm:max-w-[180px]">
                <AthleticIllustration type={config.id} />
              </div>
            </div>
            <div className="md:col-span-8 flex flex-col justify-center space-y-1 sm:space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Activity className="w-4 h-4" />
                <span>Target: {config.targetMuscles}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{config.description}</p>
              <div className="pt-1 flex flex-wrap gap-1 sm:gap-1.5">
                {config.techniqueTips.map((tip, idx) => (
                  <span key={idx} className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] sm:text-[11px] text-slate-300 border border-slate-700">
                    ✓ {tip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section: STOPWATCH DIGITAL REAL-TIME */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 text-center relative overflow-hidden shadow-inner">
            {/* Pulsing visual glow when running */}
            {timerStatus === 'berlangsung' && (
              <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
            )}

            {/* Status Pill */}
            <div className="mb-1 sm:mb-2 flex items-center justify-center">
              {timerStatus === 'siap' && (
                <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  STATUS: SIAP
                </span>
              )}
              {timerStatus === 'berlangsung' && (
                <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  STATUS: TES BERLANGSUNG
                </span>
              )}
              {timerStatus === 'jeda' && (
                <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50">
                  STATUS: DIJEDA
                </span>
              )}
              {timerStatus === 'selesai' && (
                <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> STATUS: SELESAI
                </span>
              )}
            </div>

            {/* Giant Stopwatch Numbers */}
            <div className="py-1 sm:py-2 flex items-baseline justify-center font-['JetBrains_Mono'] tracking-tight">
              <span className={`text-5xl sm:text-7xl font-black transition-colors ${
                timerStatus === 'berlangsung' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-white'
              }`}>
                {formatTimeMMSS(seconds)}
              </span>
              <span className="text-xl sm:text-3xl font-bold text-slate-500 ml-1 sm:ml-1.5">
                .{milliseconds.toString().padStart(2, '0')}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 mb-3 sm:mb-4">
              Stopwatch otomatis mencatat durasi waktu saat tes dilakukan
            </p>

            {/* Stopwatch Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {timerStatus !== 'berlangsung' ? (
                <button
                  id="btn-stopwatch-start"
                  type="button"
                  onClick={handleStart}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer transition transform active:scale-95 min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{timerStatus === 'jeda' ? 'LANJUTKAN' : '▶ MULAI TES'}</span>
                </button>
              ) : (
                <button
                  id="btn-stopwatch-pause"
                  type="button"
                  onClick={handlePause}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-900/30 flex items-center gap-2 cursor-pointer transition transform active:scale-95 min-h-[44px]"
                >
                  <Pause className="w-4 h-4" />
                  <span>⏸ JEDA</span>
                </button>
              )}

              <button
                id="btn-stopwatch-finish"
                type="button"
                onClick={handleFinish}
                disabled={timerStatus === 'siap' && seconds === 0}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition min-h-[44px] ${
                  timerStatus !== 'siap' || seconds > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Square className="w-4 h-4 fill-current" />
                <span>■ SELESAI</span>
              </button>

              <button
                id="btn-stopwatch-reset"
                type="button"
                onClick={handleReset}
                className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>↻ RESET</span>
              </button>
            </div>
          </div>

          {/* Section: INPUT JUMLAH GERAKAN & LIVE SCORING */}
          <div className="bg-slate-950/90 rounded-2xl p-3.5 sm:p-5 border border-slate-800 space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                  <span>Jumlah Gerakan Berhasil</span>
                  <span className="text-[11px] sm:text-xs font-normal text-slate-400 lowercase">({config.unit})</span>
                </label>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Hitung Otomatis
                </span>
              </div>

              {/* Reps Input + Touch Increment Buttons */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepChange(-1)}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center font-bold text-lg active:scale-95 transition min-h-[48px] min-w-[48px]"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    id="input-test-reps"
                    type="number"
                    min="0"
                    max="300"
                    value={reps}
                    onChange={(e) => handleRepChange(e.target.value)}
                    placeholder="0"
                    className="flex-1 h-12 text-center text-2xl font-black text-white bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl font-['JetBrains_Mono'] min-h-[48px]"
                  />

                  <button
                    type="button"
                    onClick={() => handleRepChange(1)}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center justify-center font-bold text-lg active:scale-95 transition min-h-[48px] min-w-[48px]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Touch Increment Chips (+5, +10, Clear) */}
                <div className="col-span-12 sm:col-span-6 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepChange(5)}
                    className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center justify-center transition active:scale-95 min-h-[48px]"
                  >
                    +5 {config.unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRepChange(10)}
                    className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center justify-center transition active:scale-95 min-h-[48px]"
                  >
                    +10 {config.unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReps('')}
                    className="h-12 rounded-xl bg-slate-800/50 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800 text-xs font-medium text-slate-400 hover:text-rose-300 flex items-center justify-center transition min-h-[48px]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE HASIL TES DISPLAY CARD */}
            {isRepsValid ? (
              <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700 shadow-md">
                <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-slate-800">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    HASIL SKOR OTOMATIS
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-400">
                    Waktu: <strong className="text-white font-mono">{formatTimeMMSS(seconds)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                  <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Repetisi</p>
                    <p className="text-sm sm:text-lg font-black text-white mt-0.5">
                      {numericReps} <span className="text-xs font-normal text-slate-400">{config.unit}</span>
                    </p>
                  </div>

                  <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Waktu</p>
                    <p className="text-sm sm:text-lg font-black text-cyan-400 font-mono mt-0.5">
                      {formatTimeMMSS(seconds)}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Skor</p>
                    <p className="text-lg sm:text-2xl font-black text-emerald-400 font-['JetBrains_Mono'] mt-0.5">
                      {calculatedScore}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-2 sm:p-2.5 rounded-lg border border-slate-800 flex flex-col justify-center">
                    <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Predikat</p>
                    {predicateInfo && (
                      <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-black border ${predicateInfo.badgeBg}`}>
                        {predicateInfo.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Masukkan jumlah repetisi di atas untuk melihat kalkulasi nilai otomatis.
              </div>
            )}

            {/* Benchmark Reference */}
            <div className="pt-1 text-[10px] sm:text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Standar Rentang {config.shortTitle}: </span>
              {benchmarksConfig[config.id]?.map((b, i) => (
                <span key={i} className="mr-1.5 inline-block">
                  [{b.max !== null ? `${b.min}–${b.max}` : `≥${b.min}`}: <strong className="text-cyan-400">{b.score}</strong>]
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls - Sticky Bottom */}
        <div className="bg-slate-950 px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div>
            {hasPrevTest && (
              <button
                type="button"
                onClick={onNavigatePrevTest}
                className="px-3 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition min-h-[44px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tes</span> Sebelumnya
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-test-only"
              type="button"
              disabled={!isRepsValid}
              onClick={() => handleSaveAndCommit(false)}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition min-h-[44px] ${
                isRepsValid
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer active:scale-95'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan</span>
            </button>

            {hasNextTest ? (
              <button
                id="btn-save-and-next-test"
                type="button"
                disabled={!isRepsValid}
                onClick={() => handleSaveAndCommit(true)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-lg min-h-[44px] ${
                  isRepsValid
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-950/40 cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Simpan & Lanjut</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-finish-all-tests"
                type="button"
                disabled={!isRepsValid}
                onClick={() => handleSaveAndCommit(false)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-lg min-h-[44px] ${
                  isRepsValid
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/40 cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Selesai 6 Tes</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
