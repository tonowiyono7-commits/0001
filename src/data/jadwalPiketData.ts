import type { PersonnelRow } from '../sprin/types/sprin';
import type { PersonnelSchedule, PersonnelUnit, ShiftCode } from '../types/dashboard';

export const ANCHOR_YEAR = 2026;
export const ANCHOR_MONTH = 12; // 1-indexed (Desember 2026)
export const ANCHOR_DAY = 1;

export const MIN_YEAR = 2026;
export const MIN_MONTH = 10; // Oktober 2026

export const PIKET_OVERRIDES_STORAGE_KEY = 'keroui_jadwal_piket_overrides_v1';
export const PIKET_TIDAK_PIKET_STORAGE_KEY = 'keroui_jadwal_piket_tidak_piket_v1';

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAY_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAY_FULL_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getDaysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function getDayOfWeek(year: number, month1Based: number, day: number): number {
  return new Date(Date.UTC(year, month1Based - 1, day)).getUTCDay(); // 0 = Sunday
}

export function getDayOffsetFromAnchor(year: number, month1Based: number, day: number): number {
  const targetMs = Date.UTC(year, month1Based - 1, day);
  const anchorMs = Date.UTC(ANCHOR_YEAR, ANCHOR_MONTH - 1, ANCHOR_DAY);
  return Math.round((targetMs - anchorMs) / 86400000);
}

export function makePiketDateKey(personId: string, year: number, month: number, day: number): string {
  return `${personId}:${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getBaseShiftForDate(
  person: PersonnelSchedule,
  year: number,
  month1Based: number,
  day: number
): ShiftCode {
  if (person.dutyMode !== 'roster' || person.cyclePattern.length === 0) {
    return '';
  }
  const offset = getDayOffsetFromAnchor(year, month1Based, day);
  const len = person.cyclePattern.length;
  const idx = ((offset % len) + len) % len;
  return person.cyclePattern[idx];
}

export function loadPiketOverrides(): Record<string, ShiftCode> {
  try {
    const saved = localStorage.getItem(PIKET_OVERRIDES_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, ShiftCode>) : {};
  } catch {
    return {};
  }
}

export function loadTidakPiketMap(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(PIKET_TIDAK_PIKET_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function getEffectivePiketRoster(
  tidakPiketMap: Record<string, boolean> = loadTidakPiketMap()
): PersonnelSchedule[] {
  return INITIAL_JADWAL_PIKET.map((p) => {
    const isTidakPiket = tidakPiketMap[p.id] ?? p.tidakPiket ?? false;
    return {
      ...p,
      tidakPiket: isTidakPiket,
      ket: isTidakPiket ? 'SEMENTARA TIDAK PIKET' : p.ket,
    };
  });
}

export function getEffectiveShiftForDate(
  person: PersonnelSchedule,
  year: number,
  month1Based: number,
  day: number,
  overrides: Record<string, ShiftCode> = loadPiketOverrides()
): ShiftCode {
  const key = makePiketDateKey(person.id, year, month1Based, day);
  if (key in overrides) return overrides[key];
  return getBaseShiftForDate(person, year, month1Based, day);
}

export type PiketSyncPreset =
  | 'piket_aktif'
  | 'piket_dan_pam'
  | 'pam_obvit'
  | 'siang'
  | 'malam'
  | 'cadangan'
  | 'semua';

export interface PiketPersonnelStatus {
  person: PersonnelSchedule;
  shiftCode: ShiftCode;
  badgeText: string;
  sprinKet: string;
  isActivePiket: boolean;
  isPam: boolean;
  isStaff: boolean;
  isCadangan: boolean;
  isTidakPiket: boolean;
}

const SHIFT_DETAIL_LABELS: Record<string, string> = {
  X: 'PIKET 24 JAM',
  S: 'PIKET SIANG (08.00-20.00)',
  M: 'PIKET MALAM (20.00-08.00)',
  P: 'PIKET 24 JAM',
  L: 'LEPAS DINAS',
  C: 'CADANGAN RESKRIM',
  C1: 'CADANGAN 1 INTEL',
  C2: 'CADANGAN 2 INTEL',
};

export function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } | null {
  const [yStr, mStr, dStr] = isoDate.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function formatIndonesianDateForSprin(isoDate: string): {
  dayNameUpper: string;
  dateUpper: string;
  dateTitle: string;
} | null {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return null;
  const { year, month, day } = parts;
  const monthName = MONTH_NAMES_ID[month - 1];
  if (!monthName) return null;
  const dayName = DAY_FULL_ID[getDayOfWeek(year, month, day)] || '';
  return {
    dayNameUpper: dayName.toUpperCase(),
    dateUpper: `${day} ${monthName.toUpperCase()} ${year}`,
    dateTitle: `${day} ${monthName} ${year}`,
  };
}

export function getPiketStatusesForDate(isoDate: string): PiketPersonnelStatus[] {
  const parts = parseIsoDateParts(isoDate);
  const overrides = loadPiketOverrides();
  const effectiveRoster = getEffectivePiketRoster();

  return effectiveRoster.map((person) => {
    const isTidakPiket = Boolean(person.tidakPiket);
    const shiftCode: ShiftCode = parts
      ? getEffectiveShiftForDate(person, parts.year, parts.month, parts.day, overrides)
      : '';

    const isPam = person.dutyMode === 'pam';
    const isStaff = person.dutyMode === 'staff';
    const isPimpinan = person.dutyMode === 'pimpinan';
    const isActiveDutyCode =
      shiftCode === 'X' || shiftCode === 'S' || shiftCode === 'M' || shiftCode === 'P';
    const isCadangan = shiftCode === 'C' || shiftCode === 'C1' || shiftCode === 'C2';
    const isActivePiket = !isTidakPiket && !isPimpinan && isActiveDutyCode;

    let badgeText = '-';
    if (isTidakPiket) {
      badgeText = 'TIDAK PIKET';
    } else if (isPimpinan) {
      badgeText = 'PIMPINAN';
    } else if (isPam) {
      badgeText = 'PAM OBVIT';
    } else if (isStaff) {
      badgeText = 'STAFF';
    } else if (shiftCode) {
      badgeText = shiftCode;
    }

    let sprinKet = '';
    if (isTidakPiket) {
      sprinKet = 'SEMENTARA TIDAK PIKET';
    } else if (isPam) {
      sprinKet = person.ket ? `PAM ${person.ket}` : 'PAM OBVIT';
    } else if (isStaff) {
      sprinKet = person.ket || `${person.unit} (JAM DINAS)`;
    } else if (shiftCode && SHIFT_DETAIL_LABELS[shiftCode]) {
      sprinKet = `${person.unit} (${SHIFT_DETAIL_LABELS[shiftCode]})`;
    } else {
      sprinKet = person.ket || person.unit;
    }

    return {
      person,
      shiftCode,
      badgeText,
      sprinKet,
      isActivePiket,
      isPam,
      isStaff,
      isCadangan,
      isTidakPiket,
    };
  });
}

export function piketStatusToPersonnelRow(status: PiketPersonnelStatus): PersonnelRow {
  return {
    id: `piket-${status.person.id}`,
    nama: status.person.nama,
    pangkat: status.person.pangkat,
    nrp: status.person.nrp,
    jabatan: status.person.jabatan,
    ket: status.sprinKet,
  };
}

export function buildSprinPersonnelFromPiket(
  isoDate: string,
  preset: PiketSyncPreset = 'piket_dan_pam'
): PersonnelRow[] {
  const statuses = getPiketStatusesForDate(isoDate);
  const filtered = statuses.filter((st) => {
    if (st.isTidakPiket && preset !== 'semua') return false;
    switch (preset) {
      case 'piket_aktif':
        return st.isActivePiket;
      case 'piket_dan_pam':
        return st.isActivePiket || st.isPam;
      case 'pam_obvit':
        return st.isPam;
      case 'siang':
        return st.shiftCode === 'S' && !st.isTidakPiket;
      case 'malam':
        return st.shiftCode === 'M' && !st.isTidakPiket;
      case 'cadangan':
        return st.isCadangan && !st.isTidakPiket;
      case 'semua':
        return st.person.dutyMode !== 'pimpinan';
      default:
        return false;
    }
  });
  return filtered.map(piketStatusToPersonnelRow);
}

function fixedOffsetPattern(period: number, activeZeroBasedIdx: number, code: ShiftCode = 'X'): ShiftCode[] {
  return Array.from({ length: period }, (_, idx) => (idx === activeZeroBasedIdx ? code : ''));
}

export const SHIFT_LEGEND: { code: string; title: string; detail: string; color: string; bg: string }[] = [
  { code: 'X', title: 'Piket Pawas & Bhabin', detail: '24 Jam', color: '#b91c1c', bg: '#fef2f2' },
  { code: 'S', title: 'Piket Siang', detail: '12 Jam (08.00 s.d. 20.00)', color: '#0369a1', bg: '#f0f9ff' },
  { code: 'M', title: 'Piket Malam', detail: '12 Jam (20.00 s.d. 08.00)', color: '#4338ca', bg: '#eef2ff' },
  { code: 'P', title: 'Piket Intel & Reskrim', detail: '24 Jam', color: '#15803d', bg: '#f0fdf4' },
  { code: 'L', title: 'Lepas Dinas', detail: 'Istirahat Lepas Piket', color: '#475569', bg: '#f8fafc' },
  { code: 'C', title: 'Cadangan Reskrim', detail: 'Siaga Unit Reskrim', color: '#b45309', bg: '#fffbeb' },
  { code: 'C1', title: 'Cadangan 1 Intel', detail: 'Siaga 1 Unit Intelkam', color: '#9a3412', bg: '#fff7ed' },
  { code: 'C2', title: 'Cadangan 2 Intel', detail: 'Siaga 2 Unit Intelkam', color: '#c2410c', bg: '#ffedd5' },
  { code: 'STAFF', title: 'Jam Dinas', detail: 'Stanby & SIUM', color: '#0f766e', bg: '#f0fdfa' },
  { code: 'PAM OBVIT', title: 'Jam Dinas', detail: 'Jaga Bank / Obvit', color: '#7e22ce', bg: '#faf5ff' },
];

export const UNIT_ORDER: PersonnelUnit[] = [
  'PIMPINAN',
  'PAWAS',
  'SAMAPTA',
  'LANTAS',
  'BHABIN',
  'INTEL',
  'RESKRIM',
  'STANBY',
  'SPK',
  'JAGA BANK',
  'SIUM',
];

// Anchored at 1 Desember 2026 (day offset 0) and projects continuously backward (to Okt 2026) and forward.
export const INITIAL_JADWAL_PIKET: PersonnelSchedule[] = [
  // PIMPINAN
  {
    id: 'pimp-1',
    no: 1,
    unit: 'PIMPINAN',
    nama: 'RISMANTO, S.H., M.H.',
    pangkat: 'KOMPOL',
    nrp: '73020406',
    jabatan: 'KAPOLSEK',
    dutyMode: 'pimpinan',
    cyclePattern: [],
  },
  {
    id: 'pimp-2',
    no: 2,
    unit: 'PIMPINAN',
    nama: 'GINYONO, S.H.',
    pangkat: 'AKP',
    nrp: '70100153',
    jabatan: 'WAKA POLSEK',
    dutyMode: 'pimpinan',
    cyclePattern: [],
  },

  // PAWAS (5-person continuous cycle: 1 Des = Subianto, 2 Des = Tri Sutrisno, 3 Des = Kisworo, 4 Des = Teguh, 5 Des = M. Ali Maghfur)
  {
    id: 'pawas-1',
    no: 1,
    unit: 'PAWAS',
    nama: 'KISWORO, S.H.',
    pangkat: 'IPTU',
    nrp: '71070044',
    jabatan: 'KANIT BINMAS',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(5, 2),
  },
  {
    id: 'pawas-2',
    no: 2,
    unit: 'PAWAS',
    nama: 'TEGUH SANTOSO, S.H., M.M.',
    pangkat: 'IPDA',
    nrp: '83120118',
    jabatan: 'KANIT PROPAM',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(5, 3),
  },
  {
    id: 'pawas-3',
    no: 3,
    unit: 'PAWAS',
    nama: 'M. ALI MAGHFUR, S.H.',
    pangkat: 'IPTU',
    nrp: '74080418',
    jabatan: 'PS. KANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(5, 4),
  },
  {
    id: 'pawas-4',
    no: 4,
    unit: 'PAWAS',
    nama: 'SUBIANTO, S.H.',
    pangkat: 'IPTU',
    nrp: '72100003',
    jabatan: 'KANIT INTELKAM',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(5, 0),
  },
  {
    id: 'pawas-5',
    no: 5,
    unit: 'PAWAS',
    nama: 'DR. TRI SUTRISNO, S.H., M.H.',
    pangkat: 'IPTU',
    nrp: '72050205',
    jabatan: 'KANIT RESKRIM',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(5, 1),
  },

  // SAMAPTA (3-day continuous cycle)
  {
    id: 'samapta-1',
    no: 1,
    unit: 'SAMAPTA',
    nama: 'AGUS PURNOMO',
    pangkat: 'AIPTU',
    nrp: '78081511',
    jabatan: 'PS. PANIT 1 SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'samapta-2',
    no: 2,
    unit: 'SAMAPTA',
    nama: 'SUTADI DWI SETYONO',
    pangkat: 'AIPTU',
    nrp: '82090194',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'samapta-3',
    no: 3,
    unit: 'SAMAPTA',
    nama: 'SINAR EKO PANUNTUN',
    pangkat: 'AIPDA',
    nrp: '84120677',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'samapta-4',
    no: 1,
    unit: 'SAMAPTA',
    nama: 'TONO WIYONO',
    pangkat: 'AIPDA',
    nrp: '80110655',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },
  {
    id: 'samapta-5',
    no: 2,
    unit: 'SAMAPTA',
    nama: 'WARDOYO',
    pangkat: 'AIPDA',
    nrp: '83101282',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },
  {
    id: 'samapta-6',
    no: 1,
    unit: 'SAMAPTA',
    nama: 'FERY EKO SAPUTRO',
    pangkat: 'AIPTU',
    nrp: '84050075',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['L', 'S', 'M'],
  },
  {
    id: 'samapta-7',
    no: 2,
    unit: 'SAMAPTA',
    nama: 'SARWO EDY',
    pangkat: 'AIPDA',
    nrp: '86121201',
    jabatan: 'BANIT SAMAPTA',
    dutyMode: 'roster',
    cyclePattern: ['L', 'S', 'M'],
  },

  // LANTAS (3-day continuous cycle)
  {
    id: 'lantas-1',
    no: 1,
    unit: 'LANTAS',
    nama: 'TAUFIKURRAHMAN',
    pangkat: 'AIPTU',
    nrp: '76040696',
    jabatan: 'PS. PANIT 2 LANTAS',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'lantas-2',
    no: 3,
    unit: 'LANTAS',
    nama: 'ERI SETIAWAN, S.H.',
    pangkat: 'AIPDA',
    nrp: '85081180',
    jabatan: 'BANIT LANTAS',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },
  {
    id: 'lantas-3',
    no: 3,
    unit: 'LANTAS',
    nama: 'ARIEF MUNDRIANTO, S.H.',
    pangkat: 'AIPTU',
    nrp: '82050373',
    jabatan: 'BANIT LANTAS',
    dutyMode: 'roster',
    cyclePattern: ['L', 'S', 'M'],
  },
  {
    id: 'lantas-4',
    no: 4,
    unit: 'LANTAS',
    nama: 'TRIMANTO',
    pangkat: 'AIPTU',
    nrp: '73050517',
    jabatan: 'BANIT LANTAS',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },

  // BHABIN (10-person continuous cycle: 1 Des = A Adi Widyantoro -> ... -> 10 Des = Muslih)
  {
    id: 'bhabin-1',
    no: 1,
    unit: 'BHABIN',
    nama: 'CANDRA MARMESA, SH',
    pangkat: 'AIPDA',
    nrp: '84091212',
    jabatan: 'BHABIN LAMPER TENGAH',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 8),
  },
  {
    id: 'bhabin-2',
    no: 2,
    unit: 'BHABIN',
    nama: 'MUSLIH',
    pangkat: 'AIPDA',
    nrp: '78041138',
    jabatan: 'BHABIN LAMPER KIDUL',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 9),
  },
  {
    id: 'bhabin-3',
    no: 3,
    unit: 'BHABIN',
    nama: 'A ADI WIDYANTORO, SH.',
    pangkat: 'AIPTU',
    nrp: '84030769',
    jabatan: 'BHABIN LAMPER LOR',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 0),
  },
  {
    id: 'bhabin-4',
    no: 4,
    unit: 'BHABIN',
    nama: 'YUDHA SEPTYAWAN',
    pangkat: 'AIPDA',
    nrp: '85090287',
    jabatan: 'BHABIN PETERONGAN',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 1),
  },
  {
    id: 'bhabin-5',
    no: 5,
    unit: 'BHABIN',
    nama: 'I YADI YANTO SUPYAN',
    pangkat: 'AIPTU',
    nrp: '74020269',
    jabatan: 'BHABIN WONODRI',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 2),
  },
  {
    id: 'bhabin-6',
    no: 6,
    unit: 'BHABIN',
    nama: 'SUHARTANTO, S.H.',
    pangkat: 'AIPTU',
    nrp: '80040997',
    jabatan: 'BHABIN PLEBURAN',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 3),
  },
  {
    id: 'bhabin-7',
    no: 7,
    unit: 'BHABIN',
    nama: 'ANDI SETIYANTO',
    pangkat: 'AIPTU',
    nrp: '73120096',
    jabatan: 'BHABIN MUGASARI',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 4),
  },
  {
    id: 'bhabin-8',
    no: 8,
    unit: 'BHABIN',
    nama: 'METRIZAL, SH',
    pangkat: 'AIPTU',
    nrp: '79051605',
    jabatan: 'BHABIN RANDUSARI',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 5),
  },
  {
    id: 'bhabin-9',
    no: 9,
    unit: 'BHABIN',
    nama: 'ACHMAD ARWANI, S.PSI',
    pangkat: 'AIPDA',
    nrp: '86051244',
    jabatan: 'BHABIN BARUSARI',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 6),
  },
  {
    id: 'bhabin-10',
    no: 10,
    unit: 'BHABIN',
    nama: 'EDI BAMBANG MUDIONO',
    pangkat: 'AIPDA',
    nrp: '82120819',
    jabatan: 'BHABIN BULUSTALAN',
    dutyMode: 'roster',
    cyclePattern: fixedOffsetPattern(10, 7),
  },

  // INTEL (4-day continuous cycle)
  {
    id: 'intel-1',
    no: 1,
    unit: 'INTEL',
    nama: 'ANTON RAHARDJO, S.H.',
    pangkat: 'AIPTU',
    nrp: '80100908',
    jabatan: 'PS. PANIT OPSNAL INTEL',
    dutyMode: 'roster',
    cyclePattern: ['C2', 'P', 'L', 'C1'],
  },
  {
    id: 'intel-2',
    no: 2,
    unit: 'INTEL',
    nama: 'HERRY PUSPITA WIJAYA, S.H.',
    pangkat: 'AIPDA',
    nrp: '88040065',
    jabatan: 'BANIT INTEL',
    dutyMode: 'roster',
    cyclePattern: ['P', 'L', 'C1', 'C2'],
  },
  {
    id: 'intel-3',
    no: 3,
    unit: 'INTEL',
    nama: 'ARIS ARDIANSYAH, S.H.',
    pangkat: 'AIPDA',
    nrp: '86020708',
    jabatan: 'PS. PANIT MIN INTEL',
    dutyMode: 'roster',
    cyclePattern: ['L', 'C1', 'C2', 'P'],
  },
  {
    id: 'intel-4',
    no: 4,
    unit: 'INTEL',
    nama: 'HARDIYANTO',
    pangkat: 'AIPTU',
    nrp: '79010899',
    jabatan: 'BANIT INTEL',
    dutyMode: 'roster',
    cyclePattern: ['C1', 'C2', 'P', 'L'],
  },

  // RESKRIM (3-day continuous cycle)
  {
    id: 'reskrim-1',
    no: 1,
    unit: 'RESKRIM',
    nama: 'SUKIJAN',
    pangkat: 'AIPTU',
    nrp: '69010254',
    jabatan: 'PANIT OPSNAL 1 UNIT RESKRIM',
    ket: 'TEAM 1',
    dutyMode: 'roster',
    cyclePattern: ['P', 'L', 'C'],
  },
  {
    id: 'reskrim-2',
    no: 2,
    unit: 'RESKRIM',
    nama: 'AGUNG WITONO',
    pangkat: 'AIPDA',
    nrp: '84121525',
    jabatan: 'BANIT RESKRIM',
    ket: 'TEAM 1',
    dutyMode: 'roster',
    cyclePattern: ['P', 'L', 'C'],
  },
  {
    id: 'reskrim-3',
    no: 1,
    unit: 'RESKRIM',
    nama: 'SINGGIH RIYADI',
    pangkat: 'AIPDA',
    nrp: '83070106',
    jabatan: 'PANIT OPSNAL 2 UNIT RESKRIM',
    ket: 'TEAM 2',
    dutyMode: 'roster',
    cyclePattern: ['L', 'C', 'P'],
  },
  {
    id: 'reskrim-4',
    no: 2,
    unit: 'RESKRIM',
    nama: 'IJMAL AKMAL, S.H.',
    pangkat: 'AIPDA',
    nrp: '85011391',
    jabatan: 'BANIT RESKRIM',
    ket: 'TEAM 2',
    dutyMode: 'roster',
    cyclePattern: ['L', 'C', 'P'],
  },
  {
    id: 'reskrim-5',
    no: 1,
    unit: 'RESKRIM',
    nama: 'BAMBANG TYAS CAHYA YULIANTORO',
    pangkat: 'AIPTU',
    nrp: '81070388',
    jabatan: 'PANIT OPSNAL 3 UNIT RESKRIM',
    ket: 'TEAM 3',
    dutyMode: 'roster',
    cyclePattern: ['C', 'P', 'L'],
  },
  {
    id: 'reskrim-6',
    no: 2,
    unit: 'RESKRIM',
    nama: 'EKO PRIYANTO, S.H.',
    pangkat: 'AIPTU',
    nrp: '81050986',
    jabatan: 'BANIT RESKRIM',
    ket: 'TEAM 3',
    dutyMode: 'roster',
    cyclePattern: ['C', 'P', 'L'],
  },

  // STANBY
  {
    id: 'stanby-1',
    no: 1,
    unit: 'STANBY',
    nama: 'ACHMAD TAUFIK, SH',
    pangkat: 'AIPDA',
    nrp: '85020792',
    jabatan: 'BANIT INTEL',
    ket: 'SKCK',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-2',
    no: 2,
    unit: 'STANBY',
    nama: 'MUNIFATUL LUTFIAH',
    pangkat: 'BRIGADIR',
    nrp: '95100760',
    jabatan: 'BANIT BINMAS',
    ket: 'STAFF BINMAS',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-3',
    no: 3,
    unit: 'STANBY',
    nama: 'ANDI WIBAWA',
    pangkat: 'AIPDA',
    nrp: '84081372',
    jabatan: 'PS. PANIT 1 LANTAS',
    ket: 'STAFF LANTAS',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-4',
    no: 4,
    unit: 'STANBY',
    nama: 'DEDY SETYO WIDODO',
    pangkat: 'AIPDA',
    nrp: '84120839',
    jabatan: 'BANIT PROPAM',
    ket: 'STAFF PROPAM',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-5',
    no: 5,
    unit: 'STANBY',
    nama: 'DODIK EKO ARIPRABOWO, S.H.',
    pangkat: 'AIPDA',
    nrp: '85061749',
    jabatan: 'PS. PANIT 2 BINMAS',
    ket: 'STAFF BINMAS',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-6',
    no: 6,
    unit: 'STANBY',
    nama: 'AGUS PRASTYANTO',
    pangkat: 'AIPTU',
    nrp: '79021084',
    jabatan: 'PS. KASI HUMAS',
    ket: 'STAFF SI HUMAS',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-7',
    no: 7,
    unit: 'STANBY',
    nama: 'JATMIKO NUR P, S.H.',
    pangkat: 'AIPDA',
    nrp: '84051714',
    jabatan: 'PS. PANIT 2 SAMAPTA',
    ket: 'STAFF SAMAPTA',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'stanby-8',
    no: 8,
    unit: 'STANBY',
    nama: 'AHMAD SOKI',
    pangkat: 'AIPTU',
    nrp: '75050022',
    jabatan: 'PS. PANIT 3 SAMAPTA',
    ket: 'STAFF SAMAPTA',
    dutyMode: 'staff',
    cyclePattern: [],
  },

  // SPK (3-day continuous cycle)
  {
    id: 'spk-1',
    no: 1,
    unit: 'SPK',
    nama: 'SYAIFUL BAHRI, S.H.',
    pangkat: 'AIPTU',
    nrp: '80030582',
    jabatan: 'PS. KA SPKT 1',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'spk-2',
    no: 2,
    unit: 'SPK',
    nama: 'HENGKI SETIAJI WIBOWO',
    pangkat: 'AIPDA',
    nrp: '87110151',
    jabatan: 'BAMIN SPK',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'spk-3',
    no: 3,
    unit: 'SPK',
    nama: 'WAHYU ARIEF SETIAJI',
    pangkat: 'BRIPKA',
    nrp: '87070766',
    jabatan: 'BAMIN SPKT',
    dutyMode: 'roster',
    cyclePattern: ['S', 'M', 'L'],
  },
  {
    id: 'spk-4',
    no: 1,
    unit: 'SPK',
    nama: 'BANGUN WASKITO, S.H.',
    pangkat: 'AIPTU',
    nrp: '83070934',
    jabatan: 'PS. KA SPKT 2',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },
  {
    id: 'spk-5',
    no: 2,
    unit: 'SPK',
    nama: 'WIWIK HARYANTO',
    pangkat: 'BRIPKA',
    nrp: '77070917',
    jabatan: 'BAMIN SPKT',
    dutyMode: 'roster',
    cyclePattern: ['M', 'L', 'S'],
  },
  {
    id: 'spk-6',
    no: 1,
    unit: 'SPK',
    nama: 'M. TOFIQ HIDAYAT, S.H.',
    pangkat: 'AIPDA',
    nrp: '85041815',
    jabatan: 'PS. KA SPKT 3',
    dutyMode: 'roster',
    cyclePattern: ['L', 'S', 'M'],
  },
  {
    id: 'spk-7',
    no: 2,
    unit: 'SPK',
    nama: 'AFIF YUDHA PRATAMA',
    pangkat: 'BRIPTU',
    nrp: '97040637',
    jabatan: 'BAMIN SPKT',
    dutyMode: 'roster',
    cyclePattern: ['L', 'S', 'M'],
  },

  // JAGA BANK
  {
    id: 'bank-1',
    no: 1,
    unit: 'JAGA BANK',
    nama: 'ADI GESIT SATATA',
    pangkat: 'AIPTU',
    nrp: '72120148',
    jabatan: 'BANIT SAMAPTA',
    ket: 'KOSPIN JASA',
    dutyMode: 'pam',
    cyclePattern: [],
  },
  {
    id: 'bank-2',
    no: 2,
    unit: 'JAGA BANK',
    nama: 'PURBO DWI LAKSONO',
    pangkat: 'AIPDA',
    nrp: '84091593',
    jabatan: 'BANIT SAMAPTA',
    ket: 'MANDIRI TASPEN',
    dutyMode: 'pam',
    cyclePattern: [],
  },
  {
    id: 'bank-3',
    no: 3,
    unit: 'JAGA BANK',
    nama: 'SUPRIYATNO',
    pangkat: 'AIPDA',
    nrp: '72100456',
    jabatan: 'BANIT SAMAPTA',
    ket: 'BANK JATENG',
    dutyMode: 'pam',
    cyclePattern: [],
  },

  // SIUM
  {
    id: 'sium-1',
    no: 1,
    unit: 'SIUM',
    nama: 'ALI MAHFUD',
    pangkat: 'AIPTU',
    nrp: '79081059',
    jabatan: 'PS. KASIUM',
    ket: 'STAFF SIUM',
    dutyMode: 'staff',
    cyclePattern: [],
  },
  {
    id: 'sium-2',
    no: 2,
    unit: 'SIUM',
    nama: 'YUNI KURNIA HAPSARI, S.H.',
    pangkat: 'PENGATUR',
    nrp: '197906252014122001',
    jabatan: 'BANUM SIUM',
    ket: 'STAFF SIUM',
    dutyMode: 'staff',
    cyclePattern: [],
  },
];
