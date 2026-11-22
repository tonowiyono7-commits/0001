import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarCheck,
  ChevronDown,
  FileSpreadsheet,
  Layers,
  Maximize2,
  PenTool,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Stamp,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  PiketSyncPreset,
  formatIndonesianDateForSprin,
  getPiketStatusesForDate,
  piketStatusToPersonnelRow,
} from '../../data/jadwalPiketData';
import { FullscreenBodyEditorModal, FullscreenBodyTab } from './FullscreenBodyEditorModal';
import {
  applySatkerPresetToDoc,
  DEFAULT_LAMPIRAN_COL_WIDTHS,
  DEFAULT_STAMP_CONFIG,
  DEFAULT_STAMP_IMAGE_URL,
  getNormalizedLampiranColWidths,
  getSprinContinuationHeaderTitle,
  LAMPIRAN_COL_MIN_WIDTHS,
  LAMPIRAN_TABLE_TOTAL_MM,
  mergePersonnelByNrp,
  SATKER_PRESETS,
} from '../data/defaultData';
import {
  LampiranColumnWidths,
  PersonnelRow,
  SprinDocument,
  StampSignatureConfig,
} from '../types/sprin';
import { parsePersonnelExcel } from '../utils/importExcel';
import { DefaultSignatureGraphic } from './PolriEmblems';

export type EditorSectionId = 'hal1' | 'hal2' | 'pengesahan' | 'ttd';

interface SprinEditorFormProps {
  doc: SprinDocument;
  onChange: (updated: SprinDocument) => void;
  piketImportDate: string;
  onChangePiketImportDate: (isoDate: string) => void;
  onSyncPersPamFromPiket: (preset: PiketSyncPreset, syncDateHeader?: boolean) => void;
  activeSection: EditorSectionId;
  onChangeSection: (section: EditorSectionId) => void;
  autoCatchword?: string;
}

function getPiketBadgeStyle(badgeText: string): string {
  switch (badgeText) {
    case 'TIDAK PIKET':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'X':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'S':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'M':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'P':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PAM OBVIT':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'C':
    case 'C1':
    case 'C2':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'STAFF':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export const SprinEditorForm: React.FC<SprinEditorFormProps> = ({
  doc,
  onChange,
  piketImportDate,
  onChangePiketImportDate,
  onSyncPersPamFromPiket,
  activeSection,
  onChangeSection,
  autoCatchword,
}) => {
  const [showPiketModal, setShowPiketModal] = useState(false);
  const [piketSearch, setPiketSearch] = useState('');
  const [piketModalFilter, setPiketModalFilter] = useState<'ALL' | 'AKTIF' | 'PAM' | 'CADANGAN'>('ALL');
  const [piketSyncPreset, setPiketSyncPreset] = useState<PiketSyncPreset>('piket_dan_pam');
  const [syncDateHeader, setSyncDateHeader] = useState(true);
  const [fullscreenTab, setFullscreenTab] = useState<FullscreenBodyTab | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);
  const personnelExcelInputRef = useRef<HTMLInputElement>(null);

  const piketStatuses = useMemo(
    () => getPiketStatusesForDate(piketImportDate),
    [piketImportDate, showPiketModal, doc.updatedAt]
  );

  const piketByNrp = useMemo(
    () => new Map(piketStatuses.map((st) => [st.person.nrp.trim(), st])),
    [piketStatuses]
  );

  const formattedPiketDate = useMemo(
    () => formatIndonesianDateForSprin(piketImportDate),
    [piketImportDate]
  );

  const filteredModalPiket = useMemo(() => {
    const q = piketSearch.trim().toLowerCase();
    return piketStatuses.filter((st) => {
      if (piketModalFilter === 'AKTIF' && !st.isActivePiket) return false;
      if (piketModalFilter === 'PAM' && !st.isPam) return false;
      if (piketModalFilter === 'CADANGAN' && !st.isCadangan) return false;
      if (!q) return true;
      return (
        st.person.nama.toLowerCase().includes(q) ||
        st.person.nrp.toLowerCase().includes(q) ||
        st.person.unit.toLowerCase().includes(q) ||
        st.person.jabatan.toLowerCase().includes(q)
      );
    });
  }, [piketStatuses, piketModalFilter, piketSearch]);

  const handleSyncExistingRowsWithPiket = () => {
    const nextList = doc.personelList.map((row) => {
      const matched = piketByNrp.get(row.nrp.trim());
      if (!matched) return row;
      return {
        ...row,
        nama: matched.person.nama,
        pangkat: matched.person.pangkat,
        jabatan: matched.person.jabatan,
        ket: matched.sprinKet,
      };
    });
    updateField('personelList', nextList);
  };

  const stampCfg: StampSignatureConfig = {
    ...DEFAULT_STAMP_CONFIG,
    ...(doc.stampConfig || {}),
  };

  const updateField = <K extends keyof SprinDocument>(key: K, value: SprinDocument[K]) => {
    onChange({
      ...doc,
      [key]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateStampConfig = <K extends keyof StampSignatureConfig>(
    key: K,
    value: StampSignatureConfig[K]
  ) => {
    onChange({
      ...doc,
      showStampAndSignature: true,
      stampConfig: {
        ...stampCfg,
        [key]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleImageImport = (
    file: File | undefined,
    target: 'stampImageDataUrl' | 'signatureImageDataUrl'
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateStampConfig(target, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePersonnelExcelImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      setExcelError(null);
      const result = await parsePersonnelExcel(file);
      if (result.rows.length === 0) {
        setExcelError('Tidak ada data personel terbaca dari file Excel.');
        return;
      }
      const merged = mergePersonnelByNrp(doc.personelList, result.rows);
      onChange({
        ...doc,
        personelList: merged,
        useLampiran: doc.useLampiran || merged.length > 5,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setExcelError(
        err instanceof Error ? err.message : 'Gagal membaca file Excel (.xlsx/.xls/.csv).'
      );
    }
  };

  // List helpers for Dasar, Untuk, Tembusan
  const updateListItem = (
    key: 'dasarList' | 'untukList' | 'tembusanList',
    index: number,
    value: string
  ) => {
    const next = [...doc[key]];
    next[index] = value;
    updateField(key, next);
  };

  const addListItem = (key: 'dasarList' | 'untukList' | 'tembusanList', placeholder: string) => {
    updateField(key, [...doc[key], placeholder]);
  };

  const removeListItem = (key: 'dasarList' | 'untukList' | 'tembusanList', index: number) => {
    const next = doc[key].filter((_, i) => i !== index);
    updateField(key, next);
  };

  // Personnel table helpers
  const updatePersonnel = (id: string, field: keyof PersonnelRow, value: string) => {
    const next = doc.personelList.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    updateField('personelList', next);
  };

  const addBlankPersonnel = () => {
    const newRow: PersonnelRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nama: '',
      pangkat: 'AIPDA',
      nrp: '',
      jabatan: '',
      ket: '',
    };
    const nextList = [...doc.personelList, newRow];
    onChange({
      ...doc,
      personelList: nextList,
      useLampiran: doc.useLampiran || nextList.length > 5,
      updatedAt: new Date().toISOString(),
    });
  };

  const addFromRoster = (person: PersonnelRow) => {
    const alreadyExists = doc.personelList.some((p) => p.nrp === person.nrp && person.nrp !== '');
    if (alreadyExists) return;
    const cloned: PersonnelRow = {
      ...person,
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const nextList = [...doc.personelList, cloned];
    onChange({
      ...doc,
      personelList: nextList,
      useLampiran: doc.useLampiran || nextList.length > 5,
      updatedAt: new Date().toISOString(),
    });
  };

  const movePersonnel = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= doc.personelList.length) return;
    const next = [...doc.personelList];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateField('personelList', next);
  };

  const removePersonnel = (id: string) => {
    updateField(
      'personelList',
      doc.personelList.filter((r) => r.id !== id)
    );
  };

  const colWidths = getNormalizedLampiranColWidths(doc.lampiranColWidths);

  const LAMPIRAN_COLS_META: { key: keyof LampiranColumnWidths; label: string }[] = [
    { key: 'no', label: 'NO' },
    { key: 'nama', label: 'NAMA' },
    { key: 'pangkat', label: 'PANGKAT' },
    { key: 'nrp', label: 'NRP' },
    { key: 'jabatan', label: 'JABATAN' },
    { key: 'ket', label: 'KET' },
  ];

  const updateLampiranColWidth = (targetKey: keyof LampiranColumnWidths, rawValue: number) => {
    if (Number.isNaN(rawValue)) return;
    const otherKeys = LAMPIRAN_COLS_META.map((c) => c.key).filter((k) => k !== targetKey);
    const otherMinSum = otherKeys.reduce((s, k) => s + LAMPIRAN_COL_MIN_WIDTHS[k], 0);
    const minVal = LAMPIRAN_COL_MIN_WIDTHS[targetKey];
    const maxVal = LAMPIRAN_TABLE_TOTAL_MM - otherMinSum;
    const targetVal = +Math.max(minVal, Math.min(maxVal, rawValue)).toFixed(1);

    const remainingTotal = LAMPIRAN_TABLE_TOTAL_MM - targetVal;
    const remainingSlack = remainingTotal - otherMinSum;
    const currentSlackSum = otherKeys.reduce(
      (s, k) => s + Math.max(0, colWidths[k] - LAMPIRAN_COL_MIN_WIDTHS[k]),
      0
    );

    const nextWidths: LampiranColumnWidths = { ...colWidths, [targetKey]: targetVal };
    otherKeys.forEach((k) => {
      const baseMin = LAMPIRAN_COL_MIN_WIDTHS[k];
      const ratio =
        currentSlackSum > 0.01
          ? Math.max(0, colWidths[k] - baseMin) / currentSlackSum
          : 1 / otherKeys.length;
      nextWidths[k] = +(baseMin + remainingSlack * ratio).toFixed(1);
    });

    // Distribute rounding residual onto the widest other column so sum === 170.0 mm
    const sumNow =
      nextWidths.no +
      nextWidths.nama +
      nextWidths.pangkat +
      nextWidths.nrp +
      nextWidths.jabatan +
      nextWidths.ket;
    const residual = +(LAMPIRAN_TABLE_TOTAL_MM - sumNow).toFixed(1);
    if (Math.abs(residual) > 0) {
      const adjustKey = otherKeys.reduce((best, k) =>
        nextWidths[k] > nextWidths[best] ? k : best
      );
      nextWidths[adjustKey] = +Math.max(
        LAMPIRAN_COL_MIN_WIDTHS[adjustKey],
        nextWidths[adjustKey] + residual
      ).toFixed(1);
    }

    updateField('lampiranColWidths', nextWidths);
  };

  const sections: { id: EditorSectionId; shortLabel: string }[] = [
    { id: 'hal1', shortLabel: '1. Hal 1' },
    { id: 'hal2', shortLabel: doc.useLampiran ? '2. Hal 2' : '2. Kepada' },
    { id: 'pengesahan', shortLabel: '3. Pejabat' },
    { id: 'ttd', shortLabel: '4. TTD & Stempel' },
  ];

  return (
    <div className="space-y-4">
      {/* Interactive Section Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200">
        {sections.map((sec) => {
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onChangeSection(sec.id)}
              style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              className={`px-2.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap truncate cursor-pointer ${
                active
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {sec.shortLabel}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: SURAT PERINTAH HALAMAN 1 */}
      {activeSection === 'hal1' && (
        <section className="rounded-lg bg-white border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-800 uppercase">
              1. Isi Surat Perintah (Halaman 1)
            </h2>
            <span className="text-xs text-slate-500 font-mono-num">
              {doc.useLampiran ? 'Sprin + Lampiran' : 'Tanpa Lampiran'}
            </span>
          </div>

          {/* Konsep Format Surat Toggle */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-800">Konsep Format Surat</div>
              <span className="text-[11px] text-slate-500">Maks 5 pers langsung</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={doc.personelList.length > 5}
                onClick={() => updateField('useLampiran', false)}
                style={
                  doc.personelList.length <= 5 && !doc.useLampiran
                    ? {
                        backgroundColor: 'var(--kero-accent-soft)',
                        borderColor: 'var(--kero-accent-border)',
                        color: 'var(--kero-accent)',
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  doc.personelList.length > 5
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : !doc.useLampiran
                      ? 'cursor-pointer'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                Tanpa Lampiran (1–5 Pers)
              </button>
              <button
                type="button"
                onClick={() => updateField('useLampiran', true)}
                style={
                  doc.useLampiran || doc.personelList.length > 5
                    ? {
                        backgroundColor: 'var(--kero-accent-soft)',
                        borderColor: 'var(--kero-accent-border)',
                        color: 'var(--kero-accent)',
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  doc.useLampiran || doc.personelList.length > 5
                    ? ''
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dengan Lampiran (&gt; 5 Pers)
              </button>
            </div>
            {doc.personelList.length > 5 && (
              <p className="text-[11px] font-medium" style={{ color: 'var(--kero-accent)' }}>
                Personel berjumlah {doc.personelList.length} (&gt; 5), otomatis menggunakan halaman Lampiran sesuai ketentuan naskah dinas.
              </p>
            )}
          </div>

          {/* Preset Satker / Kesatuan dari BUAT-SPRIN */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--kero-accent)' }} />
                <span>Preset Kesatuan (Kop, Pejabat &amp; Stempel)</span>
              </div>
              <span className="text-[11px] text-slate-500">1-Klik</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SATKER_PRESETS.map((preset) => {
                const isActive =
                  doc.kopLine3.trim().toUpperCase() === preset.kopLine3.trim().toUpperCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange(applySatkerPresetToDoc(doc, preset.id))}
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--kero-accent-soft)',
                            borderColor: 'var(--kero-accent-border)',
                            color: 'var(--kero-accent)',
                          }
                        : undefined
                    }
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border text-left truncate transition-colors cursor-pointer ${
                      isActive
                        ? ''
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    title={preset.label}
                  >
                    {preset.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Kop Surat Kesatuan (3 Baris)
                </label>
                <span className="text-[11px] font-mono-num text-slate-400">Arial 12pt</span>
              </div>
              <input
                type="text"
                value={doc.kopLine1}
                onChange={(e) => updateField('kopLine1', e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 font-arial-12 leading-[1.15] text-slate-800 uppercase"
              />
              <input
                type="text"
                value={doc.kopLine2}
                onChange={(e) => updateField('kopLine2', e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 font-arial-12 leading-[1.15] text-slate-800 uppercase"
              />
              <input
                type="text"
                value={doc.kopLine3}
                onChange={(e) => updateField('kopLine3', e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 font-arial-12 leading-[1.15] text-slate-800 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nomor Surat Perintah
              </label>
              <input
                type="text"
                value={doc.nomorSprin}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({
                    ...doc,
                    nomorSprin: val,
                    lampiranNomor: val.toUpperCase(),
                    updatedAt: new Date().toISOString(),
                  });
                }}
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2.5 text-sm text-slate-800 font-mono-num"
              />
            </div>

            {/* Pertimbangan (Mode Layar Penuh) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-slate-600">Pertimbangan</label>
                <button
                  type="button"
                  onClick={() => setFullscreenTab('pertimbangan')}
                  style={{
                    backgroundColor: 'var(--kero-accent-soft)',
                    borderColor: 'var(--kero-accent-border)',
                    color: 'var(--kero-accent)',
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Mode Layar Penuh</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenTab('pertimbangan')}
                className="w-full text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white px-3.5 py-2.5 transition-colors cursor-pointer group"
              >
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                  {doc.pertimbangan.trim() || (
                    <span className="text-slate-400 italic">
                      Belum diisi — klik untuk mengisi Pertimbangan dalam mode layar penuh...
                    </span>
                  )}
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-800">
                  <span>Klik untuk mengisi dalam mode layar penuh</span>
                  <span className="font-mono-num">{doc.pertimbangan.length} kar</span>
                </div>
              </button>
            </div>

            {/* Dasar List (Mode Layar Penuh) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Dasar Hukum &amp; Surat ({doc.dasarList.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addListItem('dasarList', 'Dasar tambahan...');
                      setFullscreenTab('dasar');
                    }}
                    style={{ color: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenTab('dasar')}
                    style={{
                      backgroundColor: 'var(--kero-accent-soft)',
                      borderColor: 'var(--kero-accent-border)',
                      color: 'var(--kero-accent)',
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Mode Layar Penuh</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenTab('dasar')}
                className="w-full text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white px-3.5 py-2.5 transition-colors cursor-pointer group space-y-1.5"
              >
                {doc.dasarList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                    <span
                      className="font-mono-num font-semibold shrink-0"
                      style={{ color: 'var(--kero-accent)' }}
                    >
                      {idx + 1}.
                    </span>
                    <span className="line-clamp-2">{item}</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-800">
                  <span>Klik untuk mengisi &amp; menyusun dasar dalam mode layar penuh</span>
                  <span className="font-mono-num">{doc.dasarList.length} item</span>
                </div>
              </button>
            </div>

            {doc.useLampiran ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kepada</label>
                <textarea
                  rows={2}
                  value={doc.kepadaText}
                  onChange={(e) => updateField('kepadaText', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-xs text-slate-800 uppercase leading-relaxed"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-700">
                    Kepada ({doc.personelList.length} Personel)
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {doc.personelList.length > 0
                      ? doc.personelList.map((p) => `${p.pangkat} ${p.nama}`).join(', ')
                      : 'Belum ada personel dipilih'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeSection('hal2')}
                  style={{
                    backgroundColor: 'var(--kero-accent-soft)',
                    borderColor: 'var(--kero-accent-border)',
                    color: 'var(--kero-accent)',
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 hover:opacity-85 cursor-pointer"
                >
                  Atur Personel
                </button>
              </div>
            )}

            {/* Untuk List (Mode Layar Penuh) */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Untuk (Poin Perintah Tugas) ({doc.untukList.length})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addListItem('untukList', 'Poin perintah tugas baru;');
                      setFullscreenTab('untuk');
                    }}
                    style={{ color: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullscreenTab('untuk')}
                    style={{
                      backgroundColor: 'var(--kero-accent-soft)',
                      borderColor: 'var(--kero-accent-border)',
                      color: 'var(--kero-accent)',
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Mode Layar Penuh</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenTab('untuk')}
                className="w-full text-left rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white px-3.5 py-2.5 transition-colors cursor-pointer group space-y-1.5"
              >
                {doc.untukList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                    <span
                      className="font-mono-num font-semibold shrink-0"
                      style={{ color: 'var(--kero-accent)' }}
                    >
                      {idx + 1}.
                    </span>
                    <span className="line-clamp-2">{item}</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-800">
                  <span>Klik untuk mengisi &amp; menyusun poin perintah dalam mode layar penuh</span>
                  <span className="font-mono-num">{doc.untukList.length} poin</span>
                </div>
              </button>
            </div>

            {/* Tembusan List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">Tembusan</label>
                <button
                  type="button"
                  onClick={() => addListItem('tembusanList', 'Kasi Propam Polrestabes Smg')}
                  style={{ color: 'var(--kero-accent)' }}
                  className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tembusan</span>
                </button>
              </div>
              <div className="space-y-2">
                {doc.tembusanList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono-num text-xs text-slate-400 w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateListItem('tembusanList', idx, e.target.value)}
                      className="flex-1 rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800"
                    />
                    {doc.tembusanList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeListItem('tembusanList', idx)}
                        aria-label="Hapus tembusan"
                        className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Kata Sambung (Catchword) */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Kata Sambung Halaman Berikutnya (Opsional)
                </label>
                {(doc.kataSambung || '').trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => updateField('kataSambung', '')}
                    style={{ color: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Gunakan Otomatis</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={doc.kataSambung ?? ''}
                onChange={(e) => updateField('kataSambung', e.target.value)}
                placeholder="Otomatis saat > 1 halaman (misal: 4. melaporkan .....)"
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {autoCatchword
                  ? `Otomatis terdeteksi: "${autoCatchword}"`
                  : 'Ditampilkan di kanan bawah halaman yang bersambung ke halaman berikutnya.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: LAMPIRAN & DAFTAR PERSONEL HALAMAN 2 */}
      {activeSection === 'hal2' && (
        <section className="rounded-lg bg-white border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-800 uppercase">
              {doc.useLampiran
                ? '2. Lampiran Personel'
                : '2. Personel yang Diperintahkan (Kepada)'}
            </h2>
            <span className="text-xs text-slate-500 font-mono-num">
              {doc.personelList.length} Pers
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Header Kanan Atas (Halaman 2+)
              </span>
              <span className="text-[11px] text-slate-500">
                Muncul otomatis setelah halaman 1
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Judul Header Lanjutan Isi Sprin (Hal. 2+ Surat)
              </label>
              <input
                type="text"
                value={doc.sprinHeaderTitle ?? ''}
                onChange={(e) => updateField('sprinHeaderTitle', e.target.value)}
                placeholder={`Otomatis: ${getSprinContinuationHeaderTitle({ lampiranHeaderTitle: doc.lampiranHeaderTitle })}`}
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Judul Header Halaman Lampiran
              </label>
              <input
                type="text"
                value={doc.lampiranHeaderTitle}
                onChange={(e) => updateField('lampiranHeaderTitle', e.target.value)}
                placeholder="LAMP SPRIN KAPOLSEK SMG SELATAN"
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor Header (Hal. 2+)
                </label>
                <input
                  type="text"
                  value={doc.lampiranNomor}
                  onChange={(e) => updateField('lampiranNomor', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 font-mono-num uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tanggal Header (Kapital)
                </label>
                <input
                  type="text"
                  value={doc.lampiranTanggalUpper}
                  onChange={(e) => updateField('lampiranTanggalUpper', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 font-mono-num uppercase"
                />
              </div>
            </div>
          </div>

          {doc.useLampiran && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Judul Daftar Personel
                </label>
                <input
                  type="text"
                  value={doc.lampiranJudul}
                  onChange={(e) => updateField('lampiranJudul', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Subjudul Hari &amp; Tanggal Pelaksanaan
                </label>
                <input
                  type="text"
                  value={doc.lampiranSubjudul}
                  onChange={(e) => updateField('lampiranSubjudul', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
                />
              </div>

              {/* Pengaturan Lebar Kolom Tabel Lampiran */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal
                      className="w-4 h-4"
                      style={{ color: 'var(--kero-accent)' }}
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Lebar Kolom Tabel (Total 170 mm)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('lampiranColWidths', { ...DEFAULT_LAMPIRAN_COL_WIDTHS })}
                    style={{ color: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Geser slider di bawah atau seret langsung batas garis kolom pada tabel pratinjau. Otomatis sinkron ke pratinjau, PDF, dan .DOCX.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LAMPIRAN_COLS_META.map(({ key, label }) => {
                    const otherMinSum = LAMPIRAN_COLS_META.filter((c) => c.key !== key).reduce(
                      (s, c) => s + LAMPIRAN_COL_MIN_WIDTHS[c.key],
                      0
                    );
                    const minMm = LAMPIRAN_COL_MIN_WIDTHS[key];
                    const maxMm = LAMPIRAN_TABLE_TOTAL_MM - otherMinSum;
                    const currentMm = colWidths[key];

                    return (
                      <div
                        key={key}
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-2 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-800">{label}</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={minMm}
                              max={maxMm}
                              step={0.5}
                              value={currentMm}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                if (!Number.isNaN(parsed) && parsed >= minMm) {
                                  updateLampiranColWidth(key, parsed);
                                }
                              }}
                              aria-label={`Lebar kolom ${label} dalam milimeter`}
                              style={{ color: 'var(--kero-accent)' }}
                              className="w-14 rounded bg-slate-50 border border-slate-200 focus:border-slate-400 focus:outline-none px-1.5 py-0.5 text-right text-[11px] font-semibold font-mono-num"
                            />
                            <span className="text-[10px] font-mono-num text-slate-400">mm</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={minMm}
                          max={maxMm}
                          step={0.5}
                          value={currentMm}
                          onChange={(e) => updateLampiranColWidth(key, parseFloat(e.target.value))}
                          aria-label={`Slider lebar kolom ${label}`}
                          style={{ accentColor: 'var(--kero-accent)' }}
                          className="w-full cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 space-y-3">
            {/* Sinkronisasi Pers PAM dengan Jadwal Piket */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" style={{ color: 'var(--kero-accent)' }} />
                  <span className="text-xs font-semibold text-slate-800">
                    Sinkronisasi Daftar Pers PAM ↔ Jadwal Piket
                  </span>
                </div>
                {formattedPiketDate && (
                  <span className="text-[11px] font-medium text-slate-500">
                    {formattedPiketDate.dayNameUpper}, {formattedPiketDate.dateTitle}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tanggal Jadwal Piket
                  </label>
                  <input
                    type="date"
                    min="2026-10-01"
                    value={piketImportDate}
                    onChange={(e) => onChangePiketImportDate(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kelompok Pers PAM
                  </label>
                  <div className="relative">
                    <select
                      value={piketSyncPreset}
                      onChange={(e) => setPiketSyncPreset(e.target.value as PiketSyncPreset)}
                      className="w-full appearance-none rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none pl-2.5 pr-8 py-1.5 text-xs text-slate-800 cursor-pointer"
                    >
                      <option value="piket_dan_pam">Piket Aktif + PAM Obvit</option>
                      <option value="piket_aktif">Piket Aktif Saja (X / S / M / P)</option>
                      <option value="pam_obvit">PAM Obvit / Jaga Bank Saja</option>
                      <option value="siang">Piket Siang (Kode S)</option>
                      <option value="malam">Piket Malam (Kode M)</option>
                      <option value="cadangan">Cadangan Intel &amp; Reskrim</option>
                      <option value="semua">Seluruh Personel Polsek</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncDateHeader}
                  onChange={(e) => setSyncDateHeader(e.target.checked)}
                  style={{ accentColor: 'var(--kero-accent)' }}
                  className="rounded cursor-pointer"
                />
                <span>Perbarui tanggal &amp; subjudul hari pelaksanaan sesuai tanggal piket</span>
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => onSyncPersPamFromPiket(piketSyncPreset, syncDateHeader)}
                  style={{ backgroundColor: 'var(--kero-accent)' }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sinkronkan dari Piket</span>
                </button>
                {doc.personelList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncExistingRowsWithPiket}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Perbarui Ket/Shift Baris Aktif</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Daftar Pers PAM / Personel Bertugas
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={personnelExcelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.ods"
                  className="hidden"
                  onChange={(e) => {
                    void handlePersonnelExcelImport(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => personnelExcelInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Import Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPiketModal(true)}
                  style={{
                    backgroundColor: 'var(--kero-accent-soft)',
                    borderColor: 'var(--kero-accent-border)',
                    color: 'var(--kero-accent)',
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-85 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Pilih dari Jadwal Piket</span>
                </button>
                <button
                  type="button"
                  onClick={addBlankPersonnel}
                  style={{ backgroundColor: 'var(--kero-accent)' }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Baris</span>
                </button>
              </div>
            </div>

            {excelError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
                {excelError}
              </div>
            )}

            <div className="space-y-2.5">
              {doc.personelList.map((row, idx) => {
                const matchedPiket = piketByNrp.get(row.nrp.trim());
                return (
                <div
                  key={row.id}
                  className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono-num text-xs font-semibold shrink-0"
                        style={{ color: 'var(--kero-accent)' }}
                      >
                        Pers #{idx + 1}
                      </span>
                      {matchedPiket && (
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold truncate ${getPiketBadgeStyle(
                            matchedPiket.badgeText
                          )}`}
                        >
                          {matchedPiket.person.unit} · {matchedPiket.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => movePersonnel(idx, -1)}
                        aria-label="Naikkan urutan"
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === doc.personelList.length - 1}
                        onClick={() => movePersonnel(idx, 1)}
                        aria-label="Turunkan urutan"
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePersonnel(row.id)}
                        aria-label="Hapus personel"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={row.nama}
                      onChange={(e) => updatePersonnel(row.id, 'nama', e.target.value)}
                      placeholder="Nama Lengkap"
                      className="rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800 uppercase"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={row.pangkat}
                        onChange={(e) => updatePersonnel(row.id, 'pangkat', e.target.value)}
                        placeholder="Pangkat"
                        className="rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800 uppercase"
                      />
                      <input
                        type="text"
                        value={row.nrp}
                        onChange={(e) => updatePersonnel(row.id, 'nrp', e.target.value)}
                        placeholder="NRP"
                        className="rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800 font-mono-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={row.jabatan}
                      onChange={(e) => updatePersonnel(row.id, 'jabatan', e.target.value)}
                      placeholder="Jabatan"
                      className="sm:col-span-2 rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800 uppercase"
                    />
                    <input
                      type="text"
                      value={row.ket}
                      onChange={(e) => updatePersonnel(row.id, 'ket', e.target.value)}
                      placeholder="Ket (opsional)"
                      className="rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2.5 py-1.5 text-xs text-slate-800 uppercase"
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: PENGESAHAN & STEMPEL */}
      {activeSection === 'pengesahan' && (
        <section className="rounded-lg bg-white border border-slate-200 shadow-xs p-5 space-y-4">
          <h2 className="text-base font-bold tracking-tight text-slate-800 uppercase">
            3. Pengesahan, Pejabat &amp; Stempel
          </h2>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Dikeluarkan di
                </label>
                <input
                  type="text"
                  value={doc.dikeluarkanDi}
                  onChange={(e) => updateField('dikeluarkanDi', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Status Dokumen
                </label>
                <div className="relative">
                  <select
                    value={doc.status}
                    onChange={(e) =>
                      updateField('status', e.target.value as SprinDocument['status'])
                    }
                    className="w-full appearance-none rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none pl-3.5 pr-9 py-2 text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Siap Cetak">Siap Cetak</option>
                    <option value="Terbit">Terbit</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${doc.useLampiran ? 'sm:grid-cols-2' : ''} gap-3`}>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {doc.useLampiran ? 'Tanggal Pengesahan Hal. 1' : 'Tanggal Pengesahan'}
                </label>
                <input
                  type="text"
                  value={doc.tanggalSuratHal1}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange({
                      ...doc,
                      tanggalSuratHal1: val,
                      lampiranTanggalUpper: !doc.useLampiran
                        ? val.replace(/\s+/g, ' ').trim().toUpperCase()
                        : doc.lampiranTanggalUpper,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800"
                />
              </div>
              {doc.useLampiran && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal Pengesahan Hal. 2
                  </label>
                  <input
                    type="text"
                    value={doc.tanggalSuratHal2}
                    onChange={(e) => updateField('tanggalSuratHal2', e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Jabatan Penanda Tangan (1 Baris · Mepet Margin Kanan)
              </label>
              <input
                type="text"
                value={doc.pejabatJabatan.replace(/[\r\n]+/g, ' ')}
                onChange={(e) =>
                  updateField('pejabatJabatan', e.target.value.replace(/[\r\n]+/g, ' '))
                }
                className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nama Pejabat &amp; Gelar
                </label>
                <input
                  type="text"
                  value={doc.pejabatNama}
                  onChange={(e) => updateField('pejabatNama', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Pangkat &amp; NRP Pejabat
                </label>
                <input
                  type="text"
                  value={doc.pejabatPangkatNrp}
                  onChange={(e) => updateField('pejabatPangkatNrp', e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3.5 py-2 text-sm text-slate-800 uppercase font-mono-num"
                />
              </div>
            </div>

            {/* Stamp & Digital Signature Toggle */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Stamp
                  className="w-5 h-5 mt-0.5 shrink-0"
                  style={{ color: 'var(--kero-accent)' }}
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Tampilkan Stempel &amp; TTD Digital
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Matikan jika surat akan dicetak untuk tanda tangan dan stempel basah fisik.
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={doc.showStampAndSignature}
                onClick={() => updateField('showStampAndSignature', !doc.showStampAndSignature)}
                style={
                  doc.showStampAndSignature ? { backgroundColor: 'var(--kero-accent)' } : undefined
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  doc.showStampAndSignature ? '' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                    doc.showStampAndSignature ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {doc.showStampAndSignature && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teks Lingkar Atas Stempel
                  </label>
                  <input
                    type="text"
                    value={doc.stampResorText}
                    onChange={(e) => updateField('stampResorText', e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teks Lingkar Bawah Stempel
                  </label>
                  <input
                    type="text"
                    value={doc.stampSektorText}
                    onChange={(e) => updateField('stampSektorText', e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-3 py-2 text-xs text-slate-800 uppercase"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 4: IMPORT TANDA TANGAN & STEMPEL */}
      {activeSection === 'ttd' && (
        <section className="rounded-lg bg-white border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-800 uppercase">
              4. Import Tanda Tangan &amp; Stempel
            </h2>
            <button
              type="button"
              onClick={() => updateField('showStampAndSignature', !doc.showStampAndSignature)}
              style={
                doc.showStampAndSignature ? { backgroundColor: 'var(--kero-accent)' } : undefined
              }
              className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                doc.showStampAndSignature
                  ? 'text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {doc.showStampAndSignature ? 'Aktif di Surat' : 'Nonaktif'}
            </button>
          </div>

          {/* Layering Order Control (Default: Above Text) */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Layers className="w-4 h-4" style={{ color: 'var(--kero-accent)' }} />
              <span>Posisi Lapisan Terhadap Teks Surat</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStampConfig('aboveText', true)}
                style={
                  stampCfg.aboveText
                    ? {
                        backgroundColor: 'var(--kero-accent-soft)',
                        borderColor: 'var(--kero-accent-border)',
                        color: 'var(--kero-accent)',
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  stampCfg.aboveText
                    ? ''
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Di Atas Teks (Default)
              </button>
              <button
                type="button"
                onClick={() => updateStampConfig('aboveText', false)}
                style={
                  !stampCfg.aboveText
                    ? {
                        backgroundColor: 'var(--kero-accent-soft)',
                        borderColor: 'var(--kero-accent-border)',
                        color: 'var(--kero-accent)',
                      }
                    : undefined
                }
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  !stampCfg.aboveText
                    ? ''
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Di Bawah Teks
              </button>
            </div>
          </div>

          {/* IMPORT & ATUR STEMPEL (Default 4.7 cm) */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4" style={{ color: 'var(--kero-accent)' }} />
                <span className="text-sm font-bold text-slate-800">Stempel Kesatuan</span>
              </div>
              <span
                className="font-mono-num text-xs font-semibold"
                style={{ color: 'var(--kero-accent)' }}
              >
                {stampCfg.stampSizeCm.toFixed(1).replace('.', ',')} cm
              </span>
            </div>

            {/* File Import Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <img
                  src={stampCfg.stampImageDataUrl || DEFAULT_STAMP_IMAGE_URL}
                  alt="Preview Stempel"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={stampInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleImageImport(e.target.files?.[0], 'stampImageDataUrl');
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    style={{ backgroundColor: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Gambar Stempel</span>
                  </button>
                  {stampCfg.stampImageDataUrl &&
                    stampCfg.stampImageDataUrl !== DEFAULT_STAMP_IMAGE_URL && (
                      <button
                        type="button"
                        onClick={() =>
                          updateStampConfig('stampImageDataUrl', DEFAULT_STAMP_IMAGE_URL)
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-medium text-slate-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Pakai Default</span>
                      </button>
                    )}
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stampCfg.stampMultiplyBlend}
                    onChange={(e) => updateStampConfig('stampMultiplyBlend', e.target.checked)}
                    style={{ accentColor: 'var(--kero-accent)' }}
                    className="rounded cursor-pointer"
                  />
                  <span>Tembus pandang latar putih (Multiply)</span>
                </label>
              </div>
            </div>

            {/* Stamp Size Control (Default 4.7 cm) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Ukuran Stempel (cm)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateStampConfig('stampSizeCm', 4.7)}
                    style={{ color: 'var(--kero-accent)' }}
                    className="text-[11px] font-semibold hover:underline cursor-pointer"
                  >
                    Standar 4,7 cm
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="2.0"
                    max="8.0"
                    value={stampCfg.stampSizeCm}
                    onChange={(e) =>
                      updateStampConfig(
                        'stampSizeCm',
                        Math.max(1.5, Math.min(8.5, Number(e.target.value) || 4.7))
                      )
                    }
                    className="w-16 rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2 py-1 text-xs text-right font-mono-num text-slate-800"
                  />
                </div>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.1"
                value={stampCfg.stampSizeCm}
                onChange={(e) => updateStampConfig('stampSizeCm', parseFloat(e.target.value))}
                style={{ accentColor: 'var(--kero-accent)' }}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Stamp Position X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span>Posisi X (Kiri/Kanan)</span>
                  <span className="font-mono-num font-semibold text-slate-800">
                    {stampCfg.stampOffsetXMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="65"
                  step="1"
                  value={stampCfg.stampOffsetXMm}
                  onChange={(e) =>
                    updateStampConfig('stampOffsetXMm', parseInt(e.target.value, 10))
                  }
                  style={{ accentColor: 'var(--kero-accent)' }}
                  className="w-full cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span>Posisi Y (Atas/Bawah)</span>
                  <span className="font-mono-num font-semibold text-slate-800">
                    {stampCfg.stampOffsetYMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="50"
                  step="1"
                  value={stampCfg.stampOffsetYMm}
                  onChange={(e) =>
                    updateStampConfig('stampOffsetYMm', parseInt(e.target.value, 10))
                  }
                  style={{ accentColor: 'var(--kero-accent)' }}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* IMPORT & ATUR TANDA TANGAN */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4" style={{ color: 'var(--kero-accent)' }} />
                <span className="text-sm font-bold text-slate-800">Tanda Tangan Pejabat</span>
              </div>
              <span
                className="font-mono-num text-xs font-semibold"
                style={{ color: 'var(--kero-accent)' }}
              >
                {stampCfg.signatureWidthCm.toFixed(1).replace('.', ',')} cm
              </span>
            </div>

            {/* File Import Row */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                {stampCfg.signatureImageDataUrl ? (
                  <img
                    src={stampCfg.signatureImageDataUrl}
                    alt="Preview Tanda Tangan"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <DefaultSignatureGraphic className="w-full h-auto" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleImageImport(e.target.files?.[0], 'signatureImageDataUrl');
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sigInputRef.current?.click()}
                    style={{ backgroundColor: 'var(--kero-accent)' }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Tanda Tangan</span>
                  </button>
                  {stampCfg.signatureImageDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateStampConfig('signatureImageDataUrl', null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-medium text-slate-600 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Pakai Default</span>
                    </button>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stampCfg.signatureMultiplyBlend}
                    onChange={(e) =>
                      updateStampConfig('signatureMultiplyBlend', e.target.checked)
                    }
                    style={{ accentColor: 'var(--kero-accent)' }}
                    className="rounded cursor-pointer"
                  />
                  <span>Tembus pandang latar putih (Multiply)</span>
                </label>
              </div>
            </div>

            {/* Signature Size Control */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Ukuran Lebar Tanda Tangan (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.5"
                  max="10.0"
                  value={stampCfg.signatureWidthCm}
                  onChange={(e) =>
                    updateStampConfig(
                      'signatureWidthCm',
                      Math.max(1.5, Math.min(10.0, Number(e.target.value) || 5.2))
                    )
                  }
                  className="w-16 rounded bg-white border border-slate-200 focus:border-slate-400 focus:outline-none px-2 py-1 text-xs text-right font-mono-num text-slate-800"
                />
              </div>
              <input
                type="range"
                min="1.5"
                max="10.0"
                step="0.1"
                value={stampCfg.signatureWidthCm}
                onChange={(e) =>
                  updateStampConfig('signatureWidthCm', parseFloat(e.target.value))
                }
                style={{ accentColor: 'var(--kero-accent)' }}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Signature Position X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span>Posisi X (Kiri/Kanan)</span>
                  <span className="font-mono-num font-semibold text-slate-800">
                    {stampCfg.signatureOffsetXMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-35"
                  max="70"
                  step="1"
                  value={stampCfg.signatureOffsetXMm}
                  onChange={(e) =>
                    updateStampConfig('signatureOffsetXMm', parseInt(e.target.value, 10))
                  }
                  style={{ accentColor: 'var(--kero-accent)' }}
                  className="w-full cursor-pointer"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                  <span>Posisi Y (Atas/Bawah)</span>
                  <span className="font-mono-num font-semibold text-slate-800">
                    {stampCfg.signatureOffsetYMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="55"
                  step="1"
                  value={stampCfg.signatureOffsetYMm}
                  onChange={(e) =>
                    updateStampConfig('signatureOffsetYMm', parseInt(e.target.value, 10))
                  }
                  style={{ accentColor: 'var(--kero-accent)' }}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Reset Posisi & Ukuran Default */}
          <button
            type="button"
            onClick={() =>
              updateField('stampConfig', {
                ...stampCfg,
                stampSizeCm: DEFAULT_STAMP_CONFIG.stampSizeCm,
                stampOffsetXMm: DEFAULT_STAMP_CONFIG.stampOffsetXMm,
                stampOffsetYMm: DEFAULT_STAMP_CONFIG.stampOffsetYMm,
                signatureWidthCm: DEFAULT_STAMP_CONFIG.signatureWidthCm,
                signatureOffsetXMm: DEFAULT_STAMP_CONFIG.signatureOffsetXMm,
                signatureOffsetYMm: DEFAULT_STAMP_CONFIG.signatureOffsetYMm,
                aboveText: true,
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--kero-accent)' }} />
            <span>Reset Posisi &amp; Ukuran Default (Stempel 4,7 cm · Di Atas Teks)</span>
          </button>
        </section>
      )}

      {/* Piket Sync Picker Modal */}
      {showPiketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 uppercase">
                  Pilih Pers PAM dari Jadwal Piket
                </h3>
                <p className="text-xs text-slate-500">
                  Sumber langsung dari Jadwal Piket ({formattedPiketDate ? `${formattedPiketDate.dayNameUpper}, ${formattedPiketDate.dateTitle}` : piketImportDate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPiketModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={piketSearch}
                  onChange={(e) => setPiketSearch(e.target.value)}
                  placeholder="Cari nama, NRP, unit, jabatan..."
                  className="w-full rounded-lg bg-white border border-slate-200 focus:border-slate-400 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'ALL', label: 'Semua' },
                    { id: 'AKTIF', label: 'Piket Aktif' },
                    { id: 'PAM', label: 'PAM Obvit' },
                    { id: 'CADANGAN', label: 'Cadangan' },
                  ] as const
                ).map((tab) => {
                  const active = piketModalFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPiketModalFilter(tab.id)}
                      style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {filteredModalPiket.map((st) => {
                const alreadyAdded = doc.personelList.some(
                  (p) => p.nrp === st.person.nrp && st.person.nrp !== ''
                );
                return (
                  <div
                    key={st.person.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 uppercase truncate">
                          {st.person.pangkat} {st.person.nama}
                        </span>
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${getPiketBadgeStyle(
                            st.badgeText
                          )}`}
                        >
                          {st.badgeText}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-num truncate">
                        {st.person.unit} · NRP {st.person.nrp} · {st.person.jabatan}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addFromRoster(piketStatusToPersonnelRow(st))}
                      style={!alreadyAdded ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-opacity ${
                        alreadyAdded
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'text-white shadow-xs hover:opacity-90 cursor-pointer'
                      }`}
                    >
                      {alreadyAdded ? 'Terdaftar' : 'Tambahkan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Fullscreen Body Editor (Pertimbangan, Dasar Hukum & Surat, Untuk) */}
      <FullscreenBodyEditorModal
        isOpen={fullscreenTab !== null}
        initialTab={fullscreenTab ?? 'pertimbangan'}
        doc={doc}
        onChange={onChange}
        onClose={() => setFullscreenTab(null)}
      />
    </div>
  );
};
