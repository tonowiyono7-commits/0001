import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Printer,
  RotateCcw,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import {
  DAY_SHORT_ID,
  MIN_MONTH,
  MIN_YEAR,
  MONTH_NAMES_ID,
  PIKET_OVERRIDES_STORAGE_KEY,
  PIKET_TIDAK_PIKET_STORAGE_KEY,
  SHIFT_LEGEND,
  UNIT_ORDER,
  getBaseShiftForDate,
  getDayOfWeek,
  getDaysInMonth,
  getEffectivePiketRoster,
  makePiketDateKey,
} from '../data/jadwalPiketData';
import type { PersonnelSchedule, PersonnelUnit, ShiftCode } from '../types/dashboard';

const SHIFT_CYCLE: ShiftCode[] = ['', 'X', 'S', 'M', 'P', 'L', 'C', 'C1', 'C2'];

const QUICK_MONTHS = [
  { year: 2026, month: 10, label: 'Okt 2026' },
  { year: 2026, month: 11, label: 'Nov 2026' },
  { year: 2026, month: 12, label: 'Des 2026' },
  { year: 2027, month: 1, label: 'Jan 2027' },
  { year: 2027, month: 2, label: 'Feb 2027' },
  { year: 2027, month: 3, label: 'Mar 2027' },
];

function getShiftStyle(code: ShiftCode, isTidakPiket?: boolean): string {
  if (isTidakPiket && code === 'X') {
    return 'bg-rose-100 text-rose-700 border border-rose-300 line-through';
  }
  switch (code) {
    case 'X':
      return 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
    case 'S':
      return 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold';
    case 'M':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold';
    case 'P':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    case 'L':
      return 'bg-slate-100 text-slate-500 border border-slate-200/80';
    case 'C':
      return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
    case 'C1':
      return 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold';
    case 'C2':
      return 'bg-orange-100/80 text-orange-800 border border-orange-300 font-semibold';
    default:
      return 'text-slate-300';
  }
}

interface JadwalPiketViewProps {
  onCreateSprinFromPiket?: (isoDate: string) => void;
}

export const JadwalPiketView: React.FC<JadwalPiketViewProps> = ({ onCreateSprinFromPiket }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // November 2026 (current month)
  const [selectedDay, setSelectedDay] = useState<number>(21); // 21 November 2026

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<'ALL' | PersonnelUnit>('ALL');
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'ON_DUTY' | ShiftCode>('ALL');
  const [editMode, setEditMode] = useState(false);

  const [overrides, setOverrides] = useState<Record<string, ShiftCode>>(() => {
    try {
      const saved = localStorage.getItem(PIKET_OVERRIDES_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, ShiftCode>) : {};
    } catch {
      return {};
    }
  });

  const [tidakPiketMap, setTidakPiketMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(PIKET_TIDAK_PIKET_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PIKET_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore storage quota errors
    }
  }, [overrides]);

  useEffect(() => {
    try {
      localStorage.setItem(PIKET_TIDAK_PIKET_STORAGE_KEY, JSON.stringify(tidakPiketMap));
    } catch {
      // ignore storage quota errors
    }
  }, [tidakPiketMap]);

  const daysInMonth = useMemo(() => getDaysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const monthName = MONTH_NAMES_ID[selectedMonth - 1];
  const monthShort = monthName.slice(0, 3);
  const isAtMinMonth = selectedYear === MIN_YEAR && selectedMonth === MIN_MONTH;
  const hasEdits = Object.keys(overrides).length > 0 || Object.keys(tidakPiketMap).length > 0;

  const roster: PersonnelSchedule[] = useMemo(() => {
    return getEffectivePiketRoster(tidakPiketMap);
  }, [tidakPiketMap]);

  const getShift = (person: PersonnelSchedule, day: number): ShiftCode => {
    const key = makePiketDateKey(person.id, selectedYear, selectedMonth, day);
    if (key in overrides) return overrides[key];
    return getBaseShiftForDate(person, selectedYear, selectedMonth, day);
  };

  const selectedIsoDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const selectMonthYear = (year: number, month: number, targetDay?: number) => {
    if (year < MIN_YEAR || (year === MIN_YEAR && month < MIN_MONTH)) return;
    const maxDays = getDaysInMonth(year, month);
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay((prev) => Math.min(targetDay ?? prev, maxDays));
  };

  const stepMonth = (delta: -1 | 1) => {
    let nextMonth = selectedMonth + delta;
    let nextYear = selectedYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    selectMonthYear(nextYear, nextMonth);
  };

  // Daily summary for selectedYear / selectedMonth / selectedDay
  const dailySummary = useMemo(() => {
    const pawas = roster.filter((p) => p.unit === 'PAWAS' && getShift(p, selectedDay) === 'X');
    const bhabin = roster.filter((p) => p.unit === 'BHABIN' && getShift(p, selectedDay) === 'X');
    const shiftSiang = roster.filter(
      (p) => (p.unit === 'SPK' || p.unit === 'SAMAPTA' || p.unit === 'LANTAS') && getShift(p, selectedDay) === 'S'
    );
    const shiftMalam = roster.filter(
      (p) => (p.unit === 'SPK' || p.unit === 'SAMAPTA' || p.unit === 'LANTAS') && getShift(p, selectedDay) === 'M'
    );
    const intelReskrimPiket = roster.filter(
      (p) => (p.unit === 'INTEL' || p.unit === 'RESKRIM') && getShift(p, selectedDay) === 'P'
    );
    const intelReskrimCadangan = roster.filter((p) => {
      if (p.unit !== 'INTEL' && p.unit !== 'RESKRIM') return false;
      const code = getShift(p, selectedDay);
      return code === 'C' || code === 'C1' || code === 'C2';
    });
    const jamDinas = roster.filter((p) => p.dutyMode === 'staff' || p.dutyMode === 'pam');
    const lepasDinas = roster.filter((p) => getShift(p, selectedDay) === 'L');
    const tidakPiketCount = roster.filter((p) => p.tidakPiket).length;

    const totalPiketAktif =
      pawas.filter((p) => !p.tidakPiket).length +
      bhabin.length +
      shiftSiang.length +
      shiftMalam.length +
      intelReskrimPiket.length;

    return {
      pawas,
      bhabin,
      shiftSiang,
      shiftMalam,
      intelReskrimPiket,
      intelReskrimCadangan,
      jamDinas,
      lepasDinas,
      tidakPiketCount,
      totalPiketAktif,
    };
  }, [roster, selectedYear, selectedMonth, selectedDay, overrides]);

  // Filtered matrix rows
  const filteredRoster = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return roster.filter((p) => {
      if (unitFilter !== 'ALL' && p.unit !== unitFilter) return false;
      const dayCode = getShift(p, selectedDay);
      if (shiftFilter === 'ON_DUTY') {
        const isDuty =
          (dayCode === 'X' && !p.tidakPiket) ||
          dayCode === 'S' ||
          dayCode === 'M' ||
          dayCode === 'P' ||
          p.dutyMode === 'staff' ||
          p.dutyMode === 'pam';
        if (!isDuty) return false;
      } else if (shiftFilter !== 'ALL') {
        if (dayCode !== shiftFilter) return false;
      }

      if (!q) return true;
      return (
        p.nama.toLowerCase().includes(q) ||
        p.nrp.toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.pangkat.toLowerCase().includes(q) ||
        (p.ket && p.ket.toLowerCase().includes(q))
      );
    });
  }, [roster, unitFilter, shiftFilter, searchQuery, selectedYear, selectedMonth, selectedDay, overrides]);

  const groupedUnits = useMemo(() => {
    return UNIT_ORDER.map((unit) => ({
      unit,
      members: filteredRoster.filter((p) => p.unit === unit),
    })).filter((g) => g.members.length > 0);
  }, [filteredRoster]);

  const handleCellClick = (person: PersonnelSchedule, day: number) => {
    if (!editMode) {
      setSelectedDay(day);
      return;
    }
    const curr = getShift(person, day);
    const next = SHIFT_CYCLE[(SHIFT_CYCLE.indexOf(curr) + 1) % SHIFT_CYCLE.length];
    const key = makePiketDateKey(person.id, selectedYear, selectedMonth, day);
    setOverrides((prev) => ({ ...prev, [key]: next }));
  };

  const toggleTidakPiket = (personId: string) => {
    if (!editMode) return;
    setTidakPiketMap((prev) => {
      const nextVal = !(prev[personId] ?? false);
      const copy = { ...prev };
      if (nextVal) copy[personId] = true;
      else delete copy[personId];
      return copy;
    });
  };

  const resetSchedule = () => {
    setOverrides({});
    setTidakPiketMap({});
  };

  const exportCsv = () => {
    const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Tgl_${i + 1}`);
    const headers = ['UNIT', 'NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET', ...dayHeaders];
    const rows = roster.map((p) => [
      p.unit,
      p.no,
      `"${p.nama}"`,
      p.pangkat,
      `"${p.nrp}"`,
      `"${p.jabatan}"`,
      `"${p.ket ?? ''}"`,
      ...Array.from(
        { length: daysInMonth },
        (_, i) =>
          getShift(p, i + 1) || (p.dutyMode === 'staff' ? 'STAFF' : p.dutyMode === 'pam' ? 'PAM' : '')
      ),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-piket-polsek-semarang-selatan-${monthName.toLowerCase()}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Surat Dinas */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Polri Daerah Jawa Tengah · Resor Kota Besar Semarang · Sektor Semarang Selatan
          </div>
          <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Jadwal Piket — Kuat Pers Bulan {monthName} {selectedYear}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Jadwal piket berkelanjutan (berlaku mundur mulai Oktober 2026 hingga bulan-bulan berikutnya) · 1–{daysInMonth} {monthName} {selectedYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              editMode
                ? 'border-amber-500 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            {editMode ? 'Mode Edit Aktif (Klik Sel)' : 'Ubah Jadwal'}
          </button>

          {hasEdits && (
            <button
              type="button"
              onClick={resetSchedule}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Perubahan
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {onCreateSprinFromPiket && (
            <button
              type="button"
              onClick={() => onCreateSprinFromPiket(selectedIsoDate)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" style={{ color: 'var(--kero-accent)' }} />
              Buat Sprin Pers PAM ({selectedDay} {monthShort})
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Jadwal
          </button>
        </div>
      </div>

      {/* Bar Navigasi Bulan Berkelanjutan (Oktober 2026 s.d. seterusnya) */}
      <section className="flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-white px-5 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_MONTHS.map((m) => {
            const active = selectedYear === m.year && selectedMonth === m.month;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => selectMonthYear(m.year, m.month)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => selectMonthYear(2026, 11, 21)}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
          >
            Hari Ini (21 Nov)
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepMonth(-1)}
              disabled={isAtMinMonth}
              aria-label="Bulan sebelumnya"
              title={isAtMinMonth ? 'Batas awal: Oktober 2026' : 'Bulan sebelumnya'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[116px] text-center font-display text-xs font-bold text-slate-800 whitespace-nowrap">
              {monthName} {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => stepMonth(1)}
              aria-label="Bulan berikutnya"
              title="Bulan berikutnya"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Ringkasan KPI Harian */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Kuat Pers</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {roster.length} Personel
          </div>
          <div className="mt-1 text-xs text-slate-500">11 Kesatuan / Unit Fungsi</div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Piket Aktif ({selectedDay} {monthShort})
            </span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#3ac47d] tabular-nums">
            {dailySummary.totalPiketAktif} Personel
          </div>
          <div className="mt-1 text-xs text-slate-500">Pawas, Bhabin, SPK, Samapta, Lantas, Intel/Reskrim</div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Jam Dinas (Staff &amp; PAM)</span>
            <Clock className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {dailySummary.jamDinas.length} Personel
          </div>
          <div className="mt-1 text-xs text-slate-500">8 Stanby · 3 Jaga Bank · 2 SIUM</div>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Lepas Dinas &amp; Catatan</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {dailySummary.lepasDinas.length} Lepas
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">
            {dailySummary.tidakPiketCount === 0
              ? 'Semua personel piket aktif'
              : `${dailySummary.tidakPiketCount} Sementara Tidak Piket`}
          </div>
        </div>
      </div>

      {/* Selector Tanggal + Petugas Piket Hari Terpilih */}
      <section className="rounded-lg border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-800">
              Daftar Petugas Piket — {DAY_SHORT_ID[getDayOfWeek(selectedYear, selectedMonth, selectedDay)]}, {selectedDay}{' '}
              {monthName} {selectedYear}
            </h2>
            <p className="text-xs text-slate-500">
              Rincian personel bertugas pada shift 24 jam, siang, malam, cadangan, dan jam dinas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay === 1}
              aria-label="Tanggal sebelumnya"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              aria-label="Pilih tanggal"
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none tabular-nums"
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} {monthName} {selectedYear}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedDay((d) => Math.min(daysInMonth, d + 1))}
              disabled={selectedDay === daysInMonth}
              aria-label="Tanggal berikutnya"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Strip Tanggal Cepat 1 - daysInMonth */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 print:hidden">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const active = selectedDay === d;
            const isSunday = getDayOfWeek(selectedYear, selectedMonth, d) === 0;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`flex h-7 min-w-[30px] items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors ${
                  active
                    ? 'text-white shadow-xs'
                    : isSunday
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
                style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Grid Kelompok Tugas Harian */}
        <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
          {/* Kolom 1 */}
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Piket Pawas · 24 Jam (Kode X)
              </div>
              <div className="mt-2 space-y-2">
                {dailySummary.pawas.length === 0 ? (
                  <div className="text-xs text-slate-400">Tidak ada jadwal Pawas</div>
                ) : (
                  dailySummary.pawas.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-md border px-3 py-2 text-xs ${
                        p.tidakPiket
                          ? 'border-rose-200 bg-rose-50/70 text-rose-800'
                          : 'border-slate-200 bg-slate-50/60 text-slate-800'
                      }`}
                    >
                      <div className="font-semibold">{p.nama}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                        {p.pangkat} · NRP {p.nrp} · {p.jabatan}
                      </div>
                      {p.tidakPiket && (
                        <div className="mt-1 font-bold text-rose-700">
                          Status: {p.ket ?? 'SEMENTARA TIDAK PIKET'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Piket Bhabinkamtibmas · 24 Jam (Kode X)
              </div>
              <div className="mt-2 space-y-2">
                {dailySummary.bhabin.map((p) => (
                  <div key={p.id} className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs">
                    <div className="font-semibold text-slate-800">{p.nama}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                      {p.pangkat} · {p.jabatan}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Piket Intel &amp; Reskrim · 24 Jam (Kode P)
              </div>
              <div className="mt-2 space-y-1.5">
                {dailySummary.intelReskrimPiket.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-emerald-200/70 bg-emerald-50/40 px-3 py-2 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{p.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.unit} {p.ket ? `(${p.ket})` : ''} · {p.pangkat}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">P</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom 2 */}
          <div className="p-5 space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Piket Siang · 08.00 s.d. 20.00 (Kode S)
              </div>
              <div className="mt-2 space-y-1.5">
                {dailySummary.shiftSiang.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200/80 px-3 py-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{p.nama}</span>
                      <div className="text-[11px] text-slate-500">
                        {p.unit} · {p.pangkat} · {p.jabatan}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sky-700">S</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Piket Malam · 20.00 s.d. 08.00 (Kode M)
              </div>
              <div className="mt-2 space-y-1.5">
                {dailySummary.shiftMalam.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200/80 px-3 py-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{p.nama}</span>
                      <div className="text-[11px] text-slate-500">
                        {p.unit} · {p.pangkat} · {p.jabatan}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700">M</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom 3 */}
          <div className="p-5 space-y-4 md:col-span-2 xl:col-span-1">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Cadangan Intel &amp; Reskrim (C / C1 / C2)
              </div>
              <div className="mt-2 space-y-1.5">
                {dailySummary.intelReskrimCadangan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-amber-200/70 bg-amber-50/40 px-3 py-1.5 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{p.nama}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.unit} {p.ket ? `· ${p.ket}` : ''} · {p.pangkat}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-800">{getShift(p, selectedDay)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Jam Dinas — Jaga Bank (PAM Obvit), Stanby &amp; SIUM
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                {dailySummary.jamDinas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200/70 px-3 py-1.5 text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold text-slate-800">{p.nama}</div>
                      <div className="truncate text-[11px] text-slate-500">
                        {p.pangkat} · {p.jabatan}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-teal-700">
                      {p.ket ?? p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Matriks Lengkap Bulanan */}
      <section className="rounded-lg border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-800">
              Matriks Jadwal Piket {monthName} {selectedYear} (Tanggal 1 s.d. {daysInMonth})
            </h2>
            <p className="text-xs text-slate-500">
              {editMode
                ? 'Klik sel tanggal untuk mengubah kode shift (tersimpan otomatis), atau klik kolom KET pada baris PAWAS.'
                : `Menampilkan ${filteredRoster.length} dari ${roster.length} personel · Rotasi otomatis berkelanjutan antar bulan.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NRP, jabatan..."
                className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value as 'ALL' | PersonnelUnit)}
              aria-label="Filter unit fungsi"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Unit (58)</option>
              {UNIT_ORDER.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as 'ALL' | 'ON_DUTY' | ShiftCode)}
              aria-label="Filter status piket tanggal terpilih"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status (Tgl {selectedDay})</option>
              <option value="ON_DUTY">Bertugas Aktif (Tgl {selectedDay})</option>
              <option value="X">Kode X — Pawas / Bhabin</option>
              <option value="S">Kode S — Piket Siang</option>
              <option value="M">Kode M — Piket Malam</option>
              <option value="P">Kode P — Intel / Reskrim 24J</option>
              <option value="L">Kode L — Lepas Dinas</option>
              <option value="C">Kode C — Cadangan Reskrim</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="sticky left-0 z-20 w-10 border-r border-slate-200 bg-slate-50 px-2.5 py-2.5 text-center">
                  No
                </th>
                <th className="sticky left-10 z-20 w-[112px] min-w-[112px] max-w-[112px] border-r border-slate-200 bg-slate-50 px-2.5 py-2.5">
                  Nama
                </th>
                <th className="min-w-[85px] border-r border-slate-200 px-2.5 py-2.5">Pangkat</th>
                <th className="min-w-[105px] border-r border-slate-200 px-2.5 py-2.5">NRP</th>
                <th className="min-w-[190px] border-r border-slate-200 px-3 py-2.5">Jabatan</th>
                <th className="min-w-[140px] border-r border-slate-200 px-3 py-2.5">Ket</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const active = d === selectedDay;
                  const dayOfWeek = getDayOfWeek(selectedYear, selectedMonth, d);
                  const isSunday = dayOfWeek === 0;
                  return (
                    <th
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`min-w-[36px] cursor-pointer border-r border-slate-200 px-1 py-1.5 text-center font-mono tabular-nums transition-colors ${
                        active
                          ? 'text-white'
                          : isSunday
                            ? 'bg-rose-50/70 text-rose-700 hover:bg-rose-100/80'
                            : 'hover:bg-slate-200/60'
                      }`}
                      style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                    >
                      <div className="leading-tight">{d}</div>
                      <div
                        className={`text-[9px] font-normal ${
                          active ? 'text-white/85' : isSunday ? 'text-rose-500' : 'text-slate-400'
                        }`}
                      >
                        {DAY_SHORT_ID[dayOfWeek]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupedUnits.length === 0 ? (
                <tr>
                  <td colSpan={6 + daysInMonth} className="px-6 py-10 text-center text-sm text-slate-500">
                    Tidak ada personel yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                groupedUnits.map((group) => (
                  <React.Fragment key={group.unit}>
                    {group.unit !== 'PIMPINAN' && (
                      <tr className="border-y border-slate-200 bg-slate-100/90">
                        <td
                          colSpan={6 + daysInMonth}
                          className="sticky left-0 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-slate-700"
                        >
                          {group.unit} ({group.members.length} Personel)
                        </td>
                      </tr>
                    )}

                    {group.members.map((p) => {
                      const rowHighlight = p.tidakPiket ? 'bg-rose-50/70' : 'bg-white hover:bg-slate-50/80';
                      return (
                        <tr key={p.id} className={`border-b border-slate-100 transition-colors ${rowHighlight}`}>
                          <td
                            className={`sticky left-0 z-10 border-r border-slate-200 px-2.5 py-2 text-center font-mono tabular-nums ${
                              p.tidakPiket ? 'bg-rose-50 text-rose-700 font-bold' : 'bg-white text-slate-500'
                            }`}
                          >
                            {p.no}
                          </td>
                          <td
                            title={p.nama}
                            className={`sticky left-10 z-10 w-[112px] min-w-[112px] max-w-[112px] border-r border-slate-200 px-2.5 py-2 font-semibold whitespace-nowrap ${
                              p.tidakPiket ? 'bg-rose-50 text-rose-700' : 'bg-white text-slate-800'
                            }`}
                          >
                            <span className="block truncate">{p.nama.slice(0, 10)}</span>
                          </td>
                          <td className={`border-r border-slate-100 px-2.5 py-2 whitespace-nowrap ${p.tidakPiket ? 'text-rose-700' : 'text-slate-600'}`}>
                            {p.pangkat}
                          </td>
                          <td className={`border-r border-slate-100 px-2.5 py-2 font-mono tabular-nums whitespace-nowrap ${p.tidakPiket ? 'text-rose-700' : 'text-slate-600'}`}>
                            {p.nrp}
                          </td>
                          <td className={`border-r border-slate-100 px-3 py-2 whitespace-nowrap ${p.tidakPiket ? 'text-rose-700' : 'text-slate-700'}`}>
                            {p.jabatan}
                          </td>
                          <td
                            onClick={() => toggleTidakPiket(p.id)}
                            className={`border-r border-slate-200 px-3 py-2 whitespace-nowrap ${
                              editMode ? 'cursor-pointer hover:underline' : ''
                            } ${
                              p.tidakPiket
                                ? 'font-bold text-rose-700'
                                : p.dutyMode === 'pam'
                                  ? 'font-semibold text-purple-700'
                                  : p.dutyMode === 'staff'
                                    ? 'font-medium text-teal-700'
                                    : 'text-slate-600'
                            }`}
                          >
                            {p.ket ?? ''}
                          </td>

                          {p.dutyMode === 'staff' || p.dutyMode === 'pam' ? (
                            <td
                              colSpan={daysInMonth}
                              className={`px-3 py-2 text-center font-mono text-[11px] font-semibold tracking-wide ${
                                p.dutyMode === 'pam'
                                  ? 'bg-purple-50/50 text-purple-700'
                                  : 'bg-teal-50/40 text-teal-700'
                              }`}
                            >
                              {p.dutyMode === 'pam'
                                ? `PAM OBVIT · JAM DINAS (1–${daysInMonth} ${monthShort.toUpperCase()})`
                                : `STAFF · JAM DINAS (1–${daysInMonth} ${monthShort.toUpperCase()})`}
                            </td>
                          ) : (
                            Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                              const code = getShift(p, day);
                              const isSelectedCol = day === selectedDay;
                              const isOverride = makePiketDateKey(p.id, selectedYear, selectedMonth, day) in overrides;
                              return (
                                <td
                                  key={day}
                                  onClick={() => handleCellClick(p, day)}
                                  title={
                                    editMode
                                      ? `Klik untuk ubah shift ${p.nama} (${day} ${monthShort})`
                                      : `${p.nama} — ${day} ${monthShort} ${selectedYear}: ${code || '-'}`
                                  }
                                  className={`border-r border-slate-100 p-1 text-center font-mono tabular-nums cursor-pointer select-none ${
                                    isSelectedCol ? 'ring-1 ring-inset ring-slate-300 bg-amber-50/30' : ''
                                  }`}
                                >
                                  {code ? (
                                    <span
                                      className={`inline-flex h-6 w-7 items-center justify-center rounded text-[11px] ${getShiftStyle(
                                        code,
                                        p.tidakPiket
                                      )} ${isOverride ? 'ring-1 ring-amber-500' : ''}`}
                                    >
                                      {code}
                                    </span>
                                  ) : (
                                    <span className="text-slate-200">·</span>
                                  )}
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Keterangan & Pengesahan Surat Dinas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8 rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
            Keterangan Kode Jadwal Piket
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {SHIFT_LEGEND.map((item) => (
              <div key={item.code} className="flex items-center gap-3 rounded-md border border-slate-100 px-3 py-2">
                <span
                  className="inline-flex min-w-[68px] items-center justify-center rounded px-2 py-1 font-mono text-xs font-bold"
                  style={{ color: item.color, backgroundColor: item.bg }}
                >
                  {item.code}
                </span>
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <div className="text-slate-500">{item.detail}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50/50 px-3 py-2 sm:col-span-2">
              <span className="inline-flex min-w-[68px] items-center justify-center rounded bg-rose-600 px-2 py-1 font-mono text-xs font-bold text-white">
                MERAH
              </span>
              <div className="text-xs">
                <div className="font-semibold text-rose-800">SEMENTARA TIDAK PIKET</div>
                <div className="text-rose-600">Personel dibebastugaskan sementara dari jadwal piket jaga</div>
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pengesahan Dokumen
            </div>
            <div className="mt-2 font-display text-sm font-bold uppercase text-slate-900">
              SEMARANG, {monthName.toUpperCase()} {selectedYear}
            </div>
            <div className="text-xs font-semibold text-slate-600">
              KAPOLSEK SEMARANG SELATAN
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-4">
            <div className="font-display text-sm font-bold text-slate-900 underline underline-offset-4">
              RISMANTO, S.H., M.H.
            </div>
            <div className="mt-0.5 font-mono text-xs text-slate-600 tabular-nums">
              KOMPOL NRP 73020406
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
