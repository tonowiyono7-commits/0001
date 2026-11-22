import React, { useLayoutEffect, useRef, useState } from 'react';
import { SprinDocument } from '../types/sprin';
import {
  ContinuationPageHeader,
  extractCatchWords,
  KataSambungFooter,
} from './LetterPageTwo';
import { PolsekStampAndSignature, TribrataPrintEmblem } from './PolriEmblems';

function formatKepadaJabatan(jabatan: string): string {
  const clean = jabatan.trim().toUpperCase();
  if (!clean) return 'POLSEK SMG SELATAN';
  if (clean.includes('POLSEK SMG SELATAN') || clean.includes('POLSEK SEMARANG SELATAN')) {
    return clean;
  }
  return `${clean} POLSEK SMG SELATAN`;
}

export interface TextSliceChunk {
  idx: number;
  text: string;
  showNumber: boolean;
  splitContinue: boolean;
}

export interface SprinPageOneSlice {
  pageNumber: number;
  isFirstPage: boolean;
  showHeaderBlock: boolean;
  pertimbanganChunk: {
    text: string;
    showLabel: boolean;
    splitContinue: boolean;
  } | null;
  showDasarLabel: boolean;
  dasarChunks: TextSliceChunk[];
  showDiperintahkan: boolean;
  showKepadaSection: boolean;
  showKepadaLabel: boolean;
  kepadaStart: number;
  kepadaEnd: number;
  showUntukLabel: boolean;
  untukChunks: TextSliceChunk[];
  showSelesai: boolean;
  showSignatureBlock: boolean;
}

function createFullSingleSlice(doc: SprinDocument): SprinPageOneSlice {
  return {
    pageNumber: 1,
    isFirstPage: true,
    showHeaderBlock: true,
    pertimbanganChunk: {
      text: doc.pertimbangan,
      showLabel: true,
      splitContinue: false,
    },
    showDasarLabel: true,
    dasarChunks: doc.dasarList.map((text, idx) => ({
      idx,
      text,
      showNumber: doc.dasarList.length > 1,
      splitContinue: false,
    })),
    showDiperintahkan: true,
    showKepadaSection: true,
    showKepadaLabel: true,
    kepadaStart: 0,
    kepadaEnd: doc.personelList.length,
    showUntukLabel: true,
    untukChunks: doc.untukList.map((text, idx) => ({
      idx,
      text,
      showNumber: true,
      splitContinue: false,
    })),
    showSelesai: true,
    showSignatureBlock: true,
  };
}

function createEmptyContinuationSlice(pageNumber: number): SprinPageOneSlice {
  return {
    pageNumber,
    isFirstPage: false,
    showHeaderBlock: false,
    pertimbanganChunk: null,
    showDasarLabel: false,
    dasarChunks: [],
    showDiperintahkan: false,
    showKepadaSection: false,
    showKepadaLabel: false,
    kepadaStart: 0,
    kepadaEnd: 0,
    showUntukLabel: false,
    untukChunks: [],
    showSelesai: false,
    showSignatureBlock: false,
  };
}

export function computePageOneCatchword(doc: SprinDocument, nextSlice: SprinPageOneSlice): string {
  const useLampiranEffective = doc.useLampiran || doc.personelList.length > 5;

  if (nextSlice.pertimbanganChunk) {
    if (nextSlice.pertimbanganChunk.showLabel) {
      return 'Pertimbangan : .....';
    }
    const w = extractCatchWords(nextSlice.pertimbanganChunk.text);
    return w ? `${w} .....` : '';
  }

  if (nextSlice.dasarChunks.length > 0) {
    const first = nextSlice.dasarChunks[0];
    const w = extractCatchWords(first.text);
    if (nextSlice.showDasarLabel) {
      if (doc.dasarList.length > 1) {
        return w ? `Dasar : ${first.idx + 1}. ${w} .....` : `Dasar : ${first.idx + 1}. .....`;
      }
      return w ? `Dasar : ${w} .....` : 'Dasar : .....';
    }
    if (first.showNumber) {
      return w ? `${first.idx + 1}. ${w} .....` : `${first.idx + 1}. .....`;
    }
    return w ? `${w} .....` : '';
  }

  if (nextSlice.showDiperintahkan) {
    return 'DIPERINTAHKAN .....';
  }

  if (nextSlice.showKepadaSection) {
    if (nextSlice.showKepadaLabel) {
      return 'Kepada : .....';
    }
    if (!useLampiranEffective && doc.personelList.length > 1) {
      const p = doc.personelList[nextSlice.kepadaStart];
      if (p) {
        const num = nextSlice.kepadaStart + 1;
        const firstNamaWord = (p.nama || '').trim().split(/\s+/)[0] || '';
        const label = [p.pangkat, firstNamaWord].filter(Boolean).join(' ').toUpperCase();
        return label ? `${num}. ${label} .....` : `${num}. .....`;
      }
    }
  }

  if (nextSlice.untukChunks.length > 0) {
    const first = nextSlice.untukChunks[0];
    const w = extractCatchWords(first.text);
    if (nextSlice.showUntukLabel) {
      return w ? `Untuk : ${first.idx + 1}. ${w} .....` : `Untuk : ${first.idx + 1}. .....`;
    }
    if (first.showNumber) {
      return w ? `${first.idx + 1}. ${w} .....` : `${first.idx + 1}. .....`;
    }
    return w ? `${w} .....` : '';
  }

  if (nextSlice.showSelesai) {
    return 'Selesai. .....';
  }

  if (nextSlice.showSignatureBlock) {
    return 'Dikeluarkan di .....';
  }

  return '';
}

export function useSprinPageOneSlices(doc: SprinDocument): {
  slices: SprinPageOneSlice[];
  measurerNode: React.ReactNode;
} {
  const [slices, setSlices] = useState<SprinPageOneSlice[]>(() => [createFullSingleSlice(doc)]);

  const fullMaxHeightRef = useRef<HTMLDivElement>(null);
  const breakMaxHeightRef = useRef<HTMLDivElement>(null);
  const contPadRef = useRef<HTMLDivElement>(null);
  const singleLineRef = useRef<HTMLDivElement>(null);

  const headerBlockRef = useRef<HTMLDivElement>(null);
  const pertimbanganRef = useRef<HTMLDivElement>(null);
  const dasarItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const diperintahkanRef = useRef<HTMLDivElement>(null);
  const kepadaSingleRef = useRef<HTMLDivElement>(null);
  const kepadaItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const untukItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const selesaiRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);

  const unnumberedSplitRef = useRef<HTMLDivElement>(null);
  const numberedSplitRef = useRef<HTMLDivElement>(null);

  // Per aturan Perpol: maksimal 5 personel di surat induk, > 5 otomatis memakai Lampiran
  const useLampiranEffective = doc.useLampiran || doc.personelList.length > 5;

  useLayoutEffect(() => {
    const fullMaxH = fullMaxHeightRef.current?.offsetHeight || 990; // 262mm (297mm - 20mm atas - 15mm bawah)
    const breakMaxH = breakMaxHeightRef.current?.offsetHeight || 971; // 257mm (tepat di margin bawah, menyisakan 1 baris untuk kata sambung)
    const contPadH = contPadRef.current?.offsetHeight || 0; // 20mm ruang di bawah header 2 cm dari tepi atas halaman
    const lineH = singleLineRef.current?.offsetHeight || 16;

    const headerH = headerBlockRef.current?.offsetHeight || 0;
    const pertimbanganH = pertimbanganRef.current?.offsetHeight || 0;
    const dasarItemHeights = doc.dasarList.map((_, i) => dasarItemRefs.current[i]?.offsetHeight || 24);
    const diperintahkanH = diperintahkanRef.current?.offsetHeight || 24;
    const kepadaSingleH = kepadaSingleRef.current?.offsetHeight || 20;
    const kepadaItemHeights = doc.personelList.map(
      (_, i) => kepadaItemRefs.current[i]?.offsetHeight || 36
    );
    const untukItemHeights = doc.untukList.map((_, i) => untukItemRefs.current[i]?.offsetHeight || 24);
    const selesaiH = selesaiRef.current?.offsetHeight || 18;
    const signatureH = signatureRef.current?.offsetHeight || 160;

    const measureParagraphHeight = (text: string, numbered: boolean): number => {
      const el = numbered ? numberedSplitRef.current : unnumberedSplitRef.current;
      if (!el) return lineH;
      el.textContent = text;
      const h = el.offsetHeight;
      el.textContent = '';
      return h;
    };

    const splitTextByHeight = (
      text: string,
      availH: number,
      numbered: boolean
    ): { prefix: string; prefixH: number; suffix: string } | null => {
      if (availH < lineH) return null;
      const el = numbered ? numberedSplitRef.current : unnumberedSplitRef.current;
      if (!el) return null;
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 1) return null;

      let low = 1;
      let high = words.length - 1;
      let bestK = 0;
      let bestH = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        el.textContent = words.slice(0, mid).join(' ');
        const h = el.offsetHeight;
        if (h <= availH) {
          bestK = mid;
          bestH = h;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      el.textContent = '';

      if (bestK <= 0 || bestK >= words.length) return null;
      return {
        prefix: words.slice(0, bestK).join(' '),
        prefixH: bestH,
        suffix: words.slice(bestK).join(' '),
      };
    };

    // Hitung sisa tinggi total dari titik tertentu hingga akhir (termasuk Tembusan)
    // untuk mengetahui apakah seluruh sisa surat muat di halaman berjalan sampai margin bawah 1,5 cm.
    const estimateRemainingTotal = (opts: {
      pageHasBody: boolean;
      pertimbanganLeft: number;
      dasarFrom: number;
      dasarOpen: boolean;
      needDiperintahkan: boolean;
      kepadaFrom: number;
      kepadaOpen: boolean;
      untukFrom: number;
      untukOpen: boolean;
      needSelesai: boolean;
    }): number => {
      let total = 0;
      let hasBody = opts.pageHasBody;
      if (opts.pertimbanganLeft > 0) {
        total += (hasBody ? 12 : 0) + opts.pertimbanganLeft;
        hasBody = true;
      }
      if (opts.dasarFrom < doc.dasarList.length) {
        let dOpen = opts.dasarOpen;
        for (let i = opts.dasarFrom; i < doc.dasarList.length; i += 1) {
          const gap = dOpen ? 10 : hasBody ? 12 : 0;
          total += gap + dasarItemHeights[i];
          hasBody = true;
          dOpen = true;
        }
      }
      if (opts.needDiperintahkan) {
        total += (hasBody ? 12 : 0) + diperintahkanH;
        hasBody = true;
      }
      if (useLampiranEffective || doc.personelList.length <= 1) {
        if (opts.kepadaFrom === 0) {
          total += (hasBody ? 12 : 0) + kepadaSingleH;
          hasBody = true;
        }
      } else if (opts.kepadaFrom < doc.personelList.length) {
        let kOpen = opts.kepadaOpen;
        for (let i = opts.kepadaFrom; i < doc.personelList.length; i += 1) {
          const gap = kOpen ? 10 : hasBody ? 12 : 0;
          total += gap + kepadaItemHeights[i];
          hasBody = true;
          kOpen = true;
        }
      }
      if (opts.untukFrom < doc.untukList.length) {
        let uOpen = opts.untukOpen;
        for (let i = opts.untukFrom; i < doc.untukList.length; i += 1) {
          const gap = uOpen ? 10 : hasBody ? 12 : 0;
          total += gap + untukItemHeights[i];
          hasBody = true;
          uOpen = true;
        }
      }
      if (opts.needSelesai) {
        total += (hasBody ? 12 : 0) + selesaiH;
        hasBody = true;
      }
      total += signatureH; // signatureRef sudah termasuk mt-5 (20px)
      return total;
    };

    const computed: SprinPageOneSlice[] = [];
    let pageNum = 1;
    let current: SprinPageOneSlice = {
      ...createEmptyContinuationSlice(pageNum),
      isFirstPage: true,
      showHeaderBlock: true,
    };
    let usedH = headerH;
    let pageHasBody = false;

    const startNextPage = () => {
      computed.push(current);
      pageNum += 1;
      current = createEmptyContinuationSlice(pageNum);
      usedH = contPadH;
      pageHasBody = false;
    };

    // 1. Pertimbangan (dapat pecah per baris jika sangat panjang hingga menyentuh margin bawah)
    {
      let remText = doc.pertimbangan;
      let isFirstChunk = true;
      let remH = pertimbanganH;
      while (remText.length > 0) {
        const gap = pageHasBody ? 12 : 0;
        const allFits =
          usedH +
            estimateRemainingTotal({
              pageHasBody,
              pertimbanganLeft: remH,
              dasarFrom: 0,
              dasarOpen: false,
              needDiperintahkan: true,
              kepadaFrom: 0,
              kepadaOpen: false,
              untukFrom: 0,
              untukOpen: false,
              needSelesai: true,
            }) <=
          fullMaxH;
        const limit = allFits ? fullMaxH : breakMaxH;

        if (usedH + gap + remH <= limit) {
          current.pertimbanganChunk = {
            text: remText,
            showLabel: isFirstChunk,
            splitContinue: false,
          };
          usedH += gap + remH;
          pageHasBody = true;
          break;
        }

        const avail = limit - usedH - gap;
        const split = splitTextByHeight(remText, avail, false);
        if (split) {
          current.pertimbanganChunk = {
            text: split.prefix,
            showLabel: isFirstChunk,
            splitContinue: true,
          };
          usedH += gap + split.prefixH;
          pageHasBody = true;
          startNextPage();
          remText = split.suffix;
          isFirstChunk = false;
          remH = measureParagraphHeight(remText, false);
        } else if (pageHasBody) {
          startNextPage();
        } else {
          current.pertimbanganChunk = {
            text: remText,
            showLabel: isFirstChunk,
            splitContinue: false,
          };
          usedH += gap + remH;
          pageHasBody = true;
          break;
        }
      }
    }

    // 2. Dasar (dapat pecah antar-poin dan per baris di akhir halaman hingga menyentuh margin bawah)
    {
      const numberedDasar = doc.dasarList.length > 1;
      let dasarLabelShown = false;
      for (let i = 0; i < doc.dasarList.length; i += 1) {
        let remText = doc.dasarList[i];
        let isFirstChunkOfItem = true;
        let remH = dasarItemHeights[i];

        while (remText.length > 0 || (i === 0 && doc.dasarList[0] === '')) {
          const dasarOpenOnPage = current.dasarChunks.length > 0;
          const gap = dasarOpenOnPage ? 10 : pageHasBody ? 12 : 0;
          const allFits =
            usedH +
              estimateRemainingTotal({
                pageHasBody,
                pertimbanganLeft: 0,
                dasarFrom: i + 1,
                dasarOpen: true,
                needDiperintahkan: true,
                kepadaFrom: 0,
                kepadaOpen: false,
                untukFrom: 0,
                untukOpen: false,
                needSelesai: true,
              }) +
              gap +
              remH <=
            fullMaxH;
          const limit = allFits ? fullMaxH : breakMaxH;

          if (usedH + gap + remH <= limit) {
            if (!dasarLabelShown) {
              current.showDasarLabel = true;
              dasarLabelShown = true;
            }
            current.dasarChunks.push({
              idx: i,
              text: remText,
              showNumber: numberedDasar && isFirstChunkOfItem,
              splitContinue: false,
            });
            usedH += gap + remH;
            pageHasBody = true;
            break;
          }

          const avail = limit - usedH - gap;
          const split = splitTextByHeight(remText, avail, numberedDasar);
          if (split) {
            if (!dasarLabelShown) {
              current.showDasarLabel = true;
              dasarLabelShown = true;
            }
            current.dasarChunks.push({
              idx: i,
              text: split.prefix,
              showNumber: numberedDasar && isFirstChunkOfItem,
              splitContinue: true,
            });
            usedH += gap + split.prefixH;
            pageHasBody = true;
            startNextPage();
            remText = split.suffix;
            isFirstChunkOfItem = false;
            remH = measureParagraphHeight(remText, numberedDasar);
          } else if (pageHasBody) {
            startNextPage();
          } else {
            if (!dasarLabelShown) {
              current.showDasarLabel = true;
              dasarLabelShown = true;
            }
            current.dasarChunks.push({
              idx: i,
              text: remText,
              showNumber: numberedDasar && isFirstChunkOfItem,
              splitContinue: false,
            });
            usedH += gap + remH;
            pageHasBody = true;
            break;
          }
          if (remText === '') break;
        }
      }
    }

    // 3. DIPERINTAHKAN
    {
      const gap = pageHasBody ? 12 : 0;
      const allFits =
        usedH +
          estimateRemainingTotal({
            pageHasBody,
            pertimbanganLeft: 0,
            dasarFrom: doc.dasarList.length,
            dasarOpen: false,
            needDiperintahkan: true,
            kepadaFrom: 0,
            kepadaOpen: false,
            untukFrom: 0,
            untukOpen: false,
            needSelesai: true,
          }) <=
        fullMaxH;
      const limit = allFits ? fullMaxH : breakMaxH;
      if (pageHasBody && usedH + gap + diperintahkanH > limit) {
        startNextPage();
      }
      const actualGap = pageHasBody ? 12 : 0;
      current.showDiperintahkan = true;
      usedH += actualGap + diperintahkanH;
      pageHasBody = true;
    }

    // 4. Kepada
    if (useLampiranEffective || doc.personelList.length <= 1) {
      const gap = pageHasBody ? 12 : 0;
      const allFits =
        usedH +
          estimateRemainingTotal({
            pageHasBody,
            pertimbanganLeft: 0,
            dasarFrom: doc.dasarList.length,
            dasarOpen: false,
            needDiperintahkan: false,
            kepadaFrom: 0,
            kepadaOpen: false,
            untukFrom: 0,
            untukOpen: false,
            needSelesai: true,
          }) <=
        fullMaxH;
      const limit = allFits ? fullMaxH : breakMaxH;
      if (pageHasBody && usedH + gap + kepadaSingleH > limit) {
        startNextPage();
      }
      const actualGap = pageHasBody ? 12 : 0;
      current.showKepadaSection = true;
      current.showKepadaLabel = true;
      current.kepadaStart = 0;
      current.kepadaEnd = doc.personelList.length;
      usedH += actualGap + kepadaSingleH;
      pageHasBody = true;
    } else {
      let labelShown = false;
      for (let i = 0; i < doc.personelList.length; i += 1) {
        const gap = current.showKepadaSection ? 10 : pageHasBody ? 12 : 0;
        const itemH = kepadaItemHeights[i];
        const allFits =
          usedH +
            estimateRemainingTotal({
              pageHasBody,
              pertimbanganLeft: 0,
              dasarFrom: doc.dasarList.length,
              dasarOpen: false,
              needDiperintahkan: false,
              kepadaFrom: i,
              kepadaOpen: current.showKepadaSection,
              untukFrom: 0,
              untukOpen: false,
              needSelesai: true,
            }) <=
          fullMaxH;
        const limit = allFits ? fullMaxH : breakMaxH;

        if (pageHasBody && usedH + gap + itemH > limit) {
          startNextPage();
        }
        const actualGap = current.showKepadaSection ? 10 : pageHasBody ? 12 : 0;
        if (!current.showKepadaSection) {
          current.showKepadaSection = true;
          current.kepadaStart = i;
          current.kepadaEnd = i + 1;
          current.showKepadaLabel = !labelShown;
          labelShown = true;
        } else {
          current.kepadaEnd = i + 1;
        }
        usedH += actualGap + itemH;
        pageHasBody = true;
      }
    }

    // 5. Untuk (dapat pecah antar-poin dan per baris hingga menyentuh margin bawah 1,5 cm)
    {
      let untukLabelShown = false;
      for (let i = 0; i < doc.untukList.length; i += 1) {
        let remText = doc.untukList[i];
        let isFirstChunkOfItem = true;
        let remH = untukItemHeights[i];

        while (remText.length > 0 || doc.untukList[i] === '') {
          const untukOpenOnPage = current.untukChunks.length > 0;
          const gap = untukOpenOnPage ? 10 : pageHasBody ? 12 : 0;
          const allFits =
            usedH +
              estimateRemainingTotal({
                pageHasBody,
                pertimbanganLeft: 0,
                dasarFrom: doc.dasarList.length,
                dasarOpen: false,
                needDiperintahkan: false,
                kepadaFrom: doc.personelList.length,
                kepadaOpen: false,
                untukFrom: i + 1,
                untukOpen: true,
                needSelesai: true,
              }) +
              gap +
              remH <=
            fullMaxH;
          const limit = allFits ? fullMaxH : breakMaxH;

          if (usedH + gap + remH <= limit) {
            if (!untukLabelShown) {
              current.showUntukLabel = true;
              untukLabelShown = true;
            }
            current.untukChunks.push({
              idx: i,
              text: remText,
              showNumber: isFirstChunkOfItem,
              splitContinue: false,
            });
            usedH += gap + remH;
            pageHasBody = true;
            break;
          }

          const avail = limit - usedH - gap;
          const split = splitTextByHeight(remText, avail, true);
          if (split) {
            if (!untukLabelShown) {
              current.showUntukLabel = true;
              untukLabelShown = true;
            }
            current.untukChunks.push({
              idx: i,
              text: split.prefix,
              showNumber: isFirstChunkOfItem,
              splitContinue: true,
            });
            usedH += gap + split.prefixH;
            pageHasBody = true;
            startNextPage();
            remText = split.suffix;
            isFirstChunkOfItem = false;
            remH = measureParagraphHeight(remText, true);
          } else if (pageHasBody) {
            startNextPage();
          } else {
            if (!untukLabelShown) {
              current.showUntukLabel = true;
              untukLabelShown = true;
            }
            current.untukChunks.push({
              idx: i,
              text: remText,
              showNumber: isFirstChunkOfItem,
              splitContinue: false,
            });
            usedH += gap + remH;
            pageHasBody = true;
            break;
          }
          if (remText === '') break;
        }
      }
    }

    // 6. Selesai. (bagian akhir Batang Tubuh — tetap di halaman berjalan bila masih muat sebelum margin bawah)
    {
      const gap = pageHasBody ? 12 : 0;
      const allFits = usedH + gap + selesaiH + signatureH <= fullMaxH;
      const limit = allFits ? fullMaxH : breakMaxH;
      if (pageHasBody && usedH + gap + selesaiH > limit) {
        startNextPage();
      }
      const actualGap = pageHasBody ? 12 : 0;
      current.showSelesai = true;
      usedH += actualGap + selesaiH;
      pageHasBody = true;
    }

    // 7. Kelompok Penutup (Dikeluarkan di, TTD Pejabat & Tembusan sejajar Nama Pejabat)
    if (pageHasBody && usedH + signatureH > fullMaxH) {
      startNextPage();
    }
    current.showSignatureBlock = true;

    computed.push(current);
    setSlices(computed);
  }, [doc, useLampiranEffective]);

  const measurerNode = (
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
      <div ref={contPadRef} style={{ height: '20mm' }} />
      <div ref={singleLineRef} className="text-[12pt] leading-[1.0]">
        Ag
      </div>

      {/* Scratch prefix measurers for word/line splitting */}
      <div className="flex items-start text-[12pt] leading-[1.0]">
        <div className="w-[130px] shrink-0" />
        <div ref={unnumberedSplitRef} className="flex-1 text-justify leading-[1.0]" />
      </div>
      <div className="flex items-start text-[12pt] leading-[1.0]">
        <div className="w-[130px] shrink-0" />
        <div className="flex-1 flex items-start gap-2.5 text-justify leading-[1.0]">
          <span className="w-5 shrink-0" />
          <div ref={numberedSplitRef} className="flex-1 text-justify leading-[1.0]" />
        </div>
      </div>

      {/* Header block (Kop + Tribrata + Judul + Nomor + mb-5) */}
      <div ref={headerBlockRef} className="flow-root">
        <div className="mb-3">
          <div className="inline-block text-center border-b border-black pb-0.5 leading-[1.0] font-arial-12">
            <div>{doc.kopLine1}</div>
            <div>{doc.kopLine2}</div>
            <div>{doc.kopLine3}</div>
          </div>
        </div>

        <div className="flex flex-col items-center text-center mb-5 py-0.5">
          <TribrataPrintEmblem className="w-[56px] h-[52px] mb-2" />
          <div className="inline-flex flex-col items-center">
            <div className="w-full border-b border-black px-2 pb-0.5 text-center text-[12pt] tracking-[0.02em] leading-[1.0]">
              SURAT PERINTAH
            </div>
            <div className="text-[12pt] mt-0.5 leading-[1.0]">Nomor: {doc.nomorSprin}</div>
          </div>
        </div>
      </div>

      {/* Pertimbangan measure */}
      <div ref={pertimbanganRef} className="flex items-start text-[12pt] leading-[1.0]">
        <div className="w-[114px] shrink-0">Pertimbangan</div>
        <div className="w-[16px] shrink-0 text-center">:</div>
        <div className="flex-1 text-justify leading-[1.0]">{doc.pertimbangan}</div>
      </div>

      {/* Dasar items measure */}
      {doc.dasarList.map((item, idx) => (
        <div
          key={`measure-d-${idx}`}
          ref={(el) => {
            dasarItemRefs.current[idx] = el;
          }}
          className="flex items-start text-[12pt] leading-[1.0]"
        >
          <div className="w-[130px] shrink-0" />
          {doc.dasarList.length <= 1 ? (
            <div className="flex-1 text-justify leading-[1.0]">{item}</div>
          ) : (
            <div className="flex-1 flex items-start gap-2.5 text-justify leading-[1.0]">
              <span className="w-5 shrink-0">{idx + 1}.</span>
              <span className="flex-1">{item}</span>
            </div>
          )}
        </div>
      ))}

      {/* DIPERINTAHKAN measure */}
      <div
        ref={diperintahkanRef}
        className="text-center tracking-[0.02em] py-1 text-[12pt] leading-[1.0]"
      >
        DIPERINTAHKAN
      </div>

      {/* Single Kepada measure */}
      {(useLampiranEffective || doc.personelList.length <= 1) && (
        <div ref={kepadaSingleRef} className="flex items-start text-[12pt] leading-[1.0]">
          <div className="w-[114px] shrink-0">Kepada</div>
          <div className="w-[16px] shrink-0 text-center">:</div>
          {useLampiranEffective || doc.personelList.length === 0 ? (
            <div className="flex-1 uppercase leading-[1.0]">{doc.kepadaText}</div>
          ) : (
            <div className="flex-1 uppercase leading-[1.0]">
              <div className="inline-block border-b border-black pb-0.5">
                {[
                  doc.personelList[0].pangkat,
                  doc.personelList[0].nama,
                  doc.personelList[0].nrp ? `NRP ${doc.personelList[0].nrp}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              </div>
              <div className="mt-0.5">{formatKepadaJabatan(doc.personelList[0].jabatan)}</div>
              {doc.personelList[0].ket && <div className="mt-0.5">{doc.personelList[0].ket}</div>}
            </div>
          )}
        </div>
      )}

      {/* Multi-person Kepada items measure (2..5) */}
      {!useLampiranEffective &&
        doc.personelList.length > 1 &&
        doc.personelList.map((p, idx) => (
          <div
            key={`measure-k-${p.id}-${idx}`}
            ref={(el) => {
              kepadaItemRefs.current[idx] = el;
            }}
            className="flex items-start text-[12pt] leading-[1.0]"
          >
            <div className="w-[130px] shrink-0" />
            <div className="flex-1 flex items-start gap-2 uppercase leading-[1.0]">
              <span className="w-5 shrink-0">{idx + 1}.</span>
              <div className="flex-1">
                <div className="inline-block border-b border-black pb-0.5">
                  {[p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : ''].filter(Boolean).join(' ')}
                </div>
                <div className="mt-0.5">{formatKepadaJabatan(p.jabatan)}</div>
                {p.ket && <div className="mt-0.5">{p.ket}</div>}
              </div>
            </div>
          </div>
        ))}

      {/* Untuk items measure */}
      {doc.untukList.map((item, idx) => (
        <div
          key={`measure-u-${idx}`}
          ref={(el) => {
            untukItemRefs.current[idx] = el;
          }}
          className="flex items-start text-[12pt] leading-[1.0]"
        >
          <div className="w-[130px] shrink-0" />
          <div className="flex-1 flex items-start gap-2.5 text-justify leading-[1.0]">
            <span className="w-5 shrink-0">{idx + 1}.</span>
            <span className="flex-1 whitespace-pre-line">{item}</span>
          </div>
        </div>
      ))}

      {/* Selesai measure */}
      <div ref={selesaiRef} className="pt-0.5 text-[12pt] leading-[1.0]">
        Selesai.
      </div>

      {/* Signature block measure (mt-5 + Dikeluarkan di + TTD + Nama + Tembusan) */}
      <div ref={signatureRef} className="flow-root text-[12pt] leading-[1.0]">
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto]">
          <div />
          <div className="text-[12pt] leading-[1.0]">
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
                  <span className="whitespace-pre-wrap">{doc.tanggalSuratHal1}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end text-[12pt] leading-[1.0]">
              <div className="whitespace-nowrap text-right">
                {doc.pejabatJabatan.replace(/\s+/g, ' ').trim()}
              </div>
            </div>
            <div className="h-[68px]" />
          </div>

          <div className="col-start-1 col-span-2 row-start-2 justify-self-start max-w-[64mm] pr-4">
            {doc.tembusanList.length > 0 && (
              <div>
                <div>Tembusan:</div>
                <div className="mt-1 space-y-0.5">
                  {doc.tembusanList.map((item, idx) => (
                    <div key={idx}>
                      {idx + 1}. {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="col-start-2 row-start-2 flex justify-center">
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
  );

  return { slices, measurerNode };
}

interface LetterPageOneProps {
  doc: SprinDocument;
  slice?: SprinPageOneSlice;
  catchword?: string;
  onFocusSection?: (section: 'hal1' | 'hal2' | 'pengesahan' | 'ttd') => void;
}

export const LetterPageOne: React.FC<LetterPageOneProps> = ({
  doc,
  slice,
  catchword,
  onFocusSection,
}) => {
  const s = slice ?? createFullSingleSlice(doc);
  const useLampiranEffective = doc.useLampiran || doc.personelList.length > 5;

  const hasBodyContentOnPage =
    Boolean(s.pertimbanganChunk) ||
    s.dasarChunks.length > 0 ||
    s.showDiperintahkan ||
    s.showKepadaSection ||
    s.untukChunks.length > 0 ||
    s.showSelesai;

  const renderKepadaContent = () => {
    if (useLampiranEffective || doc.personelList.length === 0) {
      return <div className="flex-1 uppercase leading-[1.0]">{doc.kepadaText}</div>;
    }

    if (doc.personelList.length === 1) {
      const p = doc.personelList[0];
      return (
        <div
          className="flex-1 uppercase leading-[1.0] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onFocusSection?.('hal2');
          }}
          title="Klik untuk mengedit Personel Kepada"
        >
          <div className="inline-block border-b border-black pb-0.5">
            {[p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : ''].filter(Boolean).join(' ')}
          </div>
          <div className="mt-0.5">{formatKepadaJabatan(p.jabatan)}</div>
          {p.ket && <div className="mt-0.5">{p.ket}</div>}
        </div>
      );
    }

    const sliceRows = doc.personelList.slice(s.kepadaStart, s.kepadaEnd);
    return (
      <div
        className="flex-1 space-y-2.5 uppercase leading-[1.0] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onFocusSection?.('hal2');
        }}
        title="Klik untuk mengedit Daftar Personel Kepada"
      >
        {sliceRows.map((p, idx) => (
          <div key={p.id} className="flex items-start gap-2">
            <span className="w-5 shrink-0">{s.kepadaStart + idx + 1}.</span>
            <div className="flex-1">
              <div className="inline-block border-b border-black pb-0.5">
                {[p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : ''].filter(Boolean).join(' ')}
              </div>
              <div className="mt-0.5">{formatKepadaJabatan(p.jabatan)}</div>
              {p.ket && <div className="mt-0.5">{p.ket}</div>}
            </div>
          </div>
        ))}
      </div>
    );
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
      {/* Header Halaman 2+ Isi Sprin (SPRIN ..., 2 cm dari tepi batas atas halaman) */}
      {!s.isFirstPage && (
        <ContinuationPageHeader
          doc={doc}
          pageNumber={s.pageNumber}
          mode="sprin"
          onFocusSection={onFocusSection}
        />
      )}

      {/* Top-Left Kop Surat & Judul (Hanya pada Halaman 1) */}
      {s.showHeaderBlock && (
        <>
          <div
            className="mb-3 cursor-pointer hover:bg-amber-50/60 transition-colors rounded-sm"
            onClick={() => onFocusSection?.('hal1')}
            title="Klik untuk mengedit Kop & Surat Perintah"
          >
            <div className="inline-block text-center border-b border-black pb-0.5 leading-[1.0] font-arial-12">
              <div>{doc.kopLine1}</div>
              <div>{doc.kopLine2}</div>
              <div>{doc.kopLine3}</div>
            </div>
          </div>

          {/* Center Tribrata & Judul Surat (1 Spasi dari Kop, Garis pemisah menyesuaikan kalimat terpanjang, 2 Spasi ke Pertimbangan) */}
          <div
            className="flex flex-col items-center text-center mb-5 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm py-0.5"
            onClick={() => onFocusSection?.('hal1')}
            title="Klik untuk mengedit Nomor Surat"
          >
            <TribrataPrintEmblem className="w-[56px] h-[52px] mb-2" />
            <div className="inline-flex flex-col items-center">
              <div className="w-full border-b border-black px-2 pb-0.5 text-center text-[12pt] tracking-[0.02em] leading-[1.0]">
                SURAT PERINTAH
              </div>
              <div className="text-[12pt] mt-0.5 leading-[1.0]">Nomor: {doc.nomorSprin}</div>
            </div>
          </div>
        </>
      )}

      {/* Body Fields */}
      {hasBodyContentOnPage && (
        <div
          className={`space-y-3 text-[12pt] leading-[1.0] cursor-pointer ${!s.isFirstPage ? 'pt-[20mm]' : ''}`}
          onClick={() => onFocusSection?.('hal1')}
        >
          {/* Pertimbangan */}
          {s.pertimbanganChunk && (
            <div className="flex items-start">
              <div className="w-[114px] shrink-0">
                {s.pertimbanganChunk.showLabel ? 'Pertimbangan' : ''}
              </div>
              <div className="w-[16px] shrink-0 text-center">
                {s.pertimbanganChunk.showLabel ? ':' : ''}
              </div>
              <div
                className={`flex-1 text-justify leading-[1.0] ${
                  s.pertimbanganChunk.splitContinue ? '[text-align-last:justify]' : ''
                }`}
              >
                {s.pertimbanganChunk.text}
              </div>
            </div>
          )}

          {/* Dasar */}
          {s.dasarChunks.length > 0 && (
            <div className="flex items-start">
              <div className="w-[114px] shrink-0">{s.showDasarLabel ? 'Dasar' : ''}</div>
              <div className="w-[16px] shrink-0 text-center">{s.showDasarLabel ? ':' : ''}</div>
              {doc.dasarList.length <= 1 ? (
                <div
                  className={`flex-1 text-justify leading-[1.0] ${
                    s.dasarChunks[0].splitContinue ? '[text-align-last:justify]' : ''
                  }`}
                >
                  {s.dasarChunks[0].text}
                </div>
              ) : (
                <div className="flex-1 space-y-2.5">
                  {s.dasarChunks.map((chunk, cIdx) => (
                    <div
                      key={`${chunk.idx}-${cIdx}`}
                      className="flex items-start gap-2.5 text-justify leading-[1.0]"
                    >
                      <span className="w-5 shrink-0">
                        {chunk.showNumber ? `${chunk.idx + 1}.` : ''}
                      </span>
                      <span
                        className={`flex-1 ${
                          chunk.splitContinue ? '[text-align-last:justify]' : ''
                        }`}
                      >
                        {chunk.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DIPERINTAHKAN (simetris tanpa garis bawah) */}
          {s.showDiperintahkan && (
            <div className="text-center tracking-[0.02em] py-1 text-[12pt] leading-[1.0]">
              DIPERINTAHKAN
            </div>
          )}

          {/* Kepada */}
          {s.showKepadaSection && (
            <div className="flex items-start">
              <div className="w-[114px] shrink-0">{s.showKepadaLabel ? 'Kepada' : ''}</div>
              <div className="w-[16px] shrink-0 text-center">{s.showKepadaLabel ? ':' : ''}</div>
              {renderKepadaContent()}
            </div>
          )}

          {/* Untuk */}
          {s.untukChunks.length > 0 && (
            <div className="flex items-start">
              <div className="w-[114px] shrink-0">{s.showUntukLabel ? 'Untuk' : ''}</div>
              <div className="w-[16px] shrink-0 text-center">{s.showUntukLabel ? ':' : ''}</div>
              <div className="flex-1 space-y-2.5">
                {s.untukChunks.map((chunk, cIdx) => (
                  <div
                    key={`${chunk.idx}-${cIdx}`}
                    className="flex items-start gap-2.5 text-justify leading-[1.0]"
                  >
                    <span className="w-5 shrink-0">
                      {chunk.showNumber ? `${chunk.idx + 1}.` : ''}
                    </span>
                    <span
                      className={`flex-1 whitespace-pre-line ${
                        chunk.splitContinue ? '[text-align-last:justify]' : ''
                      }`}
                    >
                      {chunk.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selesai */}
          {s.showSelesai && <div className="pt-0.5">Selesai.</div>}
        </div>
      )}

      {/* Kelompok Penutup: Signature Block & Tembusan sejajar Nama Pejabat */}
      {s.showSignatureBlock && (
        <div
          className={`${
            hasBodyContentOnPage ? 'mt-5' : !s.isFirstPage ? 'pt-[20mm]' : ''
          } grid grid-cols-[minmax(0,1fr)_auto] text-[12pt] leading-[1.0]`}
        >
          {/* Row 1, Col 1: kosong */}
          <div />

          {/* Row 1, Col 2: Lebar kolom mengikuti Jabatan Penanda Tangan (1 baris, mepet margin kanan) */}
          <div
            className="relative cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              onFocusSection?.('ttd');
            }}
            title="Klik untuk mengatur Tanda Tangan & Stempel"
          >
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
                  <span className="whitespace-pre-wrap">{doc.tanggalSuratHal1}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end text-[12pt] leading-[1.0] relative z-10">
              <div className="whitespace-nowrap text-right">
                {doc.pejabatJabatan.replace(/\s+/g, ' ').trim()}
              </div>
            </div>

            {/* Signature Height Reserve (4 Spasi) */}
            <div className="h-[68px]" />

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

          {/* Row 2, Col 1..2: Tembusan sejajar dengan Nama Pejabat */}
          <div
            className="col-start-1 col-span-2 row-start-2 justify-self-start max-w-[64mm] pr-4 cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm relative z-10"
            onClick={() => onFocusSection?.('hal1')}
            title="Klik untuk mengedit Tembusan"
          >
            {doc.tembusanList.length > 0 && (
              <>
                <div>Tembusan:</div>
                <div className="mt-1 space-y-0.5">
                  {doc.tembusanList.map((item, idx) => (
                    <div key={idx}>
                      {idx + 1}. {item}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Row 2, Col 2: Nama Pejabat & Pangkat/NRP center sejajar dengan Jabatan Penanda Tangan */}
          <div
            className="col-start-2 row-start-2 flex justify-center cursor-pointer hover:bg-amber-50/40 transition-colors rounded-sm relative z-10"
            onClick={(e) => {
              e.stopPropagation();
              onFocusSection?.('pengesahan');
            }}
            title="Klik untuk mengedit Nama & Pangkat Pejabat"
          >
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
      )}

      {/* Kata Sambung Kanan Bawah untuk Halaman Berikutnya */}
      <KataSambungFooter text={catchword} onFocusSection={onFocusSection} />
    </div>
  );
};
