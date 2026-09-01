import * as XLSX from 'xlsx';
import { AssessmentRecord } from '../types';

export function exportRecordsToExcel(records: AssessmentRecord[], filename = 'Rekap_Nilai_PJOK_KelasX_SMAN1Tejakula') {
  if (!records || records.length === 0) {
    alert('Tidak ada data untuk didownload');
    return;
  }

  const rows = records.map((rec) => {
    return {
      'Timestamp': new Date(rec.timestamp).toLocaleString('id-ID'),
      'Nama Penilai': rec.student.examinerName || '',
      'Nama Siswa': rec.student.name,
      'Kelas': rec.student.studentClass,
      'No. Absen': rec.student.attendanceNumber,
      'Jenis Kelamin': rec.student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Tanggal': rec.student.testDate,
      
      'Push Up – jumlah': rec.tests.push_up?.reps ?? 0,
      'Push Up – waktu': rec.tests.push_up?.timeFormatted ?? '00:00',
      'Push Up – nilai': rec.tests.push_up?.score ?? 0,

      'Sit Up – jumlah': rec.tests.sit_up?.reps ?? 0,
      'Sit Up – waktu': rec.tests.sit_up?.timeFormatted ?? '00:00',
      'Sit Up – nilai': rec.tests.sit_up?.score ?? 0,

      'Back Up – jumlah': rec.tests.back_up?.reps ?? 0,
      'Back Up – waktu': rec.tests.back_up?.timeFormatted ?? '00:00',
      'Back Up – nilai': rec.tests.back_up?.score ?? 0,

      'Jongkok Bangun – jumlah': rec.tests.jongkok_bangun?.reps ?? 0,
      'Jongkok Bangun – waktu': rec.tests.jongkok_bangun?.timeFormatted ?? '00:00',
      'Jongkok Bangun – nilai': rec.tests.jongkok_bangun?.score ?? 0,

      'Lari Bolak-Balik – jumlah': rec.tests.lari_bolak_balik?.reps ?? 0,
      'Lari Bolak-Balik – waktu': rec.tests.lari_bolak_balik?.timeFormatted ?? '00:00',
      'Lari Bolak-Balik – nilai': rec.tests.lari_bolak_balik?.score ?? 0,

      'Naik Turun Tangga – jumlah': rec.tests.naik_turun_tangga?.reps ?? 0,
      'Naik Turun Tangga – waktu': rec.tests.naik_turun_tangga?.timeFormatted ?? '00:00',
      'Naik Turun Tangga – nilai': rec.tests.naik_turun_tangga?.score ?? 0,

      'Total Nilai': rec.totalScore,
      'Nilai Akhir': rec.finalScore,
      'Predikat': rec.predicate,
      'Catatan Guru': rec.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 14),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai PJOK');

  const fullFilename = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

export function exportSingleRecordToExcel(record: AssessmentRecord) {
  exportRecordsToExcel([record], `Nilai_PJOK_${record.student.name.replace(/\s+/g, '_')}_${record.student.studentClass}`);
}

// Google Sheets / Apps Script Webhook payload generator
export function prepareGoogleSheetsPayload(record: AssessmentRecord) {
  return {
    timestamp: record.timestamp,
    examiner: record.student.examinerName,
    studentName: record.student.name,
    studentClass: record.student.studentClass,
    attendanceNo: record.student.attendanceNumber,
    gender: record.student.gender,
    date: record.student.testDate,
    pushUpReps: record.tests.push_up?.reps ?? 0,
    pushUpTime: record.tests.push_up?.timeFormatted ?? '00:00',
    pushUpScore: recTestScore(record, 'push_up'),
    sitUpReps: record.tests.sit_up?.reps ?? 0,
    sitUpTime: record.tests.sit_up?.timeFormatted ?? '00:00',
    sitUpScore: recTestScore(record, 'sit_up'),
    backUpReps: record.tests.back_up?.reps ?? 0,
    backUpTime: record.tests.back_up?.timeFormatted ?? '00:00',
    backUpScore: recTestScore(record, 'back_up'),
    squatReps: record.tests.jongkok_bangun?.reps ?? 0,
    squatTime: record.tests.jongkok_bangun?.timeFormatted ?? '00:00',
    squatScore: recTestScore(record, 'jongkok_bangun'),
    shuttleReps: record.tests.lari_bolak_balik?.reps ?? 0,
    shuttleTime: record.tests.lari_bolak_balik?.timeFormatted ?? '00:00',
    shuttleScore: recTestScore(record, 'lari_bolak_balik'),
    stepReps: record.tests.naik_turun_tangga?.reps ?? 0,
    stepTime: record.tests.naik_turun_tangga?.timeFormatted ?? '00:00',
    stepScore: recTestScore(record, 'naik_turun_tangga'),
    totalScore: record.totalScore,
    finalScore: record.finalScore,
    predicate: record.predicate,
    notes: record.notes || '',
  };
}

function recTestScore(record: AssessmentRecord, key: keyof AssessmentRecord['tests']): number {
  return record.tests[key]?.score ?? 0;
}
