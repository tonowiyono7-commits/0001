import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  getLampiranHeaderTitle,
  getNormalizedLampiranColWidths,
  getSprinContinuationHeaderTitle,
  LAMPIRAN_COL_MIN_WIDTHS,
  LAMPIRAN_TABLE_TOTAL_MM,
} from '../data/defaultData';
import { LampiranColumnWidths, PersonnelRow, SprinDocument } from '../types/sprin';
import { PolsekStampAndSignature } from './PolriEmblems';

const LAMPIRAN_COL_KEYS: (keyof LampiranColumnWidths)[] = [
  'no',
  'nama',
  'pangkat',
  'nrp',
  'jabatan',
  'ket',
];
const LAMPIRAN_COL_LABELS = ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'] as const;

export interface LampiranPageChunk {
  rows: PersonnelRow[];
  startIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export function paginateLampiranPersonnel(list: PersonnelRow[]): LampiranPageChunk[] {
  if (list.length <= 11) {
    return [
      {
        rows: list,
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
      },
    ];
  }

  const chunks: LampiranPageChunk[] = [];
  let cursor = 0;
  const firstPageLimit = 14;
  const middlePageLimit = 18;
  const lastPageLimit = 12;

  // First Lampiran page (has Kop + Judul)
  const firstSlice = list.slice(0, firstPageLimit);
  cursor += firstSlice.length;
  chunks.push({
    rows: firstSlice,
    startIndex: 0,
    isFirstPage: true,
    isLastPage: false,
  });

  // Subsequent Lampiran pages
  while (cursor < list.length) {
    const remaining = list.length - cursor;
    if (remaining <= lastPageLimit) {
      chunks.push({
        rows: list.slice(cursor),
        startIndex: cursor,
        isFirstPage: false,
        isLastPage: true,
      });
      cursor = list.length;
    } else {
      const nextSlice = list.slice(cursor, cursor + middlePageLimit);
      chunks.push({
        rows: nextSlice,
        startIndex: cursor,
        isFirstPage: false,
        isLastPage: false,
      });
      cursor += nextSlice.length;
    }
  }

  // If the last chunk exceeded lastPageLimit because of edge case, ensure signature page exists
  const last = chunks[chunks.length - 1];
  if (!last.isLastPage) {
    chunks.push({
      rows: [],
      startIndex: cursor,
      isFirstPage: false,
      isLastPage: true,
    });
  }

  return chunks;
}

export function useLampiranPages(doc: SprinDocument): {
  chunks: LampiranPageChunk[];
  lampiranMeasurerNode: React.ReactNode;
} {
  const [chunks, setChunks] = useState<LampiranPageChunk[]>(() =>
    paginateLampiranPersonnel(doc.personelList)
  );

  const fullMaxHeightRef = useRef<HTMLDivElement>(null);
  const breakMaxHeightRef = useRef<HTMLDivElement>(null);
  const headerPadRef = useRef<HTMLDivElement>(null);
  const kopTitleRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const signatureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const fullMaxH = fullMaxHeightRef.current?.offsetHeight || 990; // 262mm (margin atas 2cm - margin bawah 1,5cm)
    const breakMaxH = breakMaxHeightRef.current?.offsetHeight || 971; // 257mm (menyisakan 1 baris untuk kata sambung)
    const headerPadH = headerPadRef.current?.offsetHeight || 75; // 20mm ruang di bawah header
    const kopTitleH = kopTitleRef.current?.offsetHeight || 0;
    const theadH = theadRef.current?.offsetHeight || 50;
    const sigH = signatureRef.current?.offsetHeight || 190;
    const rowHeights = doc.personelList.map((_, i) => rowRefs.current[i]?.offsetHeight || 28);

    if (doc.personelList.length === 0) {
      setChunks([
        {
          rows: [],
          startIndex: 0,
          isFirstPage: true,
          isLastPage: true,
        },
      ]);
      return;
    }

    const pages: LampiranPageChunk[] = [];
    let cursor = 0;
    let isFirst = true;

    while (cursor < doc.personelList.length) {
      let usedH = (isFirst ? kopTitleH : headerPadH) + theadH;
      const pageRows: PersonnelRow[] = [];
      const pageStart = cursor;

      while (cursor < doc.personelList.length) {
        const remainingRowsH = rowHeights
          .slice(cursor)
          .reduce((sum, h) => sum + h, 0);
        const allFitWithSig = usedH + remainingRowsH + sigH <= fullMaxH;
        const limit = allFitWithSig ? fullMaxH : breakMaxH;
        const nextRowH = rowHeights[cursor];

        if (pageRows.length > 0 && usedH + nextRowH > limit) {
          break;
        }
        pageRows.push(doc.personelList[cursor]);
        usedH += nextRowH;
        cursor += 1;
      }

      const isLastAfterRows = cursor >= doc.personelList.length;
      if (isLastAfterRows && usedH + sigH <= fullMaxH) {
        pages.push({
          rows: pageRows,
          startIndex: pageStart,
          isFirstPage: isFirst,
          isLastPage: true,
        });
      } else {
        pages.push({
          rows: pageRows,
          startIndex: pageStart,
          isFirstPage: isFirst,
          isLastPage: false,
        });
      }
      isFirst = false;
    }

    const lastPage = pages[pages.length - 1];
    if (!lastPage || !lastPage.isLastPage) {
      pages.push({
        rows: [],
        startIndex: doc.personelList.length,
        isFirstPage: false,
        isLastPage: true,
      });
    }

    setChunks(pages);
  }, [doc]);

  const lampiranMeasurerNode = (
    <div
      aria-hidden="true"
      className="no-print"
      style={{
        position: 'fixed',
        left: '-99999px',
        top: 0,
        width: '170mm',
        visibility: 'hidden',
        pointerEvents: 'none',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.0',
      }}
    >
      <div ref={fullMaxHeightRef} style={{ height: '262mm' }} />
      <div ref={breakMaxHeightRef} style={{ height: '257mm' }} />
      <div ref={headerPadRef} style={{ height: '20mm' }} />

      <div ref={kopTitleRef} className="flow-root">
        <div className="mb-5">
          <div className="inline-block max-w-[74mm] text-center border-b border-black pb-0.5 leading-[1.0] font-arial-12">
            <div>{doc.kopLine1}</div>
            <div>{doc.kopLine2}</div>
            <div>{doc.kopLine3}</div>
          </div>
        </div>
        <div className="text-center mb-4 py-1">
          <div className="uppercase text-[12pt] leading-[1.0]">{doc.lampiranJudul}</div>
          <div className="inline-block uppercase text-[12pt] leading-[1.0] border-b border-black px-3 pb-0.5 mt-0.5">
            {doc.lampiranSubjudul}
          </div>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse text-[12pt] leading-[1.0]">
        <colgroup>
          {LAMPIRAN_COL_KEYS.map((key) => {
            const norm = getNormalizedLampiranColWidths(doc.lampiranColWidths);
            return <col key={`mcol-${key}`} style={{ width: `${norm[key]}mm` }} />;
          })}
        </colgroup>
        <thead ref={theadRef}>
          <tr>
            {LAMPIRAN_COL_LABELS.map((label) => (
              <th key={`mth-${label}`} className="border border-black px-1.5 py-1.5 font-normal text-center">
                {label}
              </th>
            ))}
          </tr>
          <tr className="text-[12pt]">
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">1</th>
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">2</th>
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">3</th>
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">4</th>
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">5</th>
            <th className="border-x border-t border-b-0 border-black px-1 py-0.5 font-normal text-center">6</th>
          </tr>
        </thead>
        <tbody>
          {doc.personelList.map((person, index) => {
            const rowBorderClass =
              index === doc.personelList.length - 1
                ? 'border-x border-t-0 border-b border-black'
                : 'border-x border-t-0 border-b-0 border-black';
            return (
              <tr
                key={`measure-lrow-${person.id}-${index}`}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
              >
                <td className={`${rowBorderClass} px-1.5 py-1 text-center align-middle tabular-nums break-words`}>
                  {index + 1}
                </td>
                <td className={`${rowBorderClass} px-2 py-1 text-left align-middle uppercase break-words`}>
                  {person.nama}
                </td>
                <td className={`${rowBorderClass} px-2 py-1 text-center align-middle uppercase break-words`}>
                  {person.pangkat}
                </td>
                <td className={`${rowBorderClass} px-2 py-1 text-center align-middle tabular-nums break-words`}>
                  {person.nrp}
                </td>
                <td className={`${rowBorderClass} px-2 py-1 text-center align-middle uppercase leading-[1.0] break-words`}>
                  {person.jabatan}
                </td>
                <td className={`${rowBorderClass} px-1.5 py-1 text-center align-middle uppercase break-words`}>
                  {person.ket}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div ref={signatureRef} className="flow-root">
        <div className="mt-6 flex justify-end">
          <div className="inline-flex flex-col items-center text-[12pt] leading-[1.0]">
            <div className="flex justify-center">
              <div className="inline-block border-b border-black pb-0.5 space-y-0.5">
                <div className="flex">
                  <span className="w-[120px] shrink-0">Dikeluarkan di</span>
                  <span className="w-4 shrink-0">:</span>
                  <span>{doc.dikeluarkanDi}</span>
                </div>
                <div className="flex">
                  <span className="w-[120px] shrink-0">pada tanggal</span>
                  <span className="w-4 shrink-0">:</span>
                  <span className="whitespace-pre-wrap">{doc.tanggalSuratHal2}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 w-full flex justify-end text-[12pt] leading-[1.0]">
              <div className="whitespace-nowrap text-right">
                {doc.pejabatJabatan.replace(/\s+/g, ' ').trim()}
              </div>
            </div>
            <div className="h-[68px]" />
            <div className="text-center leading-[1.0] flex justify-center">
              <div className="inline-flex flex-col items-center">
                <div className="w-full border-b border-black px-2 pb-0.5 text-center uppercase">
                  {doc.pejabatNama}
                </div>
                <div className="uppercase mt-0.5 text-[12pt] leading-[1.0] text-center">
                  {doc.pejabatPangkatNrp}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return { chunks, lampiranMeasurerNode };
}

export function extractCatchWords(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words[0].length <= 3 && words.length > 1) {
    return `${words[0]} ${words[1]}`;
  }
  return words[0];
}

export function computeLampiranCatchword(nextChunk: LampiranPageChunk): string {
  if (nextChunk.rows.length > 0) {
    const firstRow = nextChunk.rows[0];
    const num = nextChunk.startIndex + 1;
    const firstNameWord = extractCatchWords(firstRow.nama).toUpperCase();
    return firstNameWord ? `${num}. ${firstNameWord} .....` : `${num}. .....`;
  }
  return 'Dikeluarkan di .....';
}

export const KataSambungFooter: React.FC<{
  text?: string;
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
}> = ({ text, onFocusSection }) => {
  if (!text || !text.trim()) return null;
  return (
    <div
      className="absolute bottom-[15mm] right-[15mm] z-10 text-right text-[12pt] leading-[1.0] cursor-pointer hover:bg-amber-50/50 transition-colors rounded-sm"
      onClick={(e) => {
        e.stopPropagation();
        onFocusSection?.('hal1');
      }}
      title="Kata sambung ke halaman berikutnya (klik untuk mengedit)"
    >
      {text}
    </div>
  );
};

interface LetterPageTwoProps {
  doc: SprinDocument;
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
  onUpdateColWidths?: (widths: LampiranColumnWidths) => void;
  pageChunk?: LampiranPageChunk;
  lampiranPageNumber?: number;
  catchword?: string;
}

export const ContinuationPageHeader: React.FC<{
  doc: SprinDocument;
  pageNumber?: number;
  mode?: 'sprin' | 'lampiran';
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
}> = ({ doc, pageNumber, mode = 'lampiran', onFocusSection }) => {
  const headerTitle =
    mode === 'sprin'
      ? getSprinContinuationHeaderTitle(doc)
      : getLampiranHeaderTitle(doc);
  const headerNomor = (doc.lampiranNomor || doc.nomorSprin.toUpperCase()).trim();
  const headerTanggal = (
    doc.lampiranTanggalUpper ||
    doc.tanggalSuratHal1.replace(/\s+/g, ' ').trim().toUpperCase()
  ).trim();

  return (
    <>
      {typeof pageNumber === 'number' &&
        (mode === 'lampiran' ? pageNumber >= 1 : pageNumber >= 2) && (
          <div className="absolute top-[20mm] left-1/2 -translate-x-1/2 z-10 text-[12pt] leading-[1.0] tabular-nums">
            {pageNumber}
          </div>
        )}
      <div
        className="absolute top-[20mm] right-[15mm] z-10 text-[12pt] leading-[1.0] min-w-[78mm] max-w-[85mm] cursor-pointer hover:bg-amber-50/50 transition-colors rounded-sm"
        onClick={(e) => {
          e.stopPropagation();
          onFocusSection?.('hal2');
        }}
        title={
          mode === 'sprin'
            ? 'Header Lanjutan Isi Sprin (klik untuk mengedit)'
            : 'Header Halaman Lampiran (klik untuk mengedit)'
        }
      >
        <div className="border-b border-black pb-0.5 tracking-[0.01em] whitespace-pre-wrap">
          {headerTitle}
        </div>
        <div className="border-b border-black pb-0.5 flex">
          <span className="w-[84px] shrink-0">NOMOR</span>
          <span className="w-3 shrink-0">:</span>
          <span className="whitespace-pre-wrap">{headerNomor}</span>
        </div>
        <div className="border-b border-black pb-0.5 flex">
          <span className="w-[84px] shrink-0">TANGGAL</span>
          <span className="w-3 shrink-0">:</span>
          <span className="whitespace-pre-wrap">{headerTanggal}</span>
        </div>
      </div>
    </>
  );
};

export const LetterPageTwo: React.FC<LetterPageTwoProps> = ({
  doc,
  onFocusSection,
  onUpdateColWidths,
  pageChunk,
  lampiranPageNumber = 1,
  catchword,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const colWidths = getNormalizedLampiranColWidths(doc.lampiranColWidths);

  const handleStartColumnResize = (colIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!onUpdateColWidths) return;
    e.preventDefault();
    e.stopPropagation();

    const leftKey = LAMPIRAN_COL_KEYS[colIdx];
    const rightKey = LAMPIRAN_COL_KEYS[colIdx + 1];
    if (!leftKey || !rightKey) return;

    const tableRect = tableRef.current?.getBoundingClientRect();
    const tablePx = tableRect?.width || 642;
    const mmPerPx = LAMPIRAN_TABLE_TOTAL_MM / tablePx;
    const startX = e.clientX;
    const startSnapshot = { ...colWidths };
    const startLeft = startSnapshot[leftKey];
    const startRight = startSnapshot[rightKey];
    const minDelta = LAMPIRAN_COL_MIN_WIDTHS[leftKey] - startLeft;
    const maxDelta = startRight - LAMPIRAN_COL_MIN_WIDTHS[rightKey];

    const onMouseMove = (moveEvt: MouseEvent) => {
      const rawDelta = (moveEvt.clientX - startX) * mmPerPx;
      const clampedDelta = Math.max(minDelta, Math.min(maxDelta, rawDelta));
      onUpdateColWidths({
        ...startSnapshot,
        [leftKey]: +(startLeft + clampedDelta).toFixed(1),
        [rightKey]: +(startRight - clampedDelta).toFixed(1),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const chunk: LampiranPageChunk = pageChunk ?? {
    rows: doc.personelList,
    startIndex: 0,
    isFirstPage: true,
    isLastPage: true,
  };

  return (
    <div
      className="letter-paper print-page-sheet relative mx-auto bg-white text-black shadow-2xl"
      style={{
        padding: '20mm 15mm 15mm 25mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12pt',
        lineHeight: '1.0',
      }}
    >
      {/* Page Header: Nomor halaman (mulai 1) + LAMP SPRIN ... / NOMOR / TANGGAL (2 cm dari tepi batas atas halaman) */}
      <ContinuationPageHeader
        doc={doc}
        pageNumber={lampiranPageNumber}
        mode="lampiran"
        onFocusSection={onFocusSection}
      />

      {/* Pada Lampiran halaman 1, Kop Surat sejajar dengan Header kanan atas di posisi 2 cm; halaman 2+ diberi ruang pt-[20mm] di bawah header */}
      <div className={!chunk.isFirstPage ? 'pt-[20mm]' : ''}>
      {/* Top Kop Surat (pada halaman Lampiran pertama, sejajar dengan header LAMP SPRIN) */}
      {chunk.isFirstPage && (
        <>
          <div
            className="mb-5 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm"
            onClick={() => onFocusSection?.('hal2')}
            title="Klik untuk mengedit Kop Surat"
          >
            <div className="inline-block max-w-[74mm] text-center border-b border-black pb-0.5 leading-[1.0] font-arial-12">
              <div>{doc.kopLine1}</div>
              <div>{doc.kopLine2}</div>
              <div>{doc.kopLine3}</div>
            </div>
          </div>

          {/* Centered Lampiran Title */}
          <div
            className="text-center mb-4 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm py-1"
            onClick={() => onFocusSection?.('hal2')}
            title="Klik untuk mengedit Judul Daftar Personel"
          >
            <div className="uppercase text-[12pt] leading-[1.0]">{doc.lampiranJudul}</div>
            <div className="inline-block uppercase text-[12pt] leading-[1.0] border-b border-black px-3 pb-0.5 mt-0.5">
              {doc.lampiranSubjudul}
            </div>
          </div>
        </>
      )}

      {/* Personnel Table */}
      {(chunk.rows.length > 0 || chunk.isFirstPage) && (
        <div
          className="cursor-pointer"
          onClick={() => onFocusSection?.('hal2')}
          title="Klik untuk mengedit Daftar Personel"
        >
          <table
            ref={tableRef}
            className="w-full table-fixed border-collapse text-[12pt] leading-[1.0]"
          >
            <colgroup>
              {LAMPIRAN_COL_KEYS.map((key) => (
                <col key={`col-${key}`} style={{ width: `${colWidths[key]}mm` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {LAMPIRAN_COL_LABELS.map((label, idx) => (
                  <th
                    key={`th-${label}`}
                    className="relative border border-black px-1.5 py-1.5 font-normal text-center"
                  >
                    <span>{label}</span>
                    {onUpdateColWidths && idx < LAMPIRAN_COL_LABELS.length - 1 && (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        title={`Geser untuk mengatur lebar kolom ${label} & ${LAMPIRAN_COL_LABELS[idx + 1]}`}
                        onMouseDown={(e) => handleStartColumnResize(idx, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="no-print absolute top-0 -right-[4px] h-full w-[8px] cursor-col-resize z-20 group flex items-center justify-center"
                      >
                        <div className="w-[2px] h-full bg-transparent group-hover:bg-[#D4A017] transition-colors" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
              <tr className="text-[12pt]">
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  1
                </th>
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  2
                </th>
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  3
                </th>
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  4
                </th>
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  5
                </th>
                <th
                  className={`border-x border-t ${
                    chunk.rows.length === 0 ? 'border-b' : 'border-b-0'
                  } border-black px-1 py-0.5 font-normal text-center`}
                >
                  6
                </th>
              </tr>
            </thead>
            <tbody>
              {chunk.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border-x border-t-0 border-b border-black px-3 py-6 text-center text-neutral-500 italic"
                  >
                    Belum ada personel ditambahkan pada lampiran surat perintah.
                  </td>
                </tr>
              ) : (
                chunk.rows.map((person, index) => {
                  const rowBorderClass =
                    index === chunk.rows.length - 1
                      ? 'border-x border-t-0 border-b border-black'
                      : 'border-x border-t-0 border-b-0 border-black';
                  return (
                    <tr key={person.id}>
                      <td className={`${rowBorderClass} px-1.5 py-1 text-center align-middle tabular-nums break-words`}>
                        {chunk.startIndex + index + 1}
                      </td>
                      <td className={`${rowBorderClass} px-2 py-1 text-left align-middle uppercase break-words`}>
                        {person.nama}
                      </td>
                      <td className={`${rowBorderClass} px-2 py-1 text-center align-middle uppercase break-words`}>
                        {person.pangkat}
                      </td>
                      <td className={`${rowBorderClass} px-2 py-1 text-center align-middle tabular-nums break-words`}>
                        {person.nrp}
                      </td>
                      <td className={`${rowBorderClass} px-2 py-1 text-center align-middle uppercase leading-[1.0] break-words`}>
                        {person.jabatan}
                      </td>
                      <td className={`${rowBorderClass} px-1.5 py-1 text-center align-middle uppercase break-words`}>
                        {person.ket}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature & Stamp Block (Right-Aligned Column on final Lampiran page) */}
      {chunk.isLastPage && (
        <div
          className="mt-6 flex justify-end cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm"
          onClick={() => onFocusSection?.('ttd')}
          title="Klik untuk mengatur Tanda Tangan & Stempel"
        >
          <div className="inline-flex flex-col items-center text-[12pt] leading-[1.0] relative">
            <div className="flex justify-center relative z-10">
              <div className="inline-block border-b border-black pb-0.5 space-y-0.5">
                <div className="flex">
                  <span className="w-[120px] shrink-0">Dikeluarkan di</span>
                  <span className="w-4 shrink-0">:</span>
                  <span>{doc.dikeluarkanDi}</span>
                </div>
                <div className="flex">
                  <span className="w-[120px] shrink-0">pada tanggal</span>
                  <span className="w-4 shrink-0">:</span>
                  <span className="whitespace-pre-wrap">{doc.tanggalSuratHal2}</span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 w-full flex justify-end text-[12pt] leading-[1.0] relative z-10">
              <div className="whitespace-nowrap text-right">
                {doc.pejabatJabatan.replace(/\s+/g, ' ').trim()}
              </div>
            </div>

            {/* Signature Height Reserve (4 Spasi) */}
            <div className="h-[68px]" />

            <div className="text-center leading-[1.0] relative z-10 flex justify-center">
              <div className="inline-flex flex-col items-center">
                <div className="w-full border-b border-black px-2 pb-0.5 text-center uppercase">
                  {doc.pejabatNama}
                </div>
                <div className="uppercase mt-0.5 text-[12pt] leading-[1.0] text-center">
                  {doc.pejabatPangkatNrp}
                </div>
              </div>
            </div>

            {/* Stamp & Signature Overlay (Centered relative to Jabatan & Nama Pejabat) */}
            {doc.showStampAndSignature && (
              <div className="pointer-events-none absolute inset-0 flex justify-center">
                <div className="relative w-[375px] h-full">
                  <PolsekStampAndSignature
                    resorText={doc.stampResorText}
                    sektorText={doc.stampSektorText}
                    config={doc.stampConfig}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Kata Sambung Kanan Bawah bila Lampiran berlanjut ke halaman berikutnya */}
      <KataSambungFooter text={catchword} onFocusSection={onFocusSection} />
    </div>
  );
};
