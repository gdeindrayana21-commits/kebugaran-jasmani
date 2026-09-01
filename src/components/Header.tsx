import React from 'react';
import { Activity, Award, Settings, Users, Volume2, VolumeX, ShieldCheck, UserCheck, Flame, Wifi, WifiOff, RefreshCw, BookOpen } from 'lucide-react';
import { DEFAULT_SCHOOL_NAME, DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';
import { sound } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'assessment' | 'recap' | 'settings' | 'guide';
  setActiveTab: (tab: 'assessment' | 'recap' | 'settings' | 'guide') => void;
  savedRecordsCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isRealtimeConnected?: boolean;
  isSyncing?: boolean;
  userRole?: 'guru' | 'murid';
  setUserRole?: (role: 'guru' | 'murid') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  savedRecordsCount,
  soundEnabled,
  setSoundEnabled,
  isRealtimeConnected = true,
  isSyncing = false,
  userRole = 'guru',
  setUserRole,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playStart();
  };

  return (
    <header className="relative z-30 bg-slate-900/95 border-b border-slate-800/90 backdrop-blur-md sticky top-0 shadow-lg shadow-black/40">
      {/* Top Athletic Neon Glow Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 animate-pulse" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & School Header */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 text-[10px] text-slate-950 font-black">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 fill-slate-950" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PJOK KELAS X
                </span>
                <span className="text-[11px] font-medium text-slate-400 hidden md:inline">
                  • {DEFAULT_SCHOOL_NAME}
                </span>
              </div>
              
              <h1 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight text-white font-['Outfit'] leading-tight truncate flex items-center gap-1.5 sm:gap-2">
                <span>TES KEBUGARAN JASMANI</span>
              </h1>
              
              <p className="text-[10px] sm:text-xs text-slate-400 truncate md:hidden">
                {DEFAULT_SCHOOL_NAME}
              </p>
            </div>
          </div>

          {/* Right Action Controls: Realtime Status & Nav & Sound */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            
            {/* Real-time Cloud Firestore Indicator */}
            <div 
              title={isRealtimeConnected ? "Database Firestore Real-time Terhubung" : "Mode Offline (Tersimpan Lokal)"}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold transition ${
                isRealtimeConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
              ) : isRealtimeConnected ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isSyncing ? 'Sinkron...' : isRealtimeConnected ? 'Live Real-time' : 'Offline'}
              </span>
            </div>

            {/* Role switch pill (Guru / Murid) */}
            {setUserRole && (
              <div className="hidden lg:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setUserRole('guru')}
                  className={`px-2 py-1 rounded-md transition ${
                    userRole === 'guru'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mode Guru
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('murid')}
                  className={`px-2 py-1 rounded-md transition ${
                    userRole === 'murid'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mode Murid
                </button>
              </div>
            )}

            {/* Sound toggle */}
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              title={soundEnabled ? 'Matikan Suara Peluit/Timer' : 'Nyalakan Suara Peluit/Timer'}
              className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border min-h-[38px] min-w-[38px] justify-center ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span className="hidden xl:inline text-[11px]">{soundEnabled ? 'Peluit Aktif' : 'Peluit Bisu'}</span>
            </button>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
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
                <span>Form Nilai</span>
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
                id="nav-tab-guide"
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'guide'
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Panduan</span>
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
                <span className="hidden lg:inline">Rentang Nilai</span>
              </button>
            </div>

          </div>
        </div>

        {/* Quick Identity Teacher Summary Bar */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">Guru/Penilai:</span>
            <span className="text-emerald-400 font-bold truncate">{DEFAULT_TEACHER_NAME}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
            <span>Mapel: <strong className="text-slate-200">PJOK</strong></span>
            <span>Tingkat: <strong className="text-slate-200">Kelas X (X.1–X.8)</strong></span>
            <span className="hidden sm:inline">Status: <strong className="text-cyan-300">Live Real-time Sync</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
