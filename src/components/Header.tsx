import React from 'react';
import { Activity, Award, Settings, Users, Volume2, VolumeX, ShieldCheck, UserCheck, Flame } from 'lucide-react';
import { DEFAULT_SCHOOL_NAME, DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';
import { sound } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'assessment' | 'recap' | 'settings' | 'guide';
  setActiveTab: (tab: 'assessment' | 'recap' | 'settings' | 'guide') => void;
  savedRecordsCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedRecordsCount,
  soundEnabled,
  setSoundEnabled,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playStart();
  };

  return (
    <header className="relative z-30 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 shadow-lg shadow-black/30">
      {/* Top Athletic Neon Glow Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & School Header */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 text-[10px] text-slate-950 font-black">
                <Flame className="w-3 h-3 text-slate-950 fill-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  KURIKULUM MERDEKA
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:inline">
                  • {DEFAULT_SCHOOL_NAME}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Outfit'] leading-tight flex items-center gap-2">
                PENILAIAN PJOK KELAS X
                <span className="text-xs sm:text-sm font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                  KEBUGARAN JASMANI
                </span>
              </h1>
              <p className="text-xs text-slate-400 sm:hidden">
                {DEFAULT_SCHOOL_NAME}
              </p>
            </div>
          </div>

          {/* Teacher Badge & Action Controls */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
            {/* Teacher info badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <p className="font-semibold text-slate-200 leading-none">{DEFAULT_TEACHER_NAME}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Guru PJOK • Kelas X</p>
              </div>
            </div>

            {/* Sound toggle */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara Peluit/Timer' : 'Nyalakan Suara Peluit/Timer'}
              className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'Peluit Aktif' : 'Peluit Bisu'}</span>
            </button>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                id="nav-tab-assessment"
                onClick={() => setActiveTab('assessment')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'assessment'
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Form Tes</span>
              </button>

              <button
                id="nav-tab-recap"
                onClick={() => setActiveTab('recap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition relative ${
                  activeTab === 'recap'
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Rekap Kelas</span>
                {savedRecordsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40">
                    {savedRecordsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-settings"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pengaturan Rentang</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Identity Teacher Summary Bar (Mobile / Tablet visible) */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-y-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Guru/Penilai:</span>
            <span className="text-emerald-400 font-semibold">{DEFAULT_TEACHER_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Mapel: <strong className="text-slate-200">PJOK</strong></span>
            <span>Tingkat: <strong className="text-slate-200">Kelas X</strong></span>
            <span className="hidden sm:inline">Materi: <strong className="text-cyan-300">Kebugaran Jasmani</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
