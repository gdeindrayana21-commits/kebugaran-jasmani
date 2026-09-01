import React, { useState } from 'react';
import { ScoreBenchmarksConfig, FitnessTestType } from '../types';
import { FITNESS_TESTS } from '../constants/fitnessTests';
import { getDefaultBenchmarksConfig } from '../utils/scoreCalculator';
import { Settings, RotateCcw, Save, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface ScoreSettingsModalProps {
  benchmarksConfig: ScoreBenchmarksConfig;
  onSaveBenchmarks: (config: ScoreBenchmarksConfig) => void;
  onClose: () => void;
}

export const ScoreSettingsModal: React.FC<ScoreSettingsModalProps> = ({
  benchmarksConfig,
  onSaveBenchmarks,
  onClose,
}) => {
  const [configDraft, setConfigDraft] = useState<ScoreBenchmarksConfig>(
    JSON.parse(JSON.stringify(benchmarksConfig))
  );
  const [selectedTestId, setSelectedTestId] = useState<FitnessTestType>('push_up');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeTestConfig = FITNESS_TESTS.find((t) => t.id === selectedTestId)!;
  const currentBenchmarks = configDraft[selectedTestId] || [];

  const handleBenchmarkChange = (
    index: number,
    field: 'min' | 'max' | 'score',
    val: string
  ) => {
    const updated = [...currentBenchmarks];
    if (field === 'max' && (val === '' || val.toLowerCase() === 'null' || val === '+')) {
      updated[index].max = null;
    } else {
      const num = parseInt(val, 10);
      updated[index][field] = isNaN(num) ? 0 : num;
    }
    setConfigDraft({
      ...configDraft,
      [selectedTestId]: updated,
    });
  };

  const handleAddTier = () => {
    const updated = [...currentBenchmarks];
    const last = updated[updated.length - 1];
    const newMin = last ? (last.max !== null ? last.max + 1 : last.min + 5) : 0;
    updated.push({
      min: newMin,
      max: null,
      score: 100,
    });
    setConfigDraft({
      ...configDraft,
      [selectedTestId]: updated,
    });
    sound.playTick();
  };

  const handleDeleteTier = (index: number) => {
    if (currentBenchmarks.length <= 1) {
      alert('Minimal harus ada 1 tingkatan rentang nilai!');
      return;
    }
    const updated = currentBenchmarks.filter((_, idx) => idx !== index);
    setConfigDraft({
      ...configDraft,
      [selectedTestId]: updated,
    });
    sound.playTick();
  };

  const handleResetToDefaultThisTest = () => {
    const defaults = getDefaultBenchmarksConfig();
    setConfigDraft({
      ...configDraft,
      [selectedTestId]: [...defaults[selectedTestId]],
    });
    sound.playTick();
  };

  const handleResetAllToDefaults = () => {
    if (confirm('Kembalikan SEMUA rentang nilai 6 tes ke standar bawaan SMA Negeri 1 Tejakula?')) {
      const defaults = getDefaultBenchmarksConfig();
      setConfigDraft(defaults);
      sound.playStart();
    }
  };

  const handleSaveAll = () => {
    onSaveBenchmarks(configDraft);
    setSavedSuccess(true);
    sound.playFinish();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] tracking-tight">
                PENGATURAN RENTANG NILAI TES
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan standar konversi repetisi ke nilai angka (50 - 100) sesuai pedoman sekolah
              </p>
            </div>
          </div>

          <button
            id="btn-close-settings-modal"
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Test Tabs */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
            {FITNESS_TESTS.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => setSelectedTestId(test.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedTestId === test.id
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{test.number}. {test.shortTitle}</span>
              </button>
            ))}
          </div>

          {/* Active Test Setting Card */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-black text-white font-['Outfit'] flex items-center gap-2">
                  <span>Tabel Rentang: {activeTestConfig.title}</span>
                  <span className="text-xs font-normal text-cyan-400">({activeTestConfig.unit})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Siswa yang mencapai repetisi dalam batas akan memperoleh nilai yang ditentukan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefaultThisTest}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Standar Bawaan Tes Ini
                </button>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris
                </button>
              </div>
            </div>

            {/* Benchmark Rows Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Tingkatan</th>
                    <th className="py-2.5 px-3">Min ({activeTestConfig.unit})</th>
                    <th className="py-2.5 px-3">Maks ({activeTestConfig.unit}) / Tanpa Batas</th>
                    <th className="py-2.5 px-3">Nilai Konversi (0-100)</th>
                    <th className="py-2.5 px-3 text-right">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentBenchmarks.map((bench, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        Level {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={bench.min}
                          onChange={(e) => handleBenchmarkChange(idx, 'min', e.target.value)}
                          className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center font-mono font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={bench.max === null ? '≥ (Tanpa Batas)' : bench.max}
                            onChange={(e) => handleBenchmarkChange(idx, 'max', e.target.value)}
                            placeholder="Maksimal"
                            className="w-28 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...currentBenchmarks];
                              updated[idx].max = updated[idx].max === null ? bench.min + 5 : null;
                              setConfigDraft({ ...configDraft, [selectedTestId]: updated });
                            }}
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            {bench.max === null ? 'Set Maks Angka' : 'Set ≥ (Tanpa batas)'}
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={bench.score}
                          onChange={(e) => handleBenchmarkChange(idx, 'score', e.target.value)}
                          className="w-24 px-2.5 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 text-center font-mono font-black text-sm"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(idx)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Rentang nilai ini akan langsung otomatis digunakan oleh kalkulator skor saat guru memasukkan repetisi gerakan siswa.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetAllToDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Reset Semua 6 Tes ke Bawaan
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-benchmark-settings"
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Simpan Perubahan Rentang</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
