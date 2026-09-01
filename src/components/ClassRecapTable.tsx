import React, { useState, useMemo } from 'react';
import { AssessmentRecord } from '../types';
import { CLASS_OPTIONS, PREDICATES } from '../constants/fitnessTests';
import { exportRecordsToExcel } from '../utils/exportUtils';
import { 
  Search, Filter, ArrowUpDown, Download, Printer, Trash2, Eye, 
  FileSpreadsheet, Users, Trophy, Award, CheckCircle, RefreshCw, 
  Plus, ExternalLink, Code2, Copy, Check
} from 'lucide-react';
import { getPredicate } from '../utils/scoreCalculator';

interface ClassRecapTableProps {
  records: AssessmentRecord[];
  onSelectRecordToView: (record: AssessmentRecord) => void;
  onSelectRecordToPrint: (record: AssessmentRecord) => void;
  onDeleteRecord: (id: string) => void;
  onStartNewAssessment: () => void;
}

export const ClassRecapTable: React.FC<ClassRecapTableProps> = ({
  records,
  onSelectRecordToView,
  onSelectRecordToPrint,
  onDeleteRecord,
  onStartNewAssessment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedPredicate, setSelectedPredicate] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'name' | 'absen' | 'latest'>('latest');
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Filter and Sort logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // Filter Search
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.student.name.toLowerCase().includes(q) ||
          r.student.attendanceNumber.includes(q)
      );
    }

    // Filter Class
    if (selectedClass !== 'ALL') {
      result = result.filter((r) => r.student.studentClass === selectedClass);
    }

    // Filter Predicate
    if (selectedPredicate !== 'ALL') {
      result = result.filter((r) => r.predicate === selectedPredicate);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'highest') return b.finalScore - a.finalScore;
      if (sortBy === 'lowest') return a.finalScore - b.finalScore;
      if (sortBy === 'name') return a.student.name.localeCompare(b.student.name);
      if (sortBy === 'absen') {
        const numA = parseInt(a.student.attendanceNumber, 10) || 0;
        const numB = parseInt(b.student.attendanceNumber, 10) || 0;
        return numA - numB;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return result;
  }, [records, searchTerm, selectedClass, selectedPredicate, sortBy]);

  // Summary statistics for active filtered view
  const stats = useMemo(() => {
    if (filteredAndSortedRecords.length === 0) {
      return { count: 0, avg: 0, highest: 0, lowest: 0 };
    }
    const scores = filteredAndSortedRecords.map((r) => r.finalScore);
    const sum = scores.reduce((acc, v) => acc + v, 0);
    return {
      count: filteredAndSortedRecords.length,
      avg: Number((sum / scores.length).toFixed(2)),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    };
  }, [filteredAndSortedRecords]);

  const handleDownloadExcelAll = () => {
    exportRecordsToExcel(filteredAndSortedRecords, `Rekap_Nilai_PJOK_${selectedClass !== 'ALL' ? selectedClass : 'Semua_Kelas'}`);
  };

  const handlePrintTable = () => {
    window.print();
  };

  const sampleAppsScriptCode = `// Google Apps Script untuk Google Spreadsheet Webhook
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      data.examiner,
      data.studentName,
      data.studentClass,
      data.attendanceNo,
      data.gender,
      data.date,
      data.pushUpReps, data.pushUpScore,
      data.sitUpReps, data.sitUpScore,
      data.backUpReps, data.backUpScore,
      data.squatReps, data.squatScore,
      data.shuttleReps, data.shuttleScore,
      data.stepReps, data.stepScore,
      data.totalScore,
      data.finalScore,
      data.predicate,
      data.notes
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 backdrop-blur-md">
      
      {/* Top Header & Statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
              REKAP PENILAIAN KELAS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {filteredAndSortedRecords.length} Data Siswa
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data penilaian kebugaran jasmani otomatis bertambah setiap kali hasil siswa disimpan
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-recap-new-student"
            type="button"
            onClick={onStartNewAssessment}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-1.5 transition shadow-md shadow-emerald-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Penilaian Baru
          </button>

          <button
            id="btn-recap-download-excel"
            type="button"
            onClick={handleDownloadExcelAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Download Excel
          </button>

          <button
            id="btn-recap-print-all"
            type="button"
            onClick={handlePrintTable}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            Cetak Tabel
          </button>

          <button
            id="btn-toggle-webhook"
            type="button"
            onClick={() => setShowWebhookGuide(!showWebhookGuide)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center gap-1 transition"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Google Spreadsheet API</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Siswa Terdata</span>
            <p className="text-lg font-black text-white mt-0.5">{stats.count}</p>
          </div>
          <Users className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Rata-Rata Nilai</span>
            <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{stats.avg}</p>
          </div>
          <Trophy className="w-5 h-5 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nilai Tertinggi</span>
            <p className="text-lg font-black text-cyan-300 font-mono mt-0.5">{stats.highest}</p>
          </div>
          <Award className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nilai Terendah</span>
            <p className="text-lg font-black text-amber-300 font-mono mt-0.5">{stats.lowest}</p>
          </div>
          <ArrowUpDown className="w-5 h-5 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-recap-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau no. absen..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Class */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Kelas:</span>
          <select
            id="select-filter-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">Semua Kelas (X.1 – X.8)</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Predicate */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Predikat:</span>
          <select
            id="select-filter-predicate"
            value={selectedPredicate}
            onChange={(e) => setSelectedPredicate(e.target.value)}
            className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="ALL">Semua Predikat</option>
            {PREDICATES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Urutkan:</span>
          <select
            id="select-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="latest">Terbaru Ditambahkan</option>
            <option value="highest">Nilai Tertinggi (Rank 1)</option>
            <option value="lowest">Nilai Terendah</option>
            <option value="name">Nama Siswa (A - Z)</option>
            <option value="absen">No. Absen (1 - 50)</option>
          </select>
        </div>
      </div>

      {/* Optional Google Spreadsheet Webhook Helper */}
      {showWebhookGuide && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Struktur Integrasi Google Spreadsheet (Apps Script)
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleAppsScriptCode);
                setCopiedWebhook(true);
                setTimeout(() => setCopiedWebhook(false), 2000);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-cyan-700/50"
            >
              {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedWebhook ? 'Tersalin!' : 'Salin Kode GAS'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Guru dapat menempelkan script ini pada menu <em>Extensions &gt; Apps Script</em> di Google Spreadsheet untuk menerima sinkronisasi data penilaian secara online.
          </p>
        </div>
      )}

      {/* Main Table Display */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-2 text-center w-10">No</th>
              <th className="py-3 px-3">Nama Siswa</th>
              <th className="py-3 px-2 text-center">Kelas</th>
              <th className="py-3 px-2 text-center">Absen</th>
              <th className="py-3 px-2 text-center">Push Up</th>
              <th className="py-3 px-2 text-center">Sit Up</th>
              <th className="py-3 px-2 text-center">Back Up</th>
              <th className="py-3 px-2 text-center">Jongkok</th>
              <th className="py-3 px-2 text-center">Shuttle</th>
              <th className="py-3 px-2 text-center">Tangga</th>
              <th className="py-3 px-3 text-center">Nilai Akhir</th>
              <th className="py-3 px-3 text-center">Predikat</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedRecords.length > 0 ? (
              filteredAndSortedRecords.map((rec, index) => {
                const predInfo = getPredicate(rec.finalScore);

                return (
                  <tr key={rec.id} className="hover:bg-slate-900/60 transition group">
                    <td className="py-3 px-2 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{rec.student.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({rec.student.gender})</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-cyan-300 whitespace-nowrap">
                      {rec.student.studentClass}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300">
                      {rec.student.attendanceNumber}
                    </td>

                    {/* 6 Test Scores with Reps hint */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.push_up?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.push_up?.reps ?? 0}x</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.sit_up?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.sit_up?.reps ?? 0}x</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.back_up?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.back_up?.reps ?? 0}x</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.jongkok_bangun?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.jongkok_bangun?.reps ?? 0}x</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.lari_bolak_balik?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.lari_bolak_balik?.reps ?? 0}p</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-emerald-400">{rec.tests.naik_turun_tangga?.score ?? '-'}</span>
                      <span className="block text-[9px] text-slate-500 font-mono">{rec.tests.naik_turun_tangga?.reps ?? 0}s</span>
                    </td>

                    {/* Final Score */}
                    <td className="py-3 px-3 text-center font-black font-['JetBrains_Mono'] text-sm text-cyan-300">
                      {rec.finalScore.toFixed(2)}
                    </td>

                    {/* Predicate Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${predInfo.badgeBg}`}>
                        {rec.predicate}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectRecordToView(rec)}
                          title="Buka / Edit Hasil Siswa Ini"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRecordToPrint(rec)}
                          title="Cetak Lembar Resmi A4 Siswa Ini"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus data penilaian untuk ${rec.student.name}?`)) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          title="Hapus Data"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={13} className="py-8 text-center text-slate-500">
                  Belum ada data siswa yang cocok dengan filter. Tekan <strong>+ Penilaian Baru</strong> untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
