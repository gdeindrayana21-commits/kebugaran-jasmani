import React, { useState, useMemo } from 'react';
import { AssessmentRecord } from '../types';
import { CLASS_OPTIONS, PREDICATES } from '../constants/fitnessTests';
import { exportRecordsToExcel } from '../utils/exportUtils';
import { consolidateAssessmentRecords, ALL_FITNESS_TEST_IDS } from '../utils/consolidationUtils';
import { 
  Search, Filter, ArrowUpDown, Download, Printer, Trash2, Eye, 
  FileSpreadsheet, Users, Trophy, Award, CheckCircle, RefreshCw, 
  Plus, ExternalLink, Code2, Copy, Check, LayoutGrid, Table as TableIcon,
  ChevronDown, ChevronUp, Clock, Activity, Zap, AlertTriangle, AlertCircle,
  Layers, Sparkles, CheckCircle2
} from 'lucide-react';
import { getPredicate } from '../utils/scoreCalculator';

interface ClassRecapTableProps {
  records: AssessmentRecord[];
  onSelectRecordToView: (record: AssessmentRecord) => void;
  onSelectRecordToPrint: (record: AssessmentRecord) => void;
  onDeleteRecord: (id: string, sourceIds?: string[]) => Promise<void> | void;
  onDeleteMultipleRecords?: (ids: string[], allSourceIds?: string[]) => Promise<void> | void;
  onDeleteAllRecords: (classFilter?: string) => Promise<void> | void;
  onStartNewAssessment: () => void;
  isRealtimeConnected?: boolean;
}

export const ClassRecapTable: React.FC<ClassRecapTableProps> = ({
  records,
  onSelectRecordToView,
  onSelectRecordToPrint,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onDeleteAllRecords,
  onStartNewAssessment,
  isRealtimeConnected = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedPredicate, setSelectedPredicate] = useState<string>('ALL');
  const [completionFilter, setCompletionFilter] = useState<'ALL' | 'COMPLETED' | 'INCOMPLETE'>('ALL');
  const [consolidateView, setConsolidateView] = useState(true);
  const [sortBy, setSortBy] = useState<'highest' | 'lowest' | 'name' | 'absen' | 'latest'>('latest');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // State untuk Modal Hapus Satu Data Siswa
  const [recordToDelete, setRecordToDelete] = useState<AssessmentRecord | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // State untuk Multi-Select Checkbox & Hapus Terpilih
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // State untuk Modal Hapus Semua Riwayat
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'all' | 'class'>('all');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [confirmDeleteWord, setConfirmDeleteWord] = useState('');

  // Base records: automatically consolidated from the 6 assessors when enabled
  const baseRecords = useMemo(() => {
    return consolidateView ? consolidateAssessmentRecords(records) : records;
  }, [records, consolidateView]);

  // Filter and Sort logic
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...baseRecords];

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

    // Filter Completion (6/6 vs in-progress)
    if (completionFilter === 'COMPLETED') {
      result = result.filter((r) => r.completedTestsCount === 6);
    } else if (completionFilter === 'INCOMPLETE') {
      result = result.filter((r) => (r.completedTestsCount ?? 0) < 6);
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
  }, [baseRecords, searchTerm, selectedClass, selectedPredicate, completionFilter, sortBy]);

  // Summary statistics for active filtered view
  const stats = useMemo(() => {
    if (filteredAndSortedRecords.length === 0) {
      return { count: 0, avg: 0, highest: 0, lowest: 0, completedCount: 0 };
    }
    const scores = filteredAndSortedRecords.map((r) => r.finalScore);
    const sum = scores.reduce((acc, v) => acc + v, 0);
    const completedCount = filteredAndSortedRecords.filter((r) => r.completedTestsCount === 6).length;
    return {
      count: filteredAndSortedRecords.length,
      avg: Number((sum / scores.length).toFixed(2)),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      completedCount,
    };
  }, [filteredAndSortedRecords]);

  const handleDownloadExcelAll = () => {
    exportRecordsToExcel(filteredAndSortedRecords, `Rekap_Nilai_PJOK_${selectedClass !== 'ALL' ? selectedClass : 'Semua_Kelas'}`);
  };

  const handlePrintTable = () => {
    window.print();
  };

  // Toggle selection for a single student
  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle selection for all filtered records
  const toggleSelectAll = () => {
    if (filteredAndSortedRecords.length === 0) return;
    const allFilteredSelected = filteredAndSortedRecords.every((r) => selectedRecordIds.has(r.id));
    if (allFilteredSelected) {
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        filteredAndSortedRecords.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        filteredAndSortedRecords.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const isAllFilteredSelected =
    filteredAndSortedRecords.length > 0 &&
    filteredAndSortedRecords.every((r) => selectedRecordIds.has(r.id));
  const isSomeFilteredSelected =
    filteredAndSortedRecords.some((r) => selectedRecordIds.has(r.id)) && !isAllFilteredSelected;

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
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 backdrop-blur-md">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] tracking-tight">
              REKAP PENILAIAN KELAS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {filteredAndSortedRecords.length} Siswa
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-3 h-3 text-emerald-400" /> Real-time Cloud
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
            Data penilaian kebugaran jasmani otomatis tersinkronisasi langsung di semua perangkat
          </p>
        </div>

        {/* Top Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-recap-new-student"
            type="button"
            onClick={onStartNewAssessment}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-1.5 transition shadow-md shadow-emerald-950/30 cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Penilaian Baru</span>
          </button>

          <button
            id="btn-recap-download-excel"
            type="button"
            onClick={handleDownloadExcelAll}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            id="btn-recap-print-all"
            type="button"
            onClick={handlePrintTable}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          <button
            id="btn-recap-delete-all"
            type="button"
            disabled={records.length === 0}
            onClick={() => {
              setDeleteTarget(selectedClass !== 'ALL' ? 'class' : 'all');
              setConfirmDeleteWord('');
              setShowDeleteModal(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition min-h-[38px] ${
              records.length === 0
                ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60 hover:border-rose-500 shadow-md shadow-rose-950/30 cursor-pointer'
            }`}
            title="Hapus riwayat penilaian siswa"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Hapus Semua Riwayat</span>
            <span className="sm:hidden">Hapus</span>
          </button>

          {/* View mode switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Tampilan Kartu"
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Consolidation Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Rekapan 6 Penilai Otomatis:</strong> Ketika ke-6 penilai pos mengisi nilai, hasil tes siswa disatukan menjadi 1 baris di tabel dan file Excel.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConsolidateView(!consolidateView)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer whitespace-nowrap ${
            consolidateView
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Alihkan mode tampilan gabungan 6 penilai atau baris terpisah"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{consolidateView ? 'Satukan 6 Penilai: AKTIF' : 'Satukan 6 Penilai: NONAKTIF'}</span>
        </button>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Siswa</span>
            <p className="text-base sm:text-lg font-black text-white mt-0.5">{stats.count}</p>
          </div>
          <Users className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">6 Pos Lengkap</span>
            <p className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
              {stats.completedCount} <span className="text-xs text-slate-500 font-normal">/ {stats.count}</span>
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Rata-Rata</span>
            <p className="text-base sm:text-lg font-black text-cyan-300 font-mono mt-0.5">{stats.avg}</p>
          </div>
          <Trophy className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tertinggi</span>
            <p className="text-base sm:text-lg font-black text-emerald-300 font-mono mt-0.5">{stats.highest}</p>
          </div>
          <Award className="w-5 h-5 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Terendah</span>
            <p className="text-base sm:text-lg font-black text-amber-300 font-mono mt-0.5">{stats.lowest}</p>
          </div>
          <ArrowUpDown className="w-5 h-5 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-recap-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama atau no. absen..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 min-h-[42px]"
          />
        </div>

        {/* Filter Class */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Kelas:</span>
          <select
            id="select-filter-class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2.5 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium min-h-[42px]"
          >
            <option value="ALL">Semua Kelas (X.1 – X.8)</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status Pos Tes */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Status:</span>
          <select
            id="select-filter-completion"
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value as any)}
            className="w-full py-2.5 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium min-h-[42px]"
          >
            <option value="ALL">Semua Status (6 Pos)</option>
            <option value="COMPLETED">Lengkap (6/6 Tes Selesai)</option>
            <option value="INCOMPLETE">Belum Lengkap (&lt; 6 Pos)</option>
          </select>
        </div>

        {/* Filter Predicate */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Predikat:</span>
          <select
            id="select-filter-predicate"
            value={selectedPredicate}
            onChange={(e) => setSelectedPredicate(e.target.value)}
            className="w-full py-2.5 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium min-h-[42px]"
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
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Urutan:</span>
          <select
            id="select-sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2.5 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium min-h-[42px]"
          >
            <option value="latest">Terbaru</option>
            <option value="highest">Nilai Tertinggi (Rank 1)</option>
            <option value="lowest">Nilai Terendah</option>
            <option value="name">Nama Siswa (A - Z)</option>
            <option value="absen">No. Absen (1 - 50)</option>
          </select>
        </div>
      </div>

      {/* Floating / Sticky Multi-Selection Action Toolbar */}
      {selectedRecordIds.size > 0 && (
        <div className="sticky top-2 z-30 p-3 sm:p-3.5 rounded-xl bg-slate-900/95 border border-rose-500/50 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold text-xs">
              {selectedRecordIds.size}
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white block">
                {selectedRecordIds.size} Data Siswa Terpilih
              </span>
              <span className="text-[11px] text-slate-400">
                Pilih opsi aksi untuk data rekapan yang dicentang
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRecordIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              Batal Pilih
            </button>
            <button
              id="btn-trigger-bulk-delete"
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedRecordIds.size} Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE-FRIENDLY CARD VIEW (Visible on mobile by default or when selected) */}
      <div className={`${viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block md:hidden'} space-y-3`}>
        {filteredAndSortedRecords.length > 0 ? (
          filteredAndSortedRecords.map((rec, index) => {
            const predInfo = getPredicate(rec.finalScore);
            const isExpanded = expandedCardId === rec.id;
            const isChecked = selectedRecordIds.has(rec.id);

            return (
              <div 
                key={rec.id}
                className={`bg-slate-950 border rounded-xl p-3.5 space-y-3 shadow-md transition ${
                  isChecked ? 'border-rose-500/60 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Checkbox for selection */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRecord(rec.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                      title="Pilih data siswa ini"
                    />

                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {rec.student.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-cyan-300 font-semibold">Kelas {rec.student.studentClass}</span>
                        <span>•</span>
                        <span>Absen: <strong className="text-slate-200">{rec.student.attendanceNumber}</strong></span>
                        <span>•</span>
                        <span>({rec.student.gender === 'L' ? 'L' : 'P'})</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1.5">
                        {rec.completedTestsCount === 6 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 6/6 Pos Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {rec.completedTestsCount ?? 0}/6 Pos Dinilai
                          </span>
                        )}
                        {rec.student.examinerName && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[220px]" title={rec.student.examinerName}>
                            Penilai: {rec.student.examinerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-black text-emerald-400 font-['JetBrains_Mono'] block">
                      {rec.finalScore.toFixed(2)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border mt-0.5 ${predInfo.badgeBg}`}>
                      {rec.predicate}
                    </span>
                  </div>
                </div>

                {/* Collapsible 6 Test Breakdown */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Rincian Nilai 6 Tes:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Push Up:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.push_up?.score ?? '-'} ({rec.tests.push_up?.reps ?? 0}x)</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Sit Up:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.sit_up?.score ?? '-'} ({rec.tests.sit_up?.reps ?? 0}x)</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Back Up:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.back_up?.score ?? '-'} ({rec.tests.back_up?.reps ?? 0}x)</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Jongkok:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.jongkok_bangun?.score ?? '-'} ({rec.tests.jongkok_bangun?.reps ?? 0}x)</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Shuttle Run:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.lari_bolak_balik?.score ?? '-'} ({rec.tests.lari_bolak_balik?.reps ?? 0}p)</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex justify-between">
                        <span className="text-slate-400">Step Test:</span>
                        <span className="font-bold text-emerald-400">{rec.tests.naik_turun_tangga?.score ?? '-'} ({rec.tests.naik_turun_tangga?.reps ?? 0}s)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedCardId(isExpanded ? null : rec.id)}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-semibold py-1 cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isExpanded ? 'Tutup Rincian' : 'Lihat 6 Tes'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectRecordToView(rec)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 min-h-[36px] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectRecordToPrint(rec)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-950 text-emerald-300 border border-slate-700 min-h-[36px] flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(rec)}
                      title="Hapus data rekapan siswa ini"
                      className="p-2 rounded-lg text-xs bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
            Belum ada data siswa. Tekan <strong>+ Penilaian Baru</strong>.
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Visible on tablet & desktop) */}
      <div className={`${viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto rounded-xl border border-slate-800 bg-slate-950`}>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-2 text-center w-9">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeFilteredSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                  title="Pilih / Batalkan semua siswa di tabel"
                />
              </th>
              <th className="py-3 px-2 text-center w-10">No</th>
              <th className="py-3 px-3">Nama Siswa</th>
              <th className="py-3 px-2 text-center">Kelas</th>
              <th className="py-3 px-2 text-center">Absen</th>
              <th className="py-3 px-2 text-center">Status</th>
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
                const isChecked = selectedRecordIds.has(rec.id);

                return (
                  <tr 
                    key={rec.id} 
                    className={`transition group ${
                      isChecked ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectRecord(rec.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                        title="Pilih data siswa ini"
                      />
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{rec.student.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({rec.student.gender})</span>
                      </div>
                      {rec.student.examinerName && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[200px]" title={rec.student.examinerName}>
                          Penilai: {rec.student.examinerName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-cyan-300 whitespace-nowrap">
                      {rec.student.studentClass}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300">
                      {rec.student.attendanceNumber}
                    </td>

                    {/* Completion Status */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      {rec.completedTestsCount === 6 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 6/6 Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {rec.completedTestsCount ?? 0}/6 Pos
                        </span>
                      )}
                    </td>

                    {/* 6 Test Scores */}
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
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-slate-700 hover:border-cyan-700 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRecordToPrint(rec)}
                          title="Cetak Lembar Resmi A4 Siswa Ini"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          title="Hapus Data Rekapan Siswa Ini"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition cursor-pointer"
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
                <td colSpan={15} className="py-8 text-center text-slate-500">
                  Belum ada data siswa yang cocok dengan filter. Tekan <strong>+ Penilaian Baru</strong> untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: KONFIRMASI HAPUS SATU DATA REKAPAN SISWA */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black text-white font-['Outfit'] tracking-tight">
                  HAPUS DATA REKAPAN SISWA
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Konfirmasi penghapusan data rekapan penilaian kebugaran jasmani
                </p>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Nama Siswa:</span>
                <span className="font-bold text-white text-sm">{recordToDelete.student.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kelas & Absen:</span>
                <span className="font-semibold text-cyan-300">
                  Kelas {recordToDelete.student.studentClass} • No. {recordToDelete.student.attendanceNumber || '-'} ({recordToDelete.student.gender})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Pengisian:</span>
                <span className="font-semibold text-slate-200">
                  {recordToDelete.completedTestsCount ?? 0} dari 6 Pos Tes Terisi
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nilai Akhir & Predikat:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {recordToDelete.finalScore.toFixed(2)} ({recordToDelete.predicate})
                </span>
              </div>
              {recordToDelete.examinersList && recordToDelete.examinersList.length > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Guru Penilai:</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[220px]" title={recordToDelete.examinersList.join(', ')}>
                    {recordToDelete.examinersList.join(', ')}
                  </span>
                </div>
              )}
              {recordToDelete.sourceRecordIds && recordToDelete.sourceRecordIds.length > 1 && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                  ⚠️ Rekapan ini menggabungkan nilai dari <strong>{recordToDelete.sourceRecordIds.length} pos penilai</strong>. Menghapus data ini akan membersihkan seluruh dokumen sumber pos terkait.
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p>Data penilaian siswa ini akan dihapus secara permanen dari Cloud Firestore dan tidak dapat dikembalikan.</p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer min-h-[38px]"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-single"
                type="button"
                disabled={isDeletingSingle}
                onClick={async () => {
                  setIsDeletingSingle(true);
                  try {
                    await onDeleteRecord(recordToDelete.id, recordToDelete.sourceRecordIds);
                    setSelectedRecordIds((prev) => {
                      const next = new Set(prev);
                      next.delete(recordToDelete.id);
                      return next;
                    });
                    setRecordToDelete(null);
                  } finally {
                    setIsDeletingSingle(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition cursor-pointer min-h-[38px]"
              >
                {isDeletingSingle ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Data Ini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS MASSAL DATA TERPILIH (MULTI-SELECT) */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black text-white font-['Outfit'] tracking-tight">
                  HAPUS {selectedRecordIds.size} DATA REKAPAN TERPILIH
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Konfirmasi penghapusan massal untuk siswa yang Anda centang
                </p>
              </div>
            </div>

            {/* List of Selected Students */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">
                Daftar Siswa yang Akan Dihapus ({selectedRecordIds.size}):
              </span>
              <div className="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {Array.from(selectedRecordIds).map((id) => {
                  const item = baseRecords.find((r) => r.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.student.name}</span>
                        <span className="text-cyan-400 text-[11px]">(Kelas {item.student.studentClass}, Absen {item.student.attendanceNumber})</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">{item.finalScore.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p>
                Data dari {selectedRecordIds.size} siswa ini (termasuk dokumen penggabungan pos terkait) akan dihapus secara permanen dari Cloud Firestore.
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer min-h-[38px]"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-bulk"
                type="button"
                disabled={isDeletingBulk}
                onClick={async () => {
                  setIsDeletingBulk(true);
                  try {
                    const idsArray: string[] = Array.from(selectedRecordIds);
                    const allSourceIds: string[] = [];
                    idsArray.forEach((id: string) => {
                      const rec = baseRecords.find((r) => r.id === id);
                      if (rec?.sourceRecordIds && rec.sourceRecordIds.length > 0) {
                        allSourceIds.push(...rec.sourceRecordIds);
                      } else {
                        allSourceIds.push(id);
                      }
                    });

                    if (onDeleteMultipleRecords) {
                      await onDeleteMultipleRecords(idsArray, allSourceIds);
                    } else {
                      for (const sid of allSourceIds) {
                        await onDeleteRecord(sid);
                      }
                    }
                    setSelectedRecordIds(new Set());
                    setShowBulkDeleteModal(false);
                  } finally {
                    setIsDeletingBulk(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition cursor-pointer min-h-[38px]"
              >
                {isDeletingBulk ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus {selectedRecordIds.size} Siswa Terpilih</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS SEMUA RIWAYAT */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-800/60 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Background Danger Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black text-white font-['Outfit'] tracking-tight">
                  HAPUS RIWAYAT PENILAIAN
                </h3>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  Tindakan ini permanen dan menghapus data dari Cloud Firestore serta memori lokal.
                </p>
              </div>
            </div>

            {/* Target Selection if a specific class is currently filtered */}
            {selectedClass !== 'ALL' && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Pilih Lingkup Data yang Ingin Dihapus:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    deleteTarget === 'class'
                      ? 'bg-rose-950/30 border-rose-500/60 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="deleteTarget"
                      checked={deleteTarget === 'class'}
                      onChange={() => setDeleteTarget('class')}
                      className="accent-rose-500"
                    />
                    <span>Hapus Khusus <strong>Kelas {selectedClass}</strong> Saja ({filteredAndSortedRecords.length} siswa)</span>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    deleteTarget === 'all'
                      ? 'bg-rose-950/30 border-rose-500/60 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="deleteTarget"
                      checked={deleteTarget === 'all'}
                      onChange={() => setDeleteTarget('all')}
                      className="accent-rose-500"
                    />
                    <span>Hapus <strong>Semua Riwayat (Semua Kelas)</strong> ({records.length} siswa)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Warning Details Box */}
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                Data yang akan dihapus:
              </p>
              <p className="text-slate-300">
                {deleteTarget === 'class' && selectedClass !== 'ALL'
                  ? `Sebanyak ${filteredAndSortedRecords.length} siswa dari Kelas ${selectedClass}.`
                  : `Sebanyak ${records.length} data siswa dari seluruh kelas.`}
              </p>
              <p className="text-[11px] text-rose-400 mt-1">
                Data yang sudah dihapus tidak dapat dipulihkan. Pastikan Anda telah mengunduh rekap Excel terlebih dahulu jika diperlukan.
              </p>
            </div>

            {/* Type HAPUS Confirmation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Ketik <strong className="text-rose-400 font-mono">HAPUS</strong> untuk konfirmasi:
                </label>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteWord('HAPUS')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline"
                >
                  Isi Otomatis
                </button>
              </div>
              <input
                id="input-confirm-delete-word"
                type="text"
                value={confirmDeleteWord}
                onChange={(e) => setConfirmDeleteWord(e.target.value)}
                placeholder="Ketik HAPUS di sini..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-sm font-semibold text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer min-h-[38px]"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-all"
                type="button"
                disabled={confirmDeleteWord.trim().toUpperCase() !== 'HAPUS' || isDeletingAll}
                onClick={async () => {
                  setIsDeletingAll(true);
                  try {
                    await onDeleteAllRecords(deleteTarget === 'class' && selectedClass !== 'ALL' ? selectedClass : undefined);
                    setShowDeleteModal(false);
                  } finally {
                    setIsDeletingAll(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition min-h-[38px] ${
                  confirmDeleteWord.trim().toUpperCase() === 'HAPUS' && !isDeletingAll
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 cursor-pointer'
                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
