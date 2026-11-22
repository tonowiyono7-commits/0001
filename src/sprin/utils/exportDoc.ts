import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document,
  Footer,
  Header,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  TextWrappingType,
  UnderlineType,
  VerticalAlign,
  VerticalPositionRelativeFrom,
  WidthType,
} from 'docx';
import {
  DEFAULT_STAMP_CONFIG,
  DEFAULT_STAMP_IMAGE_URL,
  getLampiranHeaderTitle,
  getNormalizedLampiranColWidths,
  getSprinContinuationHeaderTitle,
} from '../data/defaultData';
import { SprinDocument, StampSignatureConfig } from '../types/sprin';

const FONT_FAMILY = 'Arial';
const FONT_SIZE_12PT = 24; // 24 half-points = 12pt
const LINE_SPACING_1_0 = 240; // 240 = single line spacing (1.0)
const EMU_PER_MM = 36000;
const PX_PER_CM = 96 / 2.54;

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const ALL_SOLID_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

function run(
  text: string,
  opts?: {
    underline?: boolean;
    size?: number;
    bold?: boolean;
  }
): TextRun {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    size: opts?.size ?? FONT_SIZE_12PT,
    bold: opts?.bold,
    color: '000000',
    underline: opts?.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function para(
  children: (TextRun | ImageRun)[] | string,
  opts?: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spaceBefore?: number;
    spaceAfter?: number;
    indentLeft?: number;
    borderBottom?: boolean;
  }
): Paragraph {
  const runs = typeof children === 'string' ? [run(children)] : children;
  return new Paragraph({
    children: runs,
    alignment: opts?.alignment ?? AlignmentType.LEFT,
    spacing: {
      line: LINE_SPACING_1_0,
      before: opts?.spaceBefore ?? 0,
      after: opts?.spaceAfter ?? 0,
    },
    indent: opts?.indentLeft ? { left: opts.indentLeft } : undefined,
    border: opts?.borderBottom
      ? {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: '000000',
            space: 1,
          },
        }
      : undefined,
  });
}

async function fetchPngBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function rasterizeImageUrlToPng(
  dataUrl: string,
  removeWhiteBackground: boolean
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = Math.max(1, img.naturalWidth || 300);
        const h = Math.max(1, img.naturalHeight || 300);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        if (removeWhiteBackground) {
          const imgData = ctx.getImageData(0, 0, w, h);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            if (r > 235 && g > 235 && b > 235) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const ab = await blob.arrayBuffer();
          resolve({ data: new Uint8Array(ab), width: w, height: h });
        }, 'image/png');
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDefaultStampSvg(resorText: string, sektorText: string): string {
  const c = '#6A3EC8';
  const stripes = [40, 47, 54, 61, 68, 75, 82, 89, 96, 103, 110, 117, 124, 131, 138]
    .map(
      (x) =>
        `<line x1="${x}" y1="34" x2="${x}" y2="74" stroke="${c}" stroke-width="1.4"/>` +
        `<line x1="${x}" y1="106" x2="${x}" y2="146" stroke="${c}" stroke-width="1.4"/>`
    )
    .join('');

  const miniTri = (cx: number, cy: number) => `
    <g transform="translate(${cx - 13}, ${cy - 13}) scale(0.26)">
      <polygon points="50,6 52,13 59,13 53.5,17 55.5,24 50,19.8 44.5,24 46.5,17 41,13 48,13" fill="${c}"/>
      <polygon points="32,14 33.6,19 39,19 34.8,22 36.2,27 32,24 27.8,27 29.2,22 25,19 30.4,19" fill="${c}"/>
      <polygon points="68,14 69.6,19 75,19 70.8,22 72.2,27 68,24 63.8,27 65.2,22 61,19 66.4,19" fill="${c}"/>
      <path d="M22 34C10 46 8 64 16 78C24 90 36 95 50 96C64 95 76 90 84 78C92 64 90 46 78 34" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
      <path d="M50 26L72 36V58C72 72 62 82 50 88C38 82 28 72 28 58V36L50 26Z" fill="${c}"/>
      <path d="M50 32L66 39V56C66 67 58 75 50 80C42 75 34 67 34 56V39L50 32Z" fill="#ffffff"/>
      <rect x="46" y="45" width="8" height="26" fill="${c}"/>
      <circle cx="50" cy="40" r="4" fill="${c}"/>
      <path d="M24 84H76L72 93H28L24 84Z" fill="#ffffff" stroke="${c}" stroke-width="3.5"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="360" height="360">
    <defs>
      <path id="topArc" d="M 22,90 A 68,68 0 1,1 158,90"/>
      <path id="botArc" d="M 20,96 A 70,70 0 0,0 160,96"/>
      <clipPath id="inClip"><circle cx="90" cy="90" r="54.5"/></clipPath>
    </defs>
    <circle cx="90" cy="90" r="85" fill="none" stroke="${c}" stroke-width="3.2"/>
    <circle cx="90" cy="90" r="81" fill="none" stroke="${c}" stroke-width="1"/>
    <circle cx="90" cy="90" r="55" fill="none" stroke="${c}" stroke-width="1.8"/>
    <g clip-path="url(#inClip)">${stripes}</g>
    <rect x="36" y="74" width="108" height="32" fill="none"/>
    <line x1="36" y1="74" x2="144" y2="74" stroke="${c}" stroke-width="1.8"/>
    <line x1="36" y1="106" x2="144" y2="106" stroke="${c}" stroke-width="1.8"/>
    <text x="91" y="97" text-anchor="middle" fill="${c}" font-size="19" font-weight="700" letter-spacing="5.5" font-family="Arial, sans-serif">KEPALA</text>
    <text fill="${c}" font-size="10.8" font-weight="600" font-family="Arial, sans-serif" letter-spacing="0.8">
      <textPath href="#topArc" startOffset="50%" text-anchor="middle">${escapeXmlText(resorText.toUpperCase())}</textPath>
    </text>
    <text fill="${c}" font-size="10.8" font-weight="600" font-family="Arial, sans-serif" letter-spacing="0.8">
      <textPath href="#botArc" startOffset="50%" text-anchor="middle">${escapeXmlText(sektorText.toUpperCase())}</textPath>
    </text>
    <circle cx="22" cy="90" r="18" fill="#ffffff" stroke="${c}" stroke-width="1.8"/>
    ${miniTri(22, 90)}
    <circle cx="158" cy="90" r="18" fill="#ffffff" stroke="${c}" stroke-width="1.8"/>
    ${miniTri(158, 90)}
  </svg>`;
}

function buildDefaultSignatureSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365 195" width="548" height="293">
    <path d="M 54,32 L 49,17 C 47,58 43,118 40,162 C 40,167 43,169 45,166" fill="none" stroke="#000000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 31,118 C 31,96 63,75 79,79 C 85,81 69,99 47,113 C 62,108 74,109 82,115 C 89,120 95,118 99,113" fill="none" stroke="#000000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 109,46 L 104,34 C 103,76 107,134 113,177" fill="none" stroke="#000000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 134,83 C 122,90 117,104 123,113 C 129,121 146,122 162,126 C 153,133 141,138 134,138 C 141,131 153,125 162,122" fill="none" stroke="#000000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 134,99 C 144,91 158,86 168,87 C 170,93 164,102 165,107 C 168,110 172,111 175,113 C 222,110 286,111 344,113" fill="none" stroke="#000000" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function buildKopTable(doc: SprinDocument): Table {
  return new Table({
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 0, bottom: 30, left: 0, right: 0 },
            children: [
              para(doc.kopLine1, { alignment: AlignmentType.CENTER }),
              para(doc.kopLine2, { alignment: AlignmentType.CENTER }),
              para(doc.kopLine3, { alignment: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  });
}

function measureArial12WidthMm(text: string): number {
  const clean = text.trim();
  if (!clean) return 0;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '16px Arial, Helvetica, sans-serif';
      const px = ctx.measureText(clean).width;
      return (px * 25.4) / 96;
    }
  } catch {
    // fallback if canvas unavailable
  }
  return clean.length * 2.7;
}

function buildSignatureBlockTable(
  doc: SprinDocument,
  tanggalValue: string,
  stampAsset: { data: Uint8Array; widthPx: number; heightPx: number; offsetXMm: number; offsetYMm: number } | null,
  sigAsset: { data: Uint8Array; widthPx: number; heightPx: number; offsetXMm: number; offsetYMm: number } | null,
  aboveText: boolean,
  includeTembusan: boolean
): Table {
  const singleLineJabatan = doc.pejabatJabatan.replace(/\s+/g, ' ').trim();
  const jabMeasuredMm = measureArial12WidthMm(singleLineJabatan);
  const namaMeasuredMm = Math.max(
    measureArial12WidthMm(doc.pejabatNama.toUpperCase()),
    measureArial12WidthMm(doc.pejabatPangkatNrp.toUpperCase())
  );
  const jabatanWidthMm = Math.min(170, Math.max(76, Math.ceil(jabMeasuredMm + 4)));
  const namaBlockWidthMm = Math.min(jabatanWidthMm, Math.max(66, Math.ceil(namaMeasuredMm + 6)));
  const rightPadMm = Math.max(0, +((jabatanWidthMm - namaBlockWidthMm) / 2).toFixed(1));
  const leftTembusanWidthMm = +(170 - namaBlockWidthMm - rightPadMm).toFixed(1);
  const overlayShiftXMm = (jabatanWidthMm - 98) / 2;

  const spacerRuns: (TextRun | ImageRun)[] = [run(' ')];

  if (stampAsset) {
    spacerRuns.push(
      new ImageRun({
        type: 'png',
        data: stampAsset.data,
        transformation: {
          width: stampAsset.widthPx,
          height: stampAsset.heightPx,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.COLUMN,
            offset: Math.round((stampAsset.offsetXMm + overlayShiftXMm) * EMU_PER_MM),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: Math.round((stampAsset.offsetYMm - 18) * EMU_PER_MM),
          },
          wrap: { type: TextWrappingType.NONE },
          behindDocument: !aboveText,
          allowOverlap: true,
        },
      })
    );
  }

  if (sigAsset) {
    spacerRuns.push(
      new ImageRun({
        type: 'png',
        data: sigAsset.data,
        transformation: {
          width: sigAsset.widthPx,
          height: sigAsset.heightPx,
        },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.COLUMN,
            offset: Math.round((sigAsset.offsetXMm + overlayShiftXMm) * EMU_PER_MM),
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PARAGRAPH,
            offset: Math.round((sigAsset.offsetYMm - 18) * EMU_PER_MM),
          },
          wrap: { type: TextWrappingType.NONE },
          behindDocument: !aboveText,
          allowOverlap: true,
        },
      })
    );
  }

  const labelColWidth = convertMillimetersToTwip(32);
  const colonColWidth = convertMillimetersToTwip(4);
  const valColWidth = convertMillimetersToTwip(52);

  const tembusanChildren: Paragraph[] =
    includeTembusan && doc.tembusanList.length > 0
      ? [
          para('Tembusan:', { spaceAfter: 40 }),
          ...doc.tembusanList.map((item, idx) => para(`${idx + 1}. ${item}`)),
        ]
      : [para('')];

  const dikeluarkanTable = new Table({
    width: { size: convertMillimetersToTwip(88), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelColWidth, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [para('Dikeluarkan di')],
          }),
          new TableCell({
            width: { size: colonColWidth, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [para(':')],
          }),
          new TableCell({
            width: { size: valColWidth, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [para(doc.dikeluarkanDi)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelColWidth, type: WidthType.DXA },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            children: [para('pada tanggal')],
          }),
          new TableCell({
            width: { size: colonColWidth, type: WidthType.DXA },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: valColWidth, type: WidthType.DXA },
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            children: [para(tanggalValue)],
          }),
        ],
      }),
    ],
  });

  const namaPangkatTable = new Table({
    layout: TableLayoutType.AUTOFIT,
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 0, bottom: 20, left: 40, right: 40 },
            children: [
              para(doc.pejabatNama.toUpperCase(), {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            margins: { top: 20, bottom: 0, left: 0, right: 0 },
            children: [
              para(doc.pejabatPangkatNrp.toUpperCase(), {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const row1SpacerMm = +(170 - jabatanWidthMm).toFixed(1);
  const row1Cells: TableCell[] =
    row1SpacerMm > 0.5
      ? [
          new TableCell({
            width: { size: convertMillimetersToTwip(row1SpacerMm), type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [para('')],
          }),
          new TableCell({
            columnSpan: 2,
            width: { size: convertMillimetersToTwip(jabatanWidthMm), type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              dikeluarkanTable,
              para(singleLineJabatan, {
                alignment: AlignmentType.RIGHT,
                spaceBefore: 120,
              }),
              para(spacerRuns, {
                alignment: AlignmentType.CENTER,
                spaceBefore: 420,
                spaceAfter: 420,
              }),
            ],
          }),
        ]
      : [
          new TableCell({
            columnSpan: 3,
            width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              dikeluarkanTable,
              para(singleLineJabatan, {
                alignment: AlignmentType.RIGHT,
                spaceBefore: 120,
              }),
              para(spacerRuns, {
                alignment: AlignmentType.CENTER,
                spaceBefore: 420,
                spaceAfter: 420,
              }),
            ],
          }),
        ];

  const row2Cells: TableCell[] = [
    new TableCell({
      width: { size: convertMillimetersToTwip(leftTembusanWidthMm), type: WidthType.DXA },
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: tembusanChildren,
    }),
    new TableCell({
      width: { size: convertMillimetersToTwip(namaBlockWidthMm), type: WidthType.DXA },
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [namaPangkatTable],
    }),
    ...(rightPadMm > 0
      ? [
          new TableCell({
            width: { size: convertMillimetersToTwip(rightPadMm), type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [para('')],
          }),
        ]
      : []),
  ];

  return new Table({
    width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ children: row1Cells }),
      new TableRow({ children: row2Cells }),
    ],
  });
}

export async function exportSprinToWord(
  doc: SprinDocument,
  autoCatchword?: string
): Promise<void> {
  const tribrataBytes = await fetchPngBytes('/assets/aistudio/tb__1__e5e5aec3.png');
  const effectiveCatchword = (doc.kataSambung || '').trim() || (autoCatchword || '').trim();

  const stampCfg: StampSignatureConfig = {
    ...DEFAULT_STAMP_CONFIG,
    ...(doc.stampConfig || {}),
  };

  let stampAsset: {
    data: Uint8Array;
    widthPx: number;
    heightPx: number;
    offsetXMm: number;
    offsetYMm: number;
  } | null = null;
  let sigAsset: {
    data: Uint8Array;
    widthPx: number;
    heightPx: number;
    offsetXMm: number;
    offsetYMm: number;
  } | null = null;

  if (doc.showStampAndSignature) {
    const stampSource = stampCfg.stampImageDataUrl || DEFAULT_STAMP_IMAGE_URL;
    let rasterStamp = await rasterizeImageUrlToPng(
      stampSource,
      Boolean(stampCfg.stampMultiplyBlend)
    );
    if (!rasterStamp) {
      const fallbackSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        buildDefaultStampSvg(doc.stampResorText, doc.stampSektorText)
      )}`;
      rasterStamp = await rasterizeImageUrlToPng(fallbackSvg, false);
    }
    if (rasterStamp) {
      const sizePx = Math.round(stampCfg.stampSizeCm * PX_PER_CM);
      stampAsset = {
        data: rasterStamp.data,
        widthPx: sizePx,
        heightPx: sizePx,
        offsetXMm: stampCfg.stampOffsetXMm,
        offsetYMm: stampCfg.stampOffsetYMm,
      };
    }

    const sigSource =
      stampCfg.signatureImageDataUrl ||
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildDefaultSignatureSvg())}`;
    const rasterSig = await rasterizeImageUrlToPng(
      sigSource,
      Boolean(stampCfg.signatureImageDataUrl && stampCfg.signatureMultiplyBlend)
    );
    if (rasterSig) {
      const widthPx = Math.round(stampCfg.signatureWidthCm * PX_PER_CM);
      const heightPx = Math.round(widthPx * (rasterSig.height / rasterSig.width));
      sigAsset = {
        data: rasterSig.data,
        widthPx,
        heightPx,
        offsetXMm: stampCfg.signatureOffsetXMm,
        offsetYMm: stampCfg.signatureOffsetYMm,
      };
    }
  }

  // Body column widths (total printable width = 210 - 25 - 15 = 170 mm)
  const labelW = convertMillimetersToTwip(32);
  const colonW = convertMillimetersToTwip(5);
  const contentW = convertMillimetersToTwip(133);
  const numSubW = convertMillimetersToTwip(7);
  const textSubW = convertMillimetersToTwip(126);

  // Dasar cell content
  const dasarCellChildren: (Paragraph | Table)[] =
    doc.dasarList.length <= 1
      ? [para(doc.dasarList[0] || '', { alignment: AlignmentType.JUSTIFIED })]
      : [
          new Table({
            width: { size: contentW, type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            rows: doc.dasarList.map(
              (item, idx) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: numSubW, type: WidthType.DXA },
                      borders: NO_BORDERS,
                      children: [para(`${idx + 1}.`)],
                    }),
                    new TableCell({
                      width: { size: textSubW, type: WidthType.DXA },
                      borders: NO_BORDERS,
                      children: [
                        para(item, { alignment: AlignmentType.JUSTIFIED, spaceAfter: 60 }),
                      ],
                    }),
                  ],
                })
            ),
          }),
        ];

  const formatKepadaJabatan = (jabatan: string): string => {
    const clean = jabatan.trim().toUpperCase();
    if (!clean) return 'POLSEK SMG SELATAN';
    if (clean.includes('POLSEK SMG SELATAN') || clean.includes('POLSEK SEMARANG SELATAN')) {
      return clean;
    }
    return `${clean} POLSEK SMG SELATAN`;
  };

  const useLampiranEffective = doc.useLampiran || doc.personelList.length > 5;

  // Kepada cell content (maksimal 5 personel langsung; > 5 pakai lampiran)
  let kepadaCellChildren: (Paragraph | Table)[] = [para(doc.kepadaText.toUpperCase())];
  if (!useLampiranEffective && doc.personelList.length === 1) {
    const p = doc.personelList[0];
    const line1 = [p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : '']
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    kepadaCellChildren = [para([run(line1, { underline: true })])];
    kepadaCellChildren.push(para(formatKepadaJabatan(p.jabatan)));
    if (p.ket) kepadaCellChildren.push(para(p.ket.toUpperCase()));
  } else if (!useLampiranEffective && doc.personelList.length > 1) {
    kepadaCellChildren = [
      new Table({
        width: { size: contentW, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        rows: doc.personelList.map((p, idx) => {
          const line1 = [p.pangkat, p.nama, p.nrp ? `NRP ${p.nrp}` : '']
            .filter(Boolean)
            .join(' ')
            .toUpperCase();
          const pParas: Paragraph[] = [para([run(line1, { underline: true })])];
          pParas.push(para(formatKepadaJabatan(p.jabatan)));
          if (p.ket) pParas.push(para(p.ket.toUpperCase()));
          return new TableRow({
            children: [
              new TableCell({
                width: { size: numSubW, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [para(`${idx + 1}.`)],
              }),
              new TableCell({
                width: { size: textSubW, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: pParas,
              }),
            ],
          });
        }),
      }),
    ];
  }

  // Untuk cell content
  const untukTable = new Table({
    width: { size: contentW, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: doc.untukList.map(
      (item, idx) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: numSubW, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: [para(`${idx + 1}.`)],
            }),
            new TableCell({
              width: { size: textSubW, type: WidthType.DXA },
              borders: NO_BORDERS,
              children: item.split(/\r?\n/).map((line, lineIdx, lines) =>
                para(line, {
                  alignment:
                    lines.length > 1 && lineIdx > 0 ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
                  spaceAfter: lineIdx === lines.length - 1 ? 80 : 20,
                })
              ),
            }),
          ],
        })
    ),
  });

  const bodyTable = new Table({
    width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Pertimbangan')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(doc.pertimbangan, { alignment: AlignmentType.JUSTIFIED })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Dasar')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: dasarCellChildren,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: NO_BORDERS,
            margins: { top: 80, bottom: 120 },
            children: [para('DIPERINTAHKAN', { alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para('Kepada')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 120 },
            children: kepadaCellChildren,
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [para('Untuk')],
          }),
          new TableCell({
            width: { size: colonW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [para(':')],
          }),
          new TableCell({
            width: { size: contentW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { bottom: 100 },
            children: [untukTable],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            borders: NO_BORDERS,
            children: [para('Selesai.')],
          }),
        ],
      }),
    ],
  });

  const titleNomorTable = new Table({
    layout: TableLayoutType.AUTOFIT,
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              ...NO_BORDERS,
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            },
            margins: { top: 0, bottom: 20, left: 40, right: 40 },
            children: [para('SURAT PERINTAH', { alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: NO_BORDERS,
            margins: { top: 20, bottom: 0, left: 0, right: 0 },
            children: [
              para(`Nomor: ${doc.nomorSprin}`, {
                alignment: AlignmentType.CENTER,
                spaceAfter: 240,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const pageOneChildren: (Paragraph | Table)[] = [
    buildKopTable(doc),
    ...(tribrataBytes
      ? [
          para(
            [
              new ImageRun({
                type: 'png',
                data: tribrataBytes,
                transformation: { width: 56, height: 52 },
              }),
            ],
            { alignment: AlignmentType.CENTER, spaceBefore: 140, spaceAfter: 100 }
          ),
        ]
      : []),
    titleNomorTable,
    bodyTable,
    para('', { spaceBefore: 200 }),
    buildSignatureBlockTable(
      doc,
      doc.tanggalSuratHal1,
      stampAsset,
      sigAsset,
      stampCfg.aboveText,
      true
    ),
  ];

  // Optional Section 2 (Lampiran — Kop Surat sejajar header LAMP SPRIN ... pada halaman pertama lampiran)
  const pageTwoChildren: (Paragraph | Table)[] = [];
  if (useLampiranEffective) {
    pageTwoChildren.push(
      para(doc.lampiranJudul.toUpperCase(), {
        alignment: AlignmentType.CENTER,
        spaceBefore: 120,
      }),
      para([run(doc.lampiranSubjudul.toUpperCase(), { underline: true })], {
        alignment: AlignmentType.CENTER,
        spaceAfter: 160,
      })
    );

    const normWidths = getNormalizedLampiranColWidths(doc.lampiranColWidths);
    const colWidths = [
      convertMillimetersToTwip(normWidths.no),
      convertMillimetersToTwip(normWidths.nama),
      convertMillimetersToTwip(normWidths.pangkat),
      convertMillimetersToTwip(normWidths.nrp),
      convertMillimetersToTwip(normWidths.jabatan),
      convertMillimetersToTwip(normWidths.ket),
    ];

    const headerTitles = ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'];
    const headerRow1 = new TableRow({
      tableHeader: true,
      children: headerTitles.map(
        (title, idx) =>
          new TableCell({
            width: { size: colWidths[idx], type: WidthType.DXA },
            borders: ALL_SOLID_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [para(title, { alignment: AlignmentType.CENTER })],
          })
      ),
    });

    const headerRow2Borders =
      doc.personelList.length === 0
        ? ALL_SOLID_BORDERS
        : {
            ...ALL_SOLID_BORDERS,
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          };

    const headerRow2 = new TableRow({
      tableHeader: true,
      children: ['1', '2', '3', '4', '5', '6'].map(
        (num, idx) =>
          new TableCell({
            width: { size: colWidths[idx], type: WidthType.DXA },
            borders: headerRow2Borders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 30, bottom: 30, left: 40, right: 40 },
            children: [para(num, { alignment: AlignmentType.CENTER })],
          })
      ),
    });

    const personnelTableRows = doc.personelList.map((p, idx) => {
      const isLastRow = idx === doc.personelList.length - 1;
      const rowBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: isLastRow
          ? { style: BorderStyle.SINGLE, size: 6, color: '000000' }
          : { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
      };

      return new TableRow({
        children: [
          { text: `${idx + 1}`, align: AlignmentType.CENTER },
          { text: p.nama.toUpperCase(), align: AlignmentType.LEFT },
          { text: p.pangkat.toUpperCase(), align: AlignmentType.CENTER },
          { text: p.nrp, align: AlignmentType.CENTER },
          { text: p.jabatan.toUpperCase(), align: AlignmentType.CENTER },
          { text: p.ket.toUpperCase(), align: AlignmentType.CENTER },
        ].map(
          (cell, cIdx) =>
            new TableCell({
              width: { size: colWidths[cIdx], type: WidthType.DXA },
              borders: rowBorders,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 50, bottom: 50, left: 60, right: 60 },
              children: [para(cell.text, { alignment: cell.align })],
            })
        ),
      });
    });

    pageTwoChildren.push(
      new Table({
        width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        rows: [headerRow1, headerRow2, ...personnelTableRows],
      })
    );

    pageTwoChildren.push(
      para('', { spaceBefore: 200 }),
      buildSignatureBlockTable(
        doc,
        doc.tanggalSuratHal2,
        stampAsset,
        sigAsset,
        stampCfg.aboveText,
        false
      )
    );
  }

  const sprinHeaderTitle = getSprinContinuationHeaderTitle(doc);
  const lampiranHeaderTitle = getLampiranHeaderTitle(doc);
  const headerNomor = (doc.lampiranNomor || doc.nomorSprin.toUpperCase()).trim();
  const headerTanggal = (
    doc.lampiranTanggalUpper ||
    doc.tanggalSuratHal1.replace(/\s+/g, ' ').trim().toUpperCase()
  ).trim();

  const headerBottomBorders = {
    ...NO_BORDERS,
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  };

  const buildHeaderBlockRows = (titleText: string): TableRow[] => [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          width: { size: convertMillimetersToTwip(84), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 0, bottom: 15, left: 0, right: 0 },
          children: [para(titleText)],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: convertMillimetersToTwip(22), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para('NOMOR')],
        }),
        new TableCell({
          width: { size: convertMillimetersToTwip(3), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para(':')],
        }),
        new TableCell({
          width: { size: convertMillimetersToTwip(59), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para(headerNomor)],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: convertMillimetersToTwip(22), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para('TANGGAL')],
        }),
        new TableCell({
          width: { size: convertMillimetersToTwip(3), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para(':')],
        }),
        new TableCell({
          width: { size: convertMillimetersToTwip(59), type: WidthType.DXA },
          borders: headerBottomBorders,
          margins: { top: 15, bottom: 15, left: 0, right: 0 },
          children: [para(headerTanggal)],
        }),
      ],
    }),
  ];

  const buildCenteredPageNumberPara = (): Paragraph =>
    para(
      [
        new TextRun({
          children: [PageNumber.CURRENT],
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          color: '000000',
        }),
      ],
      { alignment: AlignmentType.CENTER }
    );

  const buildTopRightHeader = (titleText: string): Header =>
    new Header({
      children: [
        new Table({
          width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: convertMillimetersToTwip(74), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: [para('')],
                }),
                new TableCell({
                  width: { size: convertMillimetersToTwip(12), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [buildCenteredPageNumberPara()],
                }),
                new TableCell({
                  width: { size: convertMillimetersToTwip(84), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [
                    new Table({
                      width: { size: convertMillimetersToTwip(84), type: WidthType.DXA },
                      layout: TableLayoutType.FIXED,
                      rows: buildHeaderBlockRows(titleText),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const buildLampiranFirstPageHeader = (): Header =>
    new Header({
      children: [
        new Table({
          width: { size: convertMillimetersToTwip(170), type: WidthType.DXA },
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: convertMillimetersToTwip(74), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [buildKopTable(doc)],
                }),
                new TableCell({
                  width: { size: convertMillimetersToTwip(12), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [buildCenteredPageNumberPara()],
                }),
                new TableCell({
                  width: { size: convertMillimetersToTwip(84), type: WidthType.DXA },
                  borders: NO_BORDERS,
                  margins: { top: 0, bottom: 0, left: 0, right: 0 },
                  children: [
                    new Table({
                      width: { size: convertMillimetersToTwip(84), type: WidthType.DXA },
                      layout: TableLayoutType.FIXED,
                      rows: buildHeaderBlockRows(lampiranHeaderTitle),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const a4PageProperties = {
    size: {
      width: convertMillimetersToTwip(210),
      height: convertMillimetersToTwip(297),
    },
    margin: {
      top: convertMillimetersToTwip(20),
      right: convertMillimetersToTwip(15),
      bottom: convertMillimetersToTwip(15),
      left: convertMillimetersToTwip(25),
      header: convertMillimetersToTwip(20),
      footer: convertMillimetersToTwip(6),
    },
  };

  const wordDoc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            color: '000000',
          },
          paragraph: {
            spacing: {
              line: LINE_SPACING_1_0,
              before: 0,
              after: 0,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: a4PageProperties,
        },
        headers: {
          first: new Header({ children: [] }),
          default: buildTopRightHeader(sprinHeaderTitle),
        },
        ...(effectiveCatchword
          ? {
              footers: {
                first: new Footer({
                  children: [para(effectiveCatchword, { alignment: AlignmentType.RIGHT })],
                }),
                default: new Footer({ children: [] }),
              },
            }
          : {}),
        children: pageOneChildren,
      },
      ...(useLampiranEffective
        ? [
            {
              properties: {
                type: SectionType.NEXT_PAGE,
                titlePage: true,
                page: {
                  ...a4PageProperties,
                  pageNumbers: { start: 1 },
                },
              },
              headers: {
                first: buildLampiranFirstPageHeader(),
                default: buildTopRightHeader(lampiranHeaderTitle),
              },
              children: pageTwoChildren,
            },
          ]
        : []),
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = doc.nomorSprin.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  a.href = url;
  a.download = `${safeName || 'Surat_Perintah'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
