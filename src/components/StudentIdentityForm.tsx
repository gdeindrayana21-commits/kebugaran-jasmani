import React from 'react';
import { User, School, Hash, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { StudentInfo, Gender } from '../types';
import { CLASS_OPTIONS, DEFAULT_TEACHER_NAME } from '../constants/fitnessTests';
import { sound } from '../utils/soundEffects';

interface StudentIdentityFormProps {
  student: StudentInfo;
  setStudent: React.Dispatch<React.SetStateAction<StudentInfo>>;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  onResetStudent: () => void;
  completedTestsCount: number;
}

export const StudentIdentityForm: React.FC<StudentIdentityFormProps> = ({
  student,
  setStudent,
  isLocked,
  setIsLocked,
  onResetStudent,
  completedTestsCount,
}) => {
  const isNameFilled = student.name.trim().length > 0;
  const isClassFilled = student.studentClass.trim().length > 0;
  const isAbsenFilled = student.attendanceNumber.trim().length > 0;
  const isFormValid = isNameFilled && isClassFilled && isAbsenFilled;

  const handleStartAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameFilled) {
      alert('Nama Siswa wajib diisi sebelum melakukan penilaian!');
      return;
    }
    if (!isClassFilled) {
      alert('Silakan pilih Kelas siswa!');
      return;
    }
    if (!isAbsenFilled) {
      alert('Silakan masukkan Nomor Absen siswa!');
      return;
    }
    setIsLocked(true);
    sound.playStart();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Sporty Glow Accent at Top Corner */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header of Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              IDENTITAS SISWA & PENILAI
              {isLocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sesi Siap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Wajib Diisi
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Pastikan data peserta didik sudah sesuai sebelum mencatat repetisi tes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isLocked ? (
            <button
              id="btn-edit-identity"
              type="button"
              onClick={() => setIsLocked(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Ubah Data
            </button>
          ) : (
            <button
              id="btn-quick-fill-sample"
              type="button"
              onClick={() => {
                setStudent({
                  name: 'I Putu Arya Wibawa',
                  studentClass: 'X.1',
                  attendanceNumber: '08',
                  gender: 'L',
                  examinerName: DEFAULT_TEACHER_NAME,
                  testDate: new Date().toISOString().split('T')[0],
                });
                sound.playTick();
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Contoh Data
            </button>
          )}

          <button
            id="btn-reset-student"
            type="button"
            onClick={onResetStudent}
            title="Kosongkan form untuk siswa baru"
            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-800/60 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/60 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Fields Grid */}
      <form onSubmit={handleStartAssessment} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nama Siswa */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Nama Siswa <span className="text-rose-400">*</span>
              </span>
              {!isNameFilled && <span className="text-[10px] text-rose-400 lowercase font-normal">wajib</span>}
            </label>
            <input
              id="input-student-name"
              type="text"
              required
              disabled={isLocked}
              value={student.name}
              onChange={(e) => setStudent({ ...student, name: e.target.value })}
              placeholder="Ketik nama lengkap siswa..."
              className={`w-full px-3.5 py-2.5 bg-slate-950/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                !isNameFilled
                  ? 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-emerald-500/50 bg-slate-950'
              } ${isLocked ? 'opacity-80 cursor-not-allowed bg-slate-950/60' : ''}`}
            />
          </div>

          {/* Pilihan Kelas X.1 - X.8 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-cyan-400" />
                Kelas <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-400">Pilih X.1 – X.8</span>
            </label>
            <select
              id="select-student-class"
              required
              disabled={isLocked}
              value={student.studentClass}
              onChange={(e) => setStudent({ ...student, studentClass: e.target.value })}
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition ${
                student.studentClass ? 'border-cyan-500/50 text-cyan-300' : 'border-slate-700'
              } ${isLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <option value="" disabled>-- Pilih Kelas --</option>
              {CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* No Absen */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              No. Absen <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-attendance-no"
              type="number"
              min="1"
              max="50"
              required
              disabled={isLocked}
              value={student.attendanceNumber}
              onChange={(e) => setStudent({ ...student, attendanceNumber: e.target.value })}
              placeholder="Contoh: 12"
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition ${
                student.attendanceNumber ? 'border-amber-500/50' : 'border-slate-700'
              } ${isLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-gender-male"
                type="button"
                disabled={isLocked}
                onClick={() => setStudent({ ...student, gender: 'L' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  student.gender === 'L'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-900/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                } ${isLocked ? 'cursor-not-allowed' : ''}`}
              >
                <span>👦 Laki-laki (L)</span>
              </button>
              <button
                id="btn-gender-female"
                type="button"
                disabled={isLocked}
                onClick={() => setStudent({ ...student, gender: 'P' })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  student.gender === 'P'
                    ? 'bg-pink-600/30 border-pink-500 text-pink-300 shadow-md shadow-pink-900/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                } ${isLocked ? 'cursor-not-allowed' : ''}`}
              >
                <span>👧 Perempuan (P)</span>
              </button>
            </div>
          </div>

          {/* Tanggal Tes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tanggal Tes
            </label>
            <input
              id="input-test-date"
              type="date"
              disabled={isLocked}
              value={student.testDate}
              onChange={(e) => setStudent({ ...student, testDate: e.target.value })}
              className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 ${
                isLocked ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Nama Guru Penilai */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Nama Penilai
            </label>
            <input
              id="input-examiner-name"
              type="text"
              disabled={isLocked}
              value={student.examinerName}
              onChange={(e) => setStudent({ ...student, examinerName: e.target.value })}
              placeholder="Nama Guru Penilai..."
              className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                isLocked ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Start Assessment Button / Locked Confirmation Banner */}
        {!isLocked ? (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Tekan tombol di bawah untuk mengunci identitas dan memulai 6 rangkaian tes</span>
            </div>

            <button
              id="btn-lock-and-start"
              type="submit"
              disabled={!isFormValid}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                isFormValid
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25 cursor-pointer transform hover:-translate-y-0.5'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              + MULAI PENILAIAN
            </button>
          </div>
        ) : (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-white">{student.name}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-cyan-300">Kelas {student.studentClass}</span>
              <span className="text-slate-400">Absen: <strong className="text-white">{student.attendanceNumber}</strong></span>
              <span className="text-slate-400">({student.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-slate-400 text-[11px]">Progres Tes: </span>
                <strong className="text-emerald-400 font-bold">{completedTestsCount}/6 Selesai</strong>
              </div>
              <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${(completedTestsCount / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
