import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileDown,
  FilePlus2,
  FileText,
  LayoutTemplate,
  Loader2,
  Printer,
  Save,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  PiketSyncPreset,
  buildSprinPersonnelFromPiket,
  formatIndonesianDateForSprin,
} from '../data/jadwalPiketData';
import { ArchiveView } from '../sprin/components/ArchiveView';
import {
  computePageOneCatchword,
  LetterPageOne,
  useSprinPageOneSlices,
} from '../sprin/components/LetterPageOne';
import {
  computeLampiranCatchword,
  LetterPageTwo,
  useLampiranPages,
} from '../sprin/components/LetterPageTwo';
import { QuickWinsEmblem } from '../sprin/components/PolriEmblems';
import { EditorSectionId, SprinEditorForm } from '../sprin/components/SprinEditorForm';
import {
  DEFAULT_LAMPIRAN_COL_WIDTHS,
  DEFAULT_SPRIN_DOCUMENT,
  DEFAULT_STAMP_CONFIG,
  DEFAULT_STAMP_IMAGE_URL,
  INITIAL_ARCHIVE_DOCUMENTS,
  SPRIN_TEMPLATES,
} from '../sprin/data/defaultData';
import {
  AppView,
  LetterPreviewPage,
  SprinDocument,
  SprinTemplatePreset,
} from '../sprin/types/sprin';
import { exportSprinToWord } from '../sprin/utils/exportDoc';
import { exportSprinToPdf } from '../sprin/utils/exportPdf';

const STORAGE_KEYS = {
  ACTIVE_DOC: 'siprin_active_doc_v2',
  ARCHIVE: 'siprin_archive_docs_v2',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeDoc(doc: SprinDocument): SprinDocument {
  const rawHeaderTitle = (doc.lampiranHeaderTitle || '').trim();
  const normalizedHeaderTitle =
    !rawHeaderTitle ||
    rawHeaderTitle === 'LAMPIRAN SPRIN KAPOLSEK SMG SLTN' ||
    rawHeaderTitle === 'LAMPIRAN  SPRIN  KAPOLSEK  SMG SLTN' ||
    rawHeaderTitle === 'SPRIN KAPOLSEK SMG SELATAN'
      ? 'LAMP SPRIN KAPOLSEK SMG SELATAN'
      : doc.lampiranHeaderTitle;

  const rawKepadaText = (doc.kepadaText || '').trim();
  const normalizedKepadaText =
    !rawKepadaText ||
    rawKepadaText ===
      'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI.'
      ? DEFAULT_SPRIN_DOCUMENT.kepadaText
      : doc.kepadaText;

  const personelCount = Array.isArray(doc.personelList) ? doc.personelList.length : 0;

  return {
    ...DEFAULT_SPRIN_DOCUMENT,
    ...doc,
    useLampiran: (doc.useLampiran ?? false) || personelCount > 5,
    kepadaText: normalizedKepadaText,
    lampiranHeaderTitle: normalizedHeaderTitle,
    lampiranColWidths: {
      ...DEFAULT_LAMPIRAN_COL_WIDTHS,
      ...(doc.lampiranColWidths || {}),
    },
    stampConfig: {
      ...DEFAULT_STAMP_CONFIG,
      ...(doc.stampConfig || {}),
      stampImageDataUrl: doc.stampConfig?.stampImageDataUrl || DEFAULT_STAMP_IMAGE_URL,
    },
  };
}

interface SprinWorkspaceViewProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  pendingPiketSync?: { isoDate: string; nonce: number } | null;
  onConsumePendingPiketSync?: () => void;
}

export const SprinWorkspaceView: React.FC<SprinWorkspaceViewProps> = ({
  activeView,
  onChangeView,
  pendingPiketSync,
  onConsumePendingPiketSync,
}) => {
  const [activeSection, setActiveSection] = useState<EditorSectionId>('hal1');
  const [previewPage, setPreviewPage] = useState<LetterPreviewPage>('both');
  const [zoom, setZoom] = useState<number>(0.45);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [piketImportDate, setPiketImportDate] = useState<string>('2026-11-21');
  const [piketSyncPreset, setPiketSyncPreset] = useState<PiketSyncPreset>('piket_dan_pam');
  const [syncDateHeaders, setSyncDateHeaders] = useState<boolean>(true);
  const [piketPickerOpen, setPiketPickerOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [keepPersonnelOnTemplate, setKeepPersonnelOnTemplate] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('sprin-print-mode');
    return () => {
      document.body.classList.remove('sprin-print-mode');
    };
  }, []);

  const [activeDoc, setActiveDoc] = useState<SprinDocument>(() =>
    normalizeDoc(readStorage<SprinDocument>(STORAGE_KEYS.ACTIVE_DOC, DEFAULT_SPRIN_DOCUMENT))
  );

  const [archiveDocs, setArchiveDocs] = useState<SprinDocument[]>(() => {
    const stored = readStorage<SprinDocument[]>(
      STORAGE_KEYS.ARCHIVE,
      INITIAL_ARCHIVE_DOCUMENTS
    ).map(normalizeDoc);
    const existingIds = new Set(stored.map((d) => d.id));
    const missingTemplates = INITIAL_ARCHIVE_DOCUMENTS.filter(
      (tpl) => !existingIds.has(tpl.id)
    ).map(normalizeDoc);
    return missingTemplates.length > 0 ? [...stored, ...missingTemplates] : stored;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DOC, JSON.stringify(activeDoc));
    } catch {
      // ignore
    }
  }, [activeDoc]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archiveDocs));
    } catch {
      // ignore
    }
  }, [archiveDocs]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const completionPercent = useMemo(() => {
    const checks = [
      Boolean(activeDoc.kopLine1.trim()),
      Boolean(activeDoc.kopLine2.trim()),
      Boolean(activeDoc.nomorSprin.trim()),
      Boolean(activeDoc.pertimbangan.trim()),
      activeDoc.dasarList.length > 0,
      activeDoc.untukList.length > 0,
      activeDoc.personelList.length > 0,
      Boolean(activeDoc.pejabatNama.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [activeDoc]);

  const { chunks: lampiranPages, lampiranMeasurerNode } = useLampiranPages(activeDoc);
  const { slices: pageOneSlices, measurerNode } = useSprinPageOneSlices(activeDoc);

  const autoFirstPageCatchword =
    pageOneSlices.length > 1 ? computePageOneCatchword(activeDoc, pageOneSlices[1]) : undefined;
  const firstPageCatchword = (activeDoc.kataSambung || '').trim() || autoFirstPageCatchword || '';

  const totalPageCount = activeDoc.useLampiran
    ? pageOneSlices.length + lampiranPages.length
    : pageOneSlices.length;

  const handleSaveToArchive = () => {
    const stampedDoc: SprinDocument = {
      ...activeDoc,
      updatedAt: new Date().toISOString(),
    };
    setArchiveDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === stampedDoc.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = stampedDoc;
        return next;
      }
      return [stampedDoc, ...prev];
    });
    showToast(`Surat ${stampedDoc.nomorSprin} disimpan ke arsip`);
  };

  const handleCreateNewSprin = () => {
    const nextNum = 1489 + archiveDocs.length;
    const blankDoc: SprinDocument = {
      ...DEFAULT_SPRIN_DOCUMENT,
      id: `sprin-${Date.now()}`,
      status: 'Draft',
      useLampiran: false,
      updatedAt: new Date().toISOString(),
      nomorSprin: `Sprin/ ${nextNum} /XI/KEP./2026`,
      pertimbangan:
        'guna tertib administrasi khususnya dalam rangka pelaksanaan tugas di lingkungan kesatuan, dipandang perlu mengeluarkan surat perintah.',
      untukList: [
        'melaksanakan tugas sesuai ploting dan arahan pimpinan;',
        'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
        'surat perintah ini berlaku sejak dikeluarkan.',
      ],
      lampiranNomor: `SPRIN/ ${nextNum} /XI/KEP./2026`,
      personelList: [],
    };
    setActiveDoc(blankDoc);
    onChangeView('editor');
    setActiveSection('hal1');
    showToast(`Draft Surat Perintah baru (${nextNum}) siap diisi`);
  };

  const handleApplyTemplate = (template: SprinTemplatePreset) => {
    const base = normalizeDoc(template.doc);
    let nextPersonel = base.personelList.map((p) => ({ ...p }));
    let nextDateFields: Partial<SprinDocument> = {};

    if (keepPersonnelOnTemplate) {
      nextPersonel = activeDoc.personelList.map((p) => ({ ...p }));
    } else if (template.id === 'template-polsek-piket-pam') {
      nextPersonel = buildSprinPersonnelFromPiket(piketImportDate, piketSyncPreset);
      const dateFmt = formatIndonesianDateForSprin(piketImportDate);
      if (dateFmt) {
        nextDateFields = {
          tanggalKegiatan: piketImportDate,
          lampiranSubjudul: `PADA HARI ${dateFmt.dayNameUpper} TANGGAL ${dateFmt.dateUpper}`,
          lampiranTanggalUpper: dateFmt.dateUpper,
        };
      }
    }

    setActiveDoc({
      ...base,
      ...nextDateFields,
      personelList: nextPersonel,
      useLampiran: base.useLampiran || nextPersonel.length > 5,
      updatedAt: new Date().toISOString(),
    });
    setTemplatePickerOpen(false);
    onChangeView('editor');
    setActiveSection('hal1');
    showToast(`Template "${template.title}" diterapkan`);
  };

  const handleOpenFromArchive = (doc: SprinDocument) => {
    setActiveDoc({ ...doc });
    onChangeView('editor');
    showToast(`Membuka ${doc.nomorSprin}`);
  };

  const handleDuplicateArchive = (doc: SprinDocument) => {
    const copy: SprinDocument = {
      ...doc,
      id: `sprin-${Date.now()}`,
      status: 'Draft',
      nomorSprin: `${doc.nomorSprin} (Salinan)`,
      updatedAt: new Date().toISOString(),
    };
    setArchiveDocs((prev) => [copy, ...prev]);
    showToast('Surat berhasil diduplikasi ke arsip');
  };

  const handleDeleteArchive = (id: string) => {
    setArchiveDocs((prev) => prev.filter((d) => d.id !== id));
    showToast('Surat dihapus dari arsip');
  };

  const applyPiketSync = useCallback(
    (isoDate: string, preset: PiketSyncPreset, updateHeaders = true, targetSection?: EditorSectionId) => {
      const syncedRows = buildSprinPersonnelFromPiket(isoDate, preset);
      const dateFmt = formatIndonesianDateForSprin(isoDate);

      setActiveDoc((prev) => ({
        ...prev,
        tanggalKegiatan: isoDate,
        personelList: syncedRows,
        useLampiran: syncedRows.length > 5,
        ...(updateHeaders && dateFmt
          ? {
              lampiranSubjudul: `PADA HARI ${dateFmt.dayNameUpper} TANGGAL ${dateFmt.dateUpper}`,
              lampiranTanggalUpper: dateFmt.dateUpper,
            }
          : {}),
        updatedAt: new Date().toISOString(),
      }));
      setPiketPickerOpen(false);
      onChangeView('editor');
      if (targetSection) {
        setActiveSection(targetSection);
      }
      showToast(
        `${syncedRows.length} Pers PAM disinkronkan dari Jadwal Piket (${
          dateFmt ? dateFmt.dateTitle : isoDate
        })`
      );
    },
    [onChangeView, showToast]
  );

  useEffect(() => {
    if (!pendingPiketSync) return;
    setPiketImportDate(pendingPiketSync.isoDate);
    applyPiketSync(pendingPiketSync.isoDate, 'piket_dan_pam', true, 'hal2');
    onConsumePendingPiketSync?.();
  }, [pendingPiketSync, applyPiketSync, onConsumePendingPiketSync]);

  const handleImportFromJadwalPiket = () => {
    applyPiketSync(piketImportDate, piketSyncPreset, syncDateHeaders);
  };

  const handleExportPdf = async () => {
    if (!printContainerRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const pageCount = await exportSprinToPdf(printContainerRef.current, activeDoc.nomorSprin);
      showToast(`File .PDF (A4 · ${pageCount} Halaman) berhasil diunduh`);
    } catch {
      showToast('Gagal membuat file .PDF. Silakan coba lagi.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
    if (window.self !== window.top) {
      showToast('Jika dialog cetak diblokir di pratinjau, gunakan tombol "Cetak PDF".');
    }
  };

  return (
    <div>
      {/* SCREEN WORKSPACE */}
      <div className="no-print space-y-5">
        {/* KeroUI Top Page Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <QuickWinsEmblem className="h-11 w-11 shrink-0" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Polsek Semarang Selatan · Surat Perintah (SIPRIN)
              </div>
              <h1 className="mt-0.5 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Buat Surat Perintah &amp; Lampiran A4
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Nomor aktif: <span className="font-mono font-semibold text-slate-700">{activeDoc.nomorSprin}</span> ·{' '}
                {totalPageCount} Halaman A4 · Kelengkapan {completionPercent}%
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tarik dari Jadwal Piket */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTemplatePickerOpen(false);
                  setPiketPickerOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <CalendarCheck className="h-3.5 w-3.5" style={{ color: 'var(--kero-accent)' }} />
                Tarik Jadwal Piket
              </button>

              {piketPickerOpen && (
                <div className="absolute right-0 top-11 z-30 w-80 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg space-y-2.5">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Sinkronkan Pers PAM dari Jadwal Piket
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Otomatis menarik personel piket &amp; perubahan jadwal (mulai Okt 2026).
                    </p>
                  </div>
                  <input
                    type="date"
                    min="2026-10-01"
                    value={piketImportDate}
                    onChange={(e) => setPiketImportDate(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                  <select
                    value={piketSyncPreset}
                    onChange={(e) => setPiketSyncPreset(e.target.value as PiketSyncPreset)}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="piket_dan_pam">Piket Aktif + PAM Obvit</option>
                    <option value="piket_aktif">Piket Aktif Saja (X / S / M / P)</option>
                    <option value="pam_obvit">PAM Obvit / Jaga Bank Saja</option>
                    <option value="siang">Piket Siang (Kode S)</option>
                    <option value="malam">Piket Malam (Kode M)</option>
                    <option value="cadangan">Cadangan Intel &amp; Reskrim</option>
                    <option value="semua">Seluruh Personel Polsek</option>
                  </select>
                  <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncDateHeaders}
                      onChange={(e) => setSyncDateHeaders(e.target.checked)}
                      style={{ accentColor: 'var(--kero-accent)' }}
                      className="rounded cursor-pointer"
                    />
                    <span>Perbarui tanggal &amp; subjudul lampiran</span>
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPiketPickerOpen(false)}
                      className="rounded px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleImportFromJadwalPiket}
                      className="rounded px-3 py-1 text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--kero-accent)' }}
                    >
                      Sinkronkan
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveToArchive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              Simpan Arsip
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await exportSprinToWord(activeDoc, firstPageCatchword);
                  showToast('File .DOCX (A4 · Arial 12pt) berhasil diunduh');
                } catch {
                  showToast('Gagal membuat file .DOCX');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5 text-sky-600" />
              Word (.docx)
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: 'var(--kero-accent)' }}
            >
              {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              Cetak PDF
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* KeroUI Sub-Navigation Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-2.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'editor', label: 'Editor & Pratinjau A4', Icon: FileText },
                { id: 'arsip', label: `Arsip Surat (${archiveDocs.length})`, Icon: Archive },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeView(id)}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active ? 'text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewSprin}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <FilePlus2 className="h-3.5 w-3.5" style={{ color: 'var(--kero-accent)' }} />
              Draft Baru
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPiketPickerOpen(false);
                  setTemplatePickerOpen((v) => !v);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LayoutTemplate className="h-3.5 w-3.5" style={{ color: 'var(--kero-accent)' }} />
                <span>Template Surat ({SPRIN_TEMPLATES.length})</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {templatePickerOpen && (
                <div className="absolute right-0 top-10 z-30 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Template Surat Perintah (BUAT-SPRIN)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih format template resmi untuk dimuat ke editor surat.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepPersonnelOnTemplate}
                      onChange={(e) => setKeepPersonnelOnTemplate(e.target.checked)}
                      style={{ accentColor: 'var(--kero-accent)' }}
                      className="rounded cursor-pointer"
                    />
                    <span>Pertahankan daftar Pers PAM yang sedang aktif ({activeDoc.personelList.length} pers)</span>
                  </label>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
                    {SPRIN_TEMPLATES.map((tpl) => {
                      const isCurrent = activeDoc.id === tpl.doc.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className={`w-full text-left rounded-lg border p-2.5 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'border-slate-300 bg-slate-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800">
                              {tpl.title}
                            </span>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor: 'var(--kero-accent-soft)',
                                color: 'var(--kero-accent)',
                              }}
                            >
                              {tpl.badge}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500 leading-snug">
                            {tpl.subtitle}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{tpl.category}</span>
                            <span>
                              {tpl.id === 'template-polsek-piket-pam'
                                ? 'Sinkronisasi Piket Aktif'
                                : `${tpl.doc.personelList.length} personel contoh`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active SIPRIN Content Area */}
        <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
          {activeView === 'editor' && (
            <div className="flex flex-col xl:flex-row">
              {/* Left Editor Form */}
              <div className="w-full shrink-0 border-b border-slate-200 bg-slate-50/50 p-4 xl:w-[460px] 2xl:w-[500px] xl:border-b-0 xl:border-r xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto">
                <SprinEditorForm
                  doc={activeDoc}
                  onChange={setActiveDoc}
                  piketImportDate={piketImportDate}
                  onChangePiketImportDate={setPiketImportDate}
                  onSyncPersPamFromPiket={(preset, updateHeaders) =>
                    applyPiketSync(piketImportDate, preset, updateHeaders)
                  }
                  activeSection={activeSection}
                  onChangeSection={setActiveSection}
                  autoCatchword={autoFirstPageCatchword}
                />
              </div>

              {/* Right Live A4 Preview */}
              <div className="flex min-w-0 flex-1 flex-col bg-[#eef1f4] xl:max-h-[calc(100vh-220px)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" style={{ color: 'var(--kero-accent)' }} />
                    <span className="text-xs font-semibold text-slate-800">Pratinjau Dokumen A4</span>
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      · Klik area surat untuk langsung mengedit
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeDoc.useLampiran ? (
                      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                        {(
                          [
                            { id: 'both', label: `Semua (${totalPageCount} Hal)` },
                            { id: 'page1', label: `Isi Sprin (${pageOneSlices.length} Hal)` },
                            { id: 'page2', label: `Lampiran (${lampiranPages.length} Hal)` },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPreviewPage(tab.id)}
                            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              previewPage === tab.id
                                ? 'text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            style={previewPage === tab.id ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="rounded-md px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: 'var(--kero-accent-soft)', color: 'var(--kero-accent)' }}
                      >
                        {pageOneSlices.length} Halaman · Tanpa Lampiran
                      </span>
                    )}

                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                      <button
                        type="button"
                        aria-label="Perkecil pratinjau"
                        onClick={() => setZoom((z) => Math.max(0.45, +(z - 0.1).toFixed(2)))}
                        className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono-num w-11 text-center text-xs font-semibold text-slate-700">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        aria-label="Perbesar pratinjau"
                        onClick={() => setZoom((z) => Math.min(1.1, +(z + 0.1).toFixed(2)))}
                        className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center gap-8 overflow-auto p-6">
                  {(!activeDoc.useLampiran || previewPage === 'both' || previewPage === 'page1') &&
                    pageOneSlices.map((slice, sIdx) => {
                      const sliceCatchword =
                        sIdx === 0 && (activeDoc.kataSambung || '').trim()
                          ? activeDoc.kataSambung!.trim()
                          : sIdx < pageOneSlices.length - 1
                            ? computePageOneCatchword(activeDoc, pageOneSlices[sIdx + 1])
                            : undefined;
                      return (
                        <div key={`page-one-slice-${sIdx}`} className="flex flex-col items-center">
                          <div className="mb-2 flex w-full items-center justify-between px-1 text-xs font-medium text-slate-500">
                            <span>
                              {sIdx === 0
                                ? activeDoc.useLampiran
                                  ? 'Halaman 1 — Surat Perintah'
                                  : pageOneSlices.length === 1
                                    ? 'Surat Perintah (1 Halaman — Tanpa Lampiran)'
                                    : 'Halaman 1 — Surat Perintah'
                                : `Halaman ${sIdx + 1} — Lanjutan Surat Perintah`}
                            </span>
                            <span className="font-mono-num">A4 · 210 × 297 mm</span>
                          </div>
                          <div
                            style={{
                              width: `calc(210mm * ${zoom})`,
                              height: `calc(297mm * ${zoom})`,
                            }}
                            className="relative shrink-0 shadow-md ring-1 ring-slate-200"
                          >
                            <div
                              style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                              }}
                            >
                              <LetterPageOne
                                doc={activeDoc}
                                slice={slice}
                                catchword={sliceCatchword}
                                onFocusSection={setActiveSection}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {activeDoc.useLampiran &&
                    (previewPage === 'both' || previewPage === 'page2') &&
                    lampiranPages.map((chunk, pIdx) => {
                      const chunkCatchword =
                        pIdx < lampiranPages.length - 1
                          ? computeLampiranCatchword(lampiranPages[pIdx + 1])
                          : undefined;
                      return (
                        <div key={`lampiran-page-${pIdx}`} className="flex flex-col items-center">
                          <div className="mb-2 flex w-full items-center justify-between px-1 text-xs font-medium text-slate-500">
                            <span>Halaman {pageOneSlices.length + pIdx + 1} — Lampiran Daftar Personel</span>
                            <span className="font-mono-num">
                              {chunk.rows.length} / {activeDoc.personelList.length} Personel
                            </span>
                          </div>
                          <div
                            style={{
                              width: `calc(210mm * ${zoom})`,
                              height: `calc(297mm * ${zoom})`,
                            }}
                            className="relative shrink-0 shadow-md ring-1 ring-slate-200"
                          >
                            <div
                              style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                              }}
                            >
                              <LetterPageTwo
                                doc={activeDoc}
                                pageChunk={chunk}
                                lampiranPageNumber={pIdx + 1}
                                catchword={chunkCatchword}
                                onFocusSection={setActiveSection}
                                onUpdateColWidths={(widths) =>
                                  setActiveDoc((prev) => ({
                                    ...prev,
                                    lampiranColWidths: widths,
                                    updatedAt: new Date().toISOString(),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {activeView === 'arsip' && (
            <ArchiveView
              documents={archiveDocs}
              activeDocId={activeDoc.id}
              onOpenInEditor={handleOpenFromArchive}
              onDuplicate={handleDuplicateArchive}
              onDelete={handleDeleteArchive}
              onCreateNew={handleCreateNewSprin}
            />
          )}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Offscreen Measurers */}
      {measurerNode}
      {lampiranMeasurerNode}

      {/* Print / PDF Container */}
      <div
        ref={printContainerRef}
        aria-hidden="true"
        className="print-only-container pointer-events-none fixed -left-[99999px] top-0 select-none"
      >
        {pageOneSlices.map((slice, sIdx) => {
          const sliceCatchword =
            sIdx === 0 && (activeDoc.kataSambung || '').trim()
              ? activeDoc.kataSambung!.trim()
              : sIdx < pageOneSlices.length - 1
                ? computePageOneCatchword(activeDoc, pageOneSlices[sIdx + 1])
                : undefined;
          return (
            <LetterPageOne
              key={`print-page1-${sIdx}`}
              doc={activeDoc}
              slice={slice}
              catchword={sliceCatchword}
            />
          );
        })}
        {(activeDoc.useLampiran || activeDoc.personelList.length > 5) &&
          lampiranPages.map((chunk, pIdx) => {
            const chunkCatchword =
              pIdx < lampiranPages.length - 1
                ? computeLampiranCatchword(lampiranPages[pIdx + 1])
                : undefined;
            return (
              <LetterPageTwo
                key={`print-lampiran-${pIdx}`}
                doc={activeDoc}
                pageChunk={chunk}
                lampiranPageNumber={pIdx + 1}
                catchword={chunkCatchword}
              />
            );
          })}
      </div>
    </div>
  );
};
