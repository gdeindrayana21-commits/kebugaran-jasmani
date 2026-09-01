import { FitnessTestType, TestConfig, ScoreBenchmark, PredicateInfo } from '../types';

export const DEFAULT_TEACHER_NAME = 'Gde Bayu Indrayana, S.Pd.';
export const DEFAULT_SCHOOL_NAME = 'SMA NEGERI 1 TEJAKULA';
export const DEFAULT_SUBJECT = 'PJOK';
export const DEFAULT_GRADE = 'X';
export const DEFAULT_TOPIC = 'Kebugaran Jasmani';

export const CLASS_OPTIONS = [
  'X.1',
  'X.2',
  'X.3',
  'X.4',
  'X.5',
  'X.6',
  'X.7',
  'X.8',
] as const;

export const FITNESS_TESTS: TestConfig[] = [
  {
    id: 'push_up',
    number: 1,
    title: 'TES 1 – PUSH UP',
    shortTitle: 'Push Up',
    unit: 'kali',
    targetMuscles: 'Kekuatan & Ketahanan Otot Lengan & Dada',
    description: 'Mengukur kekuatan dan daya tahan otot dada, bahu, dan trisep.',
    techniqueTips: [
      'Posisi badan lurus dari kepala hingga tumit.',
      'Turunkan badan hingga siku membentuk sudut 90 derajat.',
      'Dorong kembali ke posisi awal dengan siku lurus.'
    ],
    defaultDurationSeconds: 15,
    defaultBenchmarks: [
      { min: 0, max: 5, score: 50 },
      { min: 6, max: 10, score: 60 },
      { min: 11, max: 15, score: 70 },
      { min: 16, max: 20, score: 80 },
      { min: 21, max: 25, score: 90 },
      { min: 26, max: null, score: 100 },
    ],
  },
  {
    id: 'sit_up',
    number: 2,
    title: 'TES 2 – SIT UP',
    shortTitle: 'Sit Up',
    unit: 'kali',
    targetMuscles: 'Kekuatan & Ketahanan Otot Perut (Abdominal)',
    description: 'Mengukur kekuatan dan daya tahan otot perut serta fleksor panggul.',
    techniqueTips: [
      'Berbaring telentang, kedua lutut ditekuk sekitar 90 derajat.',
      'Kedua tangan di belakang kepala atau menyilang di dada.',
      'Angkat badan hingga siku menyentuh lutut, lalu turunkan kembali.'
    ],
    defaultDurationSeconds: 15,
    defaultBenchmarks: [
      { min: 0, max: 5, score: 50 },
      { min: 6, max: 10, score: 60 },
      { min: 11, max: 15, score: 70 },
      { min: 16, max: 20, score: 80 },
      { min: 21, max: 25, score: 90 },
      { min: 26, max: null, score: 100 },
    ],
  },
  {
    id: 'back_up',
    number: 3,
    title: 'TES 3 – BACK UP',
    shortTitle: 'Back Up',
    unit: 'kali',
    targetMuscles: 'Kekuatan & Ketahanan Otot Punggung (Erector Spinae)',
    description: 'Mengukur kekuatan dan fleksibilitas otot punggung serta pinggang.',
    techniqueTips: [
      'Posisi tubuh tengkurap dengan tangan di belakang kepala.',
      'Kaki lurus dan ditahan teman atau di matras.',
      'Angkat dada dan kepala ke atas setinggi mungkin lalu turunkan.'
    ],
    defaultDurationSeconds: 15,
    defaultBenchmarks: [
      { min: 0, max: 5, score: 50 },
      { min: 6, max: 10, score: 60 },
      { min: 11, max: 15, score: 70 },
      { min: 16, max: 20, score: 80 },
      { min: 21, max: 25, score: 90 },
      { min: 26, max: null, score: 100 },
    ],
  },
  {
    id: 'jongkok_bangun',
    number: 4,
    title: 'TES 4 – JONGKOK BANGUN',
    shortTitle: 'Jongkok Bangun',
    unit: 'kali',
    targetMuscles: 'Kekuatan Tungkai & Kelincahan (Squat Thrust/Stand)',
    description: 'Mengukur kekuatan otot paha, tungkai kaki, dan koordinasi motorik.',
    techniqueTips: [
      'Mulai dari posisi berdiri tegak.',
      'Jongkok penuh dengan kedua tangan menyentuh lantai.',
      'Bangkit kembali berdiri tegak dengan sempurna.'
    ],
    defaultDurationSeconds: 15,
    defaultBenchmarks: [
      { min: 0, max: 5, score: 50 },
      { min: 6, max: 10, score: 60 },
      { min: 11, max: 15, score: 70 },
      { min: 16, max: 20, score: 80 },
      { min: 21, max: 25, score: 90 },
      { min: 26, max: null, score: 100 },
    ],
  },
  {
    id: 'lari_bolak_balik',
    number: 5,
    title: 'TES 5 – LARI BOLAK-BALIK',
    shortTitle: 'Lari Bolak-Balik',
    unit: 'putaran',
    targetMuscles: 'Kelincahan & Kecepatan (Shuttle Run)',
    description: 'Mengukur kelincahan dan kecepatan berpindah arah (jarak 4x10m atau garis tanda).',
    techniqueTips: [
      'Start dari belakang garis start.',
      'Lari secepatnya menuju garis seberang dan menyentuh garis/memindahkan bola/kayu.',
      'Balik arah ke garis awal terhitung 1 putaran penuh.'
    ],
    defaultDurationSeconds: 30,
    defaultBenchmarks: [
      { min: 0, max: 2, score: 50 },
      { min: 3, max: 4, score: 60 },
      { min: 5, max: 6, score: 70 },
      { min: 7, max: 8, score: 80 },
      { min: 9, max: 10, score: 90 },
      { min: 11, max: null, score: 100 },
    ],
  },
  {
    id: 'naik_turun_tangga',
    number: 6,
    title: 'TES 6 – NAIK TURUN TANGGA',
    shortTitle: 'Naik Turun Tangga',
    unit: 'siklus',
    targetMuscles: 'Daya Tahan Kardiorespiratori & Tungkai (Step Test)',
    description: 'Mengukur daya tahan jantung-paru dan kekuatan otot kaki saat melangkah konstan.',
    techniqueTips: [
      'Naikkan kaki kanan lalu kaki kiri ke atas bangku/tangga.',
      'Turunkan kaki kanan lalu kaki kiri kembali ke lantai.',
      'Pertahankan ritme gerakan yang teratur dan aman.'
    ],
    defaultDurationSeconds: 30,
    defaultBenchmarks: [
      { min: 0, max: 5, score: 50 },
      { min: 6, max: 10, score: 60 },
      { min: 11, max: 15, score: 70 },
      { min: 16, max: 20, score: 80 },
      { min: 21, max: 25, score: 90 },
      { min: 26, max: null, score: 100 },
    ],
  },
];

export const PREDICATES: PredicateInfo[] = [
  {
    name: 'SANGAT BAIK',
    minScore: 90,
    maxScore: 100,
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
  },
  {
    name: 'BAIK',
    minScore: 80,
    maxScore: 89.99,
    colorClass: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500',
  },
  {
    name: 'CUKUP',
    minScore: 70,
    maxScore: 79.99,
    colorClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500',
  },
  {
    name: 'KURANG',
    minScore: 60,
    maxScore: 69.99,
    colorClass: 'text-orange-400',
    badgeBg: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
  },
  {
    name: 'SANGAT KURANG',
    minScore: 0,
    maxScore: 59.99,
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500',
  },
];
