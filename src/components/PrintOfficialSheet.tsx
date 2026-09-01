import React from 'react';
import { AssessmentRecord } from '../types';
import { FITNESS_TESTS, DEFAULT_SCHOOL_NAME, DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { exportSingleRecordToExcel } from '../utils/exportUtils';

interface PrintOfficialSheetProps {
  record: AssessmentRecord;
  onBack: () => void;
}

export const PrintOfficialSheet: React.FC<PrintOfficialSheetProps> = ({
  record,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(record.student.testDate || record.timestamp).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-3 sm:px-6">
      {/* Top Toolbar (Hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Aplikasi
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportSingleRecordToExcel(record)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Download Excel Siswa Ini
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Dokumen Sekarang (A4 / PDF)
          </button>
        </div>
      </div>

      {/* Official A4 Sheet Layout Container */}
      <div 
        id="official-print-document"
        className="max-w-3xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-300 font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:text-black"
        style={{ minHeight: '297mm' }}
      >
        {/* KOP SURAT RESMI SEKOLAH */}
        <div className="border-b-4 border-double border-black pb-4 mb-6 text-center">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-700">
            PEMERINTAH PROVINSI BALI • DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase text-black font-['Outfit'] mt-0.5">
            {DEFAULT_SCHOOL_NAME}
          </h1>
          <p className="text-xs text-slate-600">
            Jl. Singaraja - Amlapura, Tejakula, Kec. Tejakula, Kabupaten Buleleng, Bali 81173
          </p>
          <div className="mt-3 pt-2 border-t border-slate-300">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-black">
              LEMBAR HASIL PENILAIAN PRAKTIK PJOK
            </h2>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              MATERI: TES KEBUGARAN JASMANI • KELAS X
            </p>
          </div>
        </div>

        {/* IDENTITAS SISWA */}
        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:border-slate-400">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
            I. IDENTITAS PESERTA DIDIK
          </h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-xs sm:text-sm">
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Nama Siswa</span>
              <span className="font-bold text-black">: {record.student.name}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Kelas</span>
              <span className="font-bold text-black">: {record.student.studentClass}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Nomor Absen</span>
              <span className="font-bold text-black">: {record.student.attendanceNumber}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Jenis Kelamin</span>
              <span className="font-bold text-black">
                : {record.student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Tanggal Penilaian</span>
              <span className="font-bold text-black">: {formattedDate}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-slate-700">Mata Pelajaran</span>
              <span className="font-bold text-black">: Pendidikan Jasmani, Olahraga, &amp; Kesehatan</span>
            </div>
          </div>
        </div>

        {/* TABEL HASIL 6 TES */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
            II. HASIL PENGUKURAN DAN PENILAIAN TES KEBUGARAN JASMANI
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-black">
            <thead>
              <tr className="bg-slate-200 border-b border-black text-black font-bold uppercase text-[11px] print:bg-slate-100">
                <th className="border border-black p-2 text-center w-10">No</th>
                <th className="border border-black p-2">Item Tes Kebugaran</th>
                <th className="border border-black p-2">Aspek Komponen Fisik</th>
                <th className="border border-black p-2 text-center">Jumlah Gerakan</th>
                <th className="border border-black p-2 text-center">Waktu</th>
                <th className="border border-black p-2 text-center">Nilai (0-100)</th>
                <th className="border border-black p-2 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {FITNESS_TESTS.map((test, idx) => {
                const res = record.tests[test.id];
                return (
                  <tr key={test.id} className="border-b border-black">
                    <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-black p-2 font-bold">{test.shortTitle}</td>
                    <td className="border border-black p-2 text-slate-700">{test.targetMuscles}</td>
                    <td className="border border-black p-2 text-center font-bold">
                      {res?.reps ?? '-'} {res?.reps !== null ? test.unit : ''}
                    </td>
                    <td className="border border-black p-2 text-center font-mono">{res?.timeFormatted ?? '-'}</td>
                    <td className="border border-black p-2 text-center font-black font-mono text-sm">
                      {res?.score ?? '-'}
                    </td>
                    <td className="border border-black p-2 text-center font-bold uppercase text-[11px]">
                      {res?.predicate ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black bg-slate-100 print:bg-transparent font-bold">
                <td colSpan={5} className="border border-black p-2 text-right uppercase">
                  TOTAL NILAI (6 ITEM TES):
                </td>
                <td className="border border-black p-2 text-center text-sm font-black font-mono">
                  {record.totalScore}
                </td>
                <td className="border border-black p-2 text-center text-[10px] text-slate-700">
                  Maks: 600
                </td>
              </tr>
              <tr className="border-t-2 border-black bg-slate-200 print:bg-slate-100 font-extrabold">
                <td colSpan={5} className="border border-black p-2.5 text-right uppercase text-sm">
                  NILAI AKHIR (TOTAL ÷ 6):
                </td>
                <td className="border border-black p-2.5 text-center text-base font-black font-mono">
                  {record.finalScore.toFixed(2)}
                </td>
                <td className="border border-black p-2.5 text-center font-black text-xs uppercase">
                  {record.predicate}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CATATAN GURU */}
        <div className="mb-8 p-3 rounded border border-slate-300 print:border-black text-xs">
          <p className="font-bold text-slate-800 uppercase mb-1">Catatan Guru / Evaluasi Penilai:</p>
          <p className="italic text-slate-700">
            {record.notes ? `"${record.notes}"` : 'Siswa telah melaksanakan rangkaian tes kebugaran jasmani dengan tertib dan mematuhi kaidah keselamatan berolahraga.'}
          </p>
        </div>

        {/* TANDA TANGAN DAN PENGESAHAN */}
        <div className="grid grid-cols-2 gap-8 pt-4 text-xs sm:text-sm">
          <div className="text-center">
            <p className="text-slate-600 mb-16">Mengetahui,<br />Orang Tua / Wali Siswa</p>
            <p className="font-bold border-t border-dotted border-slate-500 pt-1 inline-block min-w-[160px]">
              ( .................................................. )
            </p>
          </div>

          <div className="text-center">
            <p className="text-slate-600 mb-1">
              Tejakula, {formattedDate}
            </p>
            <p className="text-slate-600 mb-16">
              Guru Mata Pelajaran PJOK,
            </p>
            <p className="font-extrabold text-black underline tracking-wide">
              {record.student.examinerName || DEFAULT_TEACHER_NAME}
            </p>
            <p className="text-[11px] text-slate-600">NIP. Guru Pengampu PJOK SMAN 1 Tejakula</p>
          </div>
        </div>

        {/* Footer info stamp note */}
        <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between print:mt-12">
          <span>Dicetak otomatis melalui Aplikasi Penilaian PJOK Kelas X SMAN 1 Tejakula</span>
          <span>Dokumen Resmi Penilaian Kebugaran Jasmani</span>
        </div>
      </div>
    </div>
  );
};
