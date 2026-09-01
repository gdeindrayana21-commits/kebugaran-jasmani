import React from 'react';
import { TestConfig, SingleTestResult } from '../types';
import { AthleticIllustration } from './AthleticIllustrations';
import { Play, CheckCircle, Clock, Award, Activity, ChevronRight } from 'lucide-react';
import { getPredicate } from '../utils/scoreCalculator';

interface TestCardProps {
  config: TestConfig;
  result?: SingleTestResult;
  onOpenTest: (testId: TestConfig['id']) => void;
  isStudentReady: boolean;
}

export const TestCard: React.FC<TestCardProps> = ({
  config,
  result,
  onOpenTest,
  isStudentReady,
}) => {
  const isCompleted = result?.status === 'selesai' && typeof result?.score === 'number';
  const isRunning = result?.status === 'berlangsung';

  const predicateInfo = isCompleted && result.score !== null ? getPredicate(result.score) : null;

  return (
    <div
      id={`card-test-${config.id}`}
      onClick={() => {
        if (!isStudentReady) {
          alert('Mohon isi nama dan lengkapi identitas siswa terlebih dahulu!');
          return;
        }
        onOpenTest(config.id);
      }}
      className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
        isCompleted
          ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/40'
          : isRunning
          ? 'bg-slate-900/95 border-amber-500 hover:border-amber-400 shadow-lg shadow-amber-950/40 ring-2 ring-amber-500/30'
          : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-xl hover:shadow-black/50'
      } ${!isStudentReady ? 'opacity-75 hover:opacity-100' : ''}`}
    >
      {/* Top Background Illustration Area */}
      <div className="relative h-36 bg-gradient-to-b from-slate-950/90 to-slate-900/80 p-3 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
        {/* Athletic radial glow behind illustration */}
        <div className="absolute inset-0 bg-radial from-cyan-500/10 to-transparent opacity-60 group-hover:scale-110 transition duration-500" />

        {/* Dynamic Sport illustration */}
        <div className="relative z-10 w-full h-full max-w-[200px] transform group-hover:scale-105 transition duration-300">
          <AthleticIllustration type={config.id} />
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-slate-950/90 border border-slate-700 flex items-center justify-center text-xs font-black text-white shadow">
            {config.number}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
            {config.unit}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 right-3 z-20">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm backdrop-blur-sm">
              <CheckCircle className="w-3 h-3" /> SELESAI
            </span>
          ) : isRunning ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse backdrop-blur-sm">
              <Activity className="w-3 h-3 animate-spin" /> BERLANGSUNG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-400 border border-slate-700/60 backdrop-blur-sm">
              SIAP TES
            </span>
          )}
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-black text-white font-['Outfit'] tracking-tight group-hover:text-cyan-300 transition flex items-center justify-between">
            <span>{config.title}</span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition" />
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            {config.targetMuscles}
          </p>
        </div>

        {/* Performance Results or Initial State */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          {isCompleted ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Hasil Gerakan:</span>
                <span className="font-bold text-white text-sm">
                  {result.reps} <span className="text-xs text-slate-400 font-normal">{config.unit}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Waktu:
                </span>
                <span className="font-mono text-slate-300 font-semibold">{result.timeFormatted}</span>
              </div>

              {/* Score and Predicate Pills */}
              <div className="pt-1 flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Nilai:</span>
                  <span className="text-lg font-black text-emerald-400 font-['JetBrains_Mono']">
                    {result.score}
                  </span>
                </div>
                {predicateInfo && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${predicateInfo.badgeBg}`}>
                    {predicateInfo.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Waktu standar: <strong>{config.defaultDurationSeconds}s</strong></span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                <Play className="w-3 h-3 fill-cyan-400" /> Mulai
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
