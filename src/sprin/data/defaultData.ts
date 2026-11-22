import { INITIAL_JADWAL_PIKET } from '../../data/jadwalPiketData';
import {
  LampiranColumnWidths,
  PersonnelRow,
  SatkerPreset,
  SprinDocument,
  SprinTemplatePreset,
  StampSignatureConfig,
} from '../types/sprin';

export function getSprinContinuationHeaderTitle(
  doc: Pick<SprinDocument, 'lampiranHeaderTitle' | 'sprinHeaderTitle'>
): string {
  const custom = (doc.sprinHeaderTitle || '').trim();
  if (custom) return custom.toUpperCase();
  const base = (doc.lampiranHeaderTitle || 'LAMP SPRIN KAPOLSEK SMG SELATAN').trim();
  const stripped = base.replace(/^(?:LAMPIRAN|LAMP\.?)\s+/i, '').trim();
  return (stripped || 'SPRIN KAPOLSEK SMG SELATAN').toUpperCase();
}

export function getLampiranHeaderTitle(
  doc: Pick<SprinDocument, 'lampiranHeaderTitle'>
): string {
  const raw = (doc.lampiranHeaderTitle || 'LAMP SPRIN KAPOLSEK SMG SELATAN').trim().toUpperCase();
  if (!raw) return 'LAMP SPRIN KAPOLSEK SMG SELATAN';
  if (/^LAMP\b/.test(raw)) return raw;
  if (/^LAMPIRAN\s+/.test(raw)) return raw.replace(/^LAMPIRAN\s+/, 'LAMP ');
  return `LAMP ${raw}`;
}

export const QUICK_WINS_PROGRAMS: string[] = [
  'Quick Wins 1 — Perbaikan Interaksi Polisi dengan Masyarakat',
  'Quick Wins 2 — Optimalisasi Pengamanan Kegiatan Masyarakat',
  'Quick Wins 3 — Patroli Sambang & Bhabinkamtibmas Terpadu',
  'Quick Wins 4 — Pelayanan Publik Presisi Bebas Pungli',
  'Quick Wins 5 — Penanganan Gangguan Kamtibmas & Keramaian',
  'Quick Wins 6 — Penguatan Sinergi Sekolah & Generasi Muda',
  'Quick Wins 7 — Digitalisasi Pelaporan & Administrasi Operasional',
  'Quick Wins 8 — Respon Cepat Aduan & Pengaduan Masyarakat',
];

export const SATKER_PRESETS: SatkerPreset[] = [
  {
    id: 'polrestabes-semarang',
    label: 'POLRESTABES SEMARANG POLDA JAWA TENGAH',
    shortLabel: 'Polrestabes Semarang',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: '',
    kopLine1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
    kopLine2: 'DAERAH JAWA TENGAH',
    kopLine3: 'RESOR KOTA BESAR SEMARANG',
    lampiranHeaderTitle: 'LAMP SPRIN KAPOLRESTABES SMG',
    pejabatJabatan: 'KAPOLRESTABES SEMARANG POLDA JATENG',
    pejabatNama: 'ERLIN TANG JAYA, S.H., S.I.K., M.H.',
    pejabatPangkatNrp: 'KOMISARIS BESAR POLISI NRP 78061264',
    stampResorText: 'POLRI DAERAH JAWA TENGAH',
    stampSektorText: 'RESOR KOTA BESAR SEMARANG',
  },
  {
    id: 'semarang-selatan',
    label: 'POLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
    shortLabel: 'Polsek Semarang Selatan',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Semarang Selatan',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG SELATAN',
    lampiranHeaderTitle: 'LAMP SPRIN KAPOLSEK SMG SELATAN',
    pejabatJabatan: 'KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
    pejabatNama: 'RISMANTO, S.H.,M.H.',
    pejabatPangkatNrp: 'KOMISARIS POLISI NRP 73020406',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR SEMARANG SELATAN',
  },
  {
    id: 'semarang-tengah',
    label: 'POLSEK SEMARANG TENGAH POLRESTABES SEMARANG',
    shortLabel: 'Polsek Semarang Tengah',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Semarang Tengah',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR SEMARANG TENGAH',
    lampiranHeaderTitle: 'LAMP SPRIN KAPOLSEK SMG TGH',
    pejabatJabatan: 'KAPOLSEK SEMARANG TENGAH POLRESTABES SEMARANG',
    pejabatNama: 'SUYITNO, S.H., M.H.',
    pejabatPangkatNrp: 'KOMISARIS POLISI NRP 74050318',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR SEMARANG TENGAH',
  },
  {
    id: 'candisari',
    label: 'POLSEK CANDISARI POLRESTABES SEMARANG',
    shortLabel: 'Polsek Candisari',
    polda: 'Polda Jawa Tengah',
    polres: 'Polrestabes Semarang',
    polsek: 'Polsek Candisari',
    kopLine1: 'POLRI DAERAH JAWA TENGAH',
    kopLine2: 'RESOR KOTA BESAR SEMARANG',
    kopLine3: 'SEKTOR CANDISARI',
    lampiranHeaderTitle: 'LAMP SPRIN KAPOLSEK CANDISARI',
    pejabatJabatan: 'KAPOLSEK CANDISARI POLRESTABES SEMARANG',
    pejabatNama: 'AGUS PRASETYO, S.I.K.',
    pejabatPangkatNrp: 'AKP NRP 82080412',
    stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
    stampSektorText: 'SEKTOR CANDISARI',
  },
];

export function applySatkerPresetToDoc(doc: SprinDocument, presetId: string): SprinDocument {
  const preset = SATKER_PRESETS.find((p) => p.id === presetId);
  if (!preset) return doc;
  return {
    ...doc,
    polda: preset.polda,
    polres: preset.polres,
    polsek: preset.polsek,
    kopLine1: preset.kopLine1,
    kopLine2: preset.kopLine2,
    kopLine3: preset.kopLine3,
    lampiranHeaderTitle: preset.lampiranHeaderTitle,
    pejabatJabatan: preset.pejabatJabatan,
    pejabatNama: preset.pejabatNama,
    pejabatPangkatNrp: preset.pejabatPangkatNrp,
    stampResorText: preset.stampResorText,
    stampSektorText: preset.stampSektorText,
    updatedAt: new Date().toISOString(),
  };
}

export function mergePersonnelByNrp(
  baseList: PersonnelRow[],
  incomingList: PersonnelRow[]
): PersonnelRow[] {
  const byNrp = new Map<string, PersonnelRow>();
  const order: string[] = [];

  const upsert = (row: PersonnelRow) => {
    const key = row.nrp.trim();
    if (!key) return;
    if (!byNrp.has(key)) {
      order.push(key);
      byNrp.set(key, { ...row });
    } else {
      const existing = byNrp.get(key)!;
      byNrp.set(key, { ...existing, ...row, id: existing.id || row.id });
    }
  };

  baseList.forEach(upsert);
  incomingList.forEach(upsert);

  return order.map((key) => byNrp.get(key)!);
}

export const INITIAL_PERSONNEL_ROSTER: PersonnelRow[] = INITIAL_JADWAL_PIKET.map((p) => ({
  id: `piket-${p.id}`,
  nama: p.nama,
  pangkat: p.pangkat,
  nrp: p.nrp,
  jabatan: p.jabatan,
  ket: p.ket ?? '',
}));

export const DEFAULT_STAMP_IMAGE_URL = '/assets/aistudio/NEW_STAMPLE__2__a18bbd20.png';

export const DEFAULT_STAMP_CONFIG: StampSignatureConfig = {
  stampImageDataUrl: DEFAULT_STAMP_IMAGE_URL,
  stampSizeCm: 4.7,
  stampOffsetXMm: 2,
  stampOffsetYMm: 2,
  stampMultiplyBlend: true,
  signatureImageDataUrl: null,
  signatureWidthCm: 5.2,
  signatureOffsetXMm: 18,
  signatureOffsetYMm: 14,
  signatureMultiplyBlend: true,
  aboveText: true,
};

export const LAMPIRAN_TABLE_TOTAL_MM = 170;

export const DEFAULT_LAMPIRAN_COL_WIDTHS: LampiranColumnWidths = {
  no: 11,
  nama: 42,
  pangkat: 25,
  nrp: 25,
  jabatan: 51,
  ket: 16,
};

export const LAMPIRAN_COL_MIN_WIDTHS: LampiranColumnWidths = {
  no: 8,
  nama: 20,
  pangkat: 14,
  nrp: 16,
  jabatan: 20,
  ket: 10,
};

export function getNormalizedLampiranColWidths(
  widths?: Partial<LampiranColumnWidths>
): LampiranColumnWidths {
  const raw: LampiranColumnWidths = {
    no: Math.max(LAMPIRAN_COL_MIN_WIDTHS.no, Number(widths?.no) || DEFAULT_LAMPIRAN_COL_WIDTHS.no),
    nama: Math.max(
      LAMPIRAN_COL_MIN_WIDTHS.nama,
      Number(widths?.nama) || DEFAULT_LAMPIRAN_COL_WIDTHS.nama
    ),
    pangkat: Math.max(
      LAMPIRAN_COL_MIN_WIDTHS.pangkat,
      Number(widths?.pangkat) || DEFAULT_LAMPIRAN_COL_WIDTHS.pangkat
    ),
    nrp: Math.max(
      LAMPIRAN_COL_MIN_WIDTHS.nrp,
      Number(widths?.nrp) || DEFAULT_LAMPIRAN_COL_WIDTHS.nrp
    ),
    jabatan: Math.max(
      LAMPIRAN_COL_MIN_WIDTHS.jabatan,
      Number(widths?.jabatan) || DEFAULT_LAMPIRAN_COL_WIDTHS.jabatan
    ),
    ket: Math.max(
      LAMPIRAN_COL_MIN_WIDTHS.ket,
      Number(widths?.ket) || DEFAULT_LAMPIRAN_COL_WIDTHS.ket
    ),
  };

  const sum = raw.no + raw.nama + raw.pangkat + raw.nrp + raw.jabatan + raw.ket;
  if (Math.abs(sum - LAMPIRAN_TABLE_TOTAL_MM) < 0.05) {
    return raw;
  }

  const scale = LAMPIRAN_TABLE_TOTAL_MM / sum;
  const no = +(raw.no * scale).toFixed(1);
  const nama = +(raw.nama * scale).toFixed(1);
  const pangkat = +(raw.pangkat * scale).toFixed(1);
  const nrp = +(raw.nrp * scale).toFixed(1);
  const jabatan = +(raw.jabatan * scale).toFixed(1);
  const ket = +(LAMPIRAN_TABLE_TOTAL_MM - (no + nama + pangkat + nrp + jabatan)).toFixed(1);
  return { no, nama, pangkat, nrp, jabatan, ket };
}

export const DEFAULT_SPRIN_DOCUMENT: SprinDocument = {
  id: 'sprin-1488-x-2026',
  status: 'Siap Cetak',
  updatedAt: '2026-10-29T08:30:00.000Z',
  useLampiran: false,

  // Identitas Kesatuan
  polda: 'Polda Jawa Tengah',
  polres: 'Polrestabes Semarang',
  polsek: 'Polsek Semarang Selatan',
  tanggalKegiatan: '2026-10-29',
  pelaporNamaPangkat: 'IPTU AGUS NURYANTO, S.H.',
  pelaporJabatan: 'Ps. Kanitlantas Polsek Semarang Selatan',
  programQuickWins: 'Quick Wins 7 — Digitalisasi Pelaporan & Administrasi Operasional',

  // Surat Perintah 1 Halaman Tanpa Lampiran
  kopLine1: 'KEPOLISIAN NEGARA REPUBLIK INDONESIA',
  kopLine2: 'DAERAH JAWA TENGAH',
  kopLine3: 'RESOR KOTA BESAR SEMARANG',
  nomorSprin: 'Sprin/ 1488 /X/KEP./2026',
  pertimbangan:
    'guna tertib administrasi khususnya dalam rangka pelaksanaan tugas di lingkungan Polrestabes Semarang, dipandang perlu mengeluarkan surat perintah.',
  dasarList: [
    'Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada tingkat Kepolisian Resor dan Kepolisian Sektor sebagaimana telah diubah dengan Peraturan Kepolisian Negara Republik Indonesia Nomor 7 Tahun 2025 tentang Perubahan atas Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada tingkat Kepolisian Resor dan Kepolisian Sektor.',
  ],
  kepadaText:
    'NAMA, PANGKAT/NRP/NIP DAN JABATAN SEBAGAIMANA YANG TERCANTUM DALAM LAMPIRAN SURAT PERINTAH INI.',
  untukList: [
    'sambil menunggu keputusan yang bersifat definitif, agar melaksanakan tugas sebagai Pama Polrestabes Semarang;',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    'surat perintah ini berlaku sejak dikeluarkan sampai dengan adanya keputusan yang berkaitan dengan penempatannya.',
  ],
  tembusanList: [
    'Kasiwas Polrestabes Semarang.',
    'Kasipropam Polrestabes Semarang.',
    'Kapolsek Semarang Selatan Polrestabes Semarang.',
  ],
  kataSambung: '',

  // Header Halaman 2+ & Lampiran
  sprinHeaderTitle: '',
  lampiranHeaderTitle: 'LAMP SPRIN KAPOLSEK SMG SELATAN',
  lampiranNomor: 'SPRIN / 1488 /X/ KEP./ 2026',
  lampiranTanggalUpper: '29 OKTOBER 2026',
  lampiranJudul: 'DAFTAR NAMA PERSONEL YANG DIPERINTAHKAN',
  lampiranSubjudul: 'PADA TANGGAL 29 OKTOBER 2026',
  lampiranColWidths: { ...DEFAULT_LAMPIRAN_COL_WIDTHS },
  personelList: [INITIAL_PERSONNEL_ROSTER[2]],

  // Pengesahan & Pejabat
  dikeluarkanDi: 'Semarang',
  tanggalSuratHal1: '29       Oktober 2026',
  tanggalSuratHal2: '29       Oktober 2026',
  pejabatJabatan: 'KAPOLRESTABES SEMARANG POLDA JATENG',
  pejabatNama: 'ERLIN TANG JAYA, S.H., S.I.K., M.H.',
  pejabatPangkatNrp: 'KOMISARIS BESAR POLISI NRP 78061264',
  showStampAndSignature: true,
  stampResorText: 'POLRI DAERAH JAWA TENGAH',
  stampSektorText: 'RESOR KOTA BESAR SEMARANG',
  stampConfig: { ...DEFAULT_STAMP_CONFIG },
};

function pickRosterByNrp(
  entries: Array<{ nrp: string; ket?: string; fallback?: Omit<PersonnelRow, 'id'> }>,
  prefix: string
): PersonnelRow[] {
  const byNrp = new Map(INITIAL_PERSONNEL_ROSTER.map((p) => [p.nrp.trim(), p]));
  const result: PersonnelRow[] = [];
  entries.forEach((entry, idx) => {
    const found = byNrp.get(entry.nrp.trim());
    if (found) {
      result.push({
        ...found,
        id: `${prefix}-${idx + 1}`,
        ket: entry.ket !== undefined ? entry.ket : found.ket,
      });
    } else if (entry.fallback) {
      result.push({
        ...entry.fallback,
        id: `${prefix}-${idx + 1}`,
        ket: entry.ket !== undefined ? entry.ket : entry.fallback.ket,
      });
    }
  });
  return result;
}

const POLSEK_SEMARANG_SELATAN_BASE: Partial<SprinDocument> = {
  polda: 'Polda Jawa Tengah',
  polres: 'Polrestabes Semarang',
  polsek: 'Polsek Semarang Selatan',
  kopLine1: 'POLRI DAERAH JAWA TENGAH',
  kopLine2: 'RESOR KOTA BESAR SEMARANG',
  kopLine3: 'SEKTOR SEMARANG SELATAN',
  lampiranHeaderTitle: 'LAMP SPRIN KAPOLSEK SMG SELATAN',
  dikeluarkanDi: 'Semarang',
  pejabatJabatan: 'KAPOLSEK SEMARANG SELATAN POLRESTABES SEMARANG',
  pejabatNama: 'RISMANTO, S.H.,M.H.',
  pejabatPangkatNrp: 'KOMISARIS POLISI NRP 73020406',
  stampResorText: 'POLRI RESOR KOTA BESAR SEMARANG',
  stampSektorText: 'SEKTOR SEMARANG SELATAN',
};

export const SPRIN_OLAHRAGA_TEMPLATE: SprinDocument = {
  ...DEFAULT_SPRIN_DOCUMENT,
  ...POLSEK_SEMARANG_SELATAN_BASE,
  id: 'sprin-196-xi-2026',
  status: 'Terbit',
  updatedAt: '2026-11-05T08:00:00.000Z',
  useLampiran: true,
  tanggalKegiatan: '2026-11-06',
  nomorSprin: 'Sprin / 196 / XI / BIN.2.1./2026',
  pertimbangan:
    'bahwa dalam rangka mendukung pembinaan jasmani guna meningkatkan kebugaran dan menjaga kondisi kesamaptaan serta kesehatan anggota, maka dipandang perlu mengeluarkan Surat Perintah ini.',
  dasarList: [
    'undang – Undang Republik Indonesia Nomor 2 tahun 2002 tentang Kepolisian Negara Republik Indonesia.',
    'surat Telegram Kapolrestabes Semarang Nomor : ST/118/VII/BIN2.4/2025, Tanggal Juli 2025 tentang Anev Olah Raga bersama.',
  ],
  kepadaText:
    'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI.',
  untukList: [
    'disamping tugas sehari – hari agar melaksanakan kegiatan Olah raga bersama tingkat Polrestabes Semarang pada:\na. Hari          : Jumat.\nb. Tanggal     : 6 November 2026\nc. Pukul        : 07.30 Wib s/d Selesai.\nd. Tempat      : di Halaman Apel Polrestabes Semarang.',
    'dengan menggunakan pakaian olah raga Training warna kuning;',
    'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
  ],
  tembusanList: ['Kapolrestabes Semarang', 'Kabag SDM Polrestabes Smg'],
  lampiranNomor: 'SPRIN / 196 /XI/ BIN.2.1./ 2026',
  lampiranTanggalUpper: '5 NOVEMBER 2026',
  lampiranJudul: 'DAFTAR NAMA PERS OLAH RAGA BERSAMA',
  lampiranSubjudul: 'PADA HARI JUMAT TANGGAL 6 NOVEMBER 2026',
  tanggalSuratHal1: '5       November 2026',
  tanggalSuratHal2: '5       November 2026',
  personelList: pickRosterByNrp(
    [
      { nrp: '75050022', ket: '' },
      { nrp: '84081372', ket: '' },
      {
        nrp: '197906252014122003',
        ket: '',
        fallback: {
          nama: 'YUNI KURNIA HAPSARI, S.H.',
          pangkat: 'PENGATUR',
          nrp: '197906252014122003',
          jabatan: 'BANUM SIUM',
          ket: '',
        },
      },
    ],
    'or-196'
  ),
};

export const SPRIN_KRYD_TEMPLATE: SprinDocument = {
  ...DEFAULT_SPRIN_DOCUMENT,
  ...POLSEK_SEMARANG_SELATAN_BASE,
  id: 'sprin-213-x-2026',
  status: 'Terbit',
  updatedAt: '2026-11-20T08:00:00.000Z',
  useLampiran: true,
  tanggalKegiatan: '2026-11-21',
  nomorSprin: 'Sprin/213/X/HUK.6.6./2026',
  pertimbangan:
    'untuk kelancaran pelaksanaan Kegiatan KRYD dan menjaga situasi Kamtibmas di wilayah Hukum Polsek Semarang Selatan, maka perlu diterbitkan surat perintah;',
  dasarList: [
    'Undang-Undang Nomor 5 Tahun 2026 tentang Perubahan Ketiga atas Undang-Undang Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia;',
    'petunjuk dan arahan Kapolrestabes Semarang, tentang pelaksanaan KRYD;',
  ],
  kepadaText:
    'NAMA, PANGKAT/NRP/NIP DAN JABATAN SEBAGAIMANA YANG TERCANTUM DALAM LAMPIRAN SURAT PERINTAH INI.',
  untukList: [
    'disamping melaksanakan tugas dan tanggungjawabnya sehari-hari, juga melaksanakan kegiatan KRYD dengan sasaran balap liar dan taruwan / kenakalan remaja;',
    'Kegiatan dilaksanakan pada hari Sabtu tanggal 21 November 2026 pukul 22.00 Wib s.d selesai. Di wilayah Hukum Polsek Semarang Selatan (Strong Point di jl Kompol Maksum);',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    'melaporkan hasil pelaksanaan kegiatan kepada Kapolsek Semarang Selatan;',
  ],
  tembusanList: [
    'Kapolrestabes Semarang',
    'Wakapolrestabes Semarang',
    'Kabagops Polrestabes Semarang.',
  ],
  lampiranNomor: 'SPRIN/213/X/HUK.6.6./2026',
  lampiranTanggalUpper: '20 NOVEMBER 2026',
  lampiranJudul: 'DAFTAR NAMA PERSONEL KRYD',
  lampiranSubjudul: 'PADA HARI SABTU TANGGAL 21 NOVEMBER 2026',
  tanggalSuratHal1: '20      November 2026',
  tanggalSuratHal2: '20      November 2026',
  personelList: pickRosterByNrp(
    [
      { nrp: '72100003', ket: 'PADAL' },
      { nrp: '84030769', ket: 'ANGGOTA' },
      { nrp: '84050075', ket: 'SDA' },
      { nrp: '83070106', ket: 'SDA' },
      { nrp: '86121201', ket: 'SDA' },
      { nrp: '85011391', ket: 'SDA' },
      { nrp: '79010899', ket: 'SDA' },
    ],
    'kryd-213'
  ),
};

export const SPRIN_PEMAKAMAN_TEMPLATE: SprinDocument = {
  ...DEFAULT_SPRIN_DOCUMENT,
  ...POLSEK_SEMARANG_SELATAN_BASE,
  id: 'sprin-164-x-2026',
  status: 'Terbit',
  updatedAt: '2026-10-13T08:00:00.000Z',
  useLampiran: true,
  tanggalKegiatan: '2026-10-13',
  nomorSprin: 'Sprin / 164 / X / HUK.6.6./2026',
  pertimbangan:
    'bahwa untuk kelancaran kegiatan pemakaman anggota TNI/ Polri di wilayah hukum Polsek Semarang Selatan, maka dipandang perlu mengeluarkan Surat Perintah ini;',
  dasarList: [
    'undang – Undang Republik Indonesia Nomor 2 tahun 2002 tentang Kepolisian Negara Republik Indonesia;',
    'perintah Kapolrestabes Semarang pada hari Senin tanggal 12 Oktober 2026, tentang Pemakaman PURN AKBP FX.SUHERMAN, S.H.;',
  ],
  kepadaText:
    'NAMA, PANGKAT, NRP DAN JABATANNYA SEPERTI TERSEBUT DALAM LAMPIRAN SURAT PERINTAH INI;',
  untukList: [
    'Disamping melaksanakan tugas sehari-hari diperintahkan sebagai peserta Upacara persemayaman dan pemakaman PURN AKBP FX.SUHERMAN,S.H.;',
    'upacara akan di laksanakan pada:\na. Hari          : Selasa;\nb. Tanggal     : 13 Oktober 2026;\nc. Pukul dan tempat :\n   - Persemayaman : pukul 09.30 Wib Di Rumah Duka Jl.Karangbendo 72d Rt 7 Rw 1 Kel. Karangrejo, Gajahmungkur Semarang\n   - Pemakaman : pukul 10.00 Wib Di Tpu Sainoloyo Karangbendo Karangrejo Gajahmungkur Semarang;',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab;',
    'melaporkan hasil pelaksanaan tugas kepada Kapolsek.',
  ],
  tembusanList: [],
  lampiranNomor: 'SPRIN / 164 /X/ HUK.6.6./2026',
  lampiranTanggalUpper: '13 OKTOBER 2026',
  lampiranJudul: 'DAFTAR NAMA PERS PESERTA UPACARA PEMAKAMAN PURN AKBP FX SUHERMAN SH',
  lampiranSubjudul: 'SELASA 13 OKTOBER 2026',
  tanggalSuratHal1: '13       Oktober 2026',
  tanggalSuratHal2: '13       Oktober 2026',
  personelList: pickRosterByNrp(
    [
      { nrp: '75050022', ket: '' },
      { nrp: '84051714', ket: '' },
      { nrp: '72120148', ket: '' },
      { nrp: '83101282', ket: '' },
      { nrp: '85081180', ket: '' },
      { nrp: '80100908', ket: '' },
      { nrp: '83070106', ket: '' },
      { nrp: '85011391', ket: '' },
      { nrp: '84081372', ket: '' },
      { nrp: '85061749', ket: '' },
    ],
    'makam-164'
  ),
};

export const INITIAL_ARCHIVE_DOCUMENTS: SprinDocument[] = [
  DEFAULT_SPRIN_DOCUMENT,
  {
    ...DEFAULT_SPRIN_DOCUMENT,
    ...POLSEK_SEMARANG_SELATAN_BASE,
    id: 'sprin-211-xi-2026',
    status: 'Terbit',
    updatedAt: '2026-11-18T08:30:00.000Z',
    useLampiran: true,
    nomorSprin: 'Sprin /  211  / XI / HUK.6.6./2026',
    pertimbangan:
      'bahwa dalam untuk kelancaran kegiatan Pentas Seni di SMAN 11 Semarang, maka dipandang perlu mengeluarkan Surat Perintah ini.',
    dasarList: [
      'undang – Undang Republik Indonesia Nomor 2 tahun 2002 tentang Kepolisian Negara Republik Indonesia.',
      'surat rekomendasi Kapolsek Semarang Selatan Nomor : B/    /XI/YAN.2.4/2025, Tanggal    November 2026 tentang rekomendasi keramaian.',
    ],
    untukList: [
      'disamping tugas sehari – hari agar melaksanakan pengamanan Pentas Seni yang diselenggarakan oleh SMAN 11 Semarang;',
      'kegiatan dilaksanakan pada hari Kamis tanggal 19 November 2026 pukul 09.00 s,d 17.00 Wib;',
      'melaporkan hasil pelaksanaan tugas kepada Kapolsek;',
      'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
    ],
    tembusanList: ['Kapolrestabes Semarang', 'Kabagops Polrestabes Smg'],
    lampiranNomor: 'SPRIN /   211   /XI/ HUK.6.6./ 2026',
    lampiranTanggalUpper: '18        NOVEMBER 2026',
    lampiranJudul: 'DAFTAR NAMA PERS PENGAMANAN PENSI SMAN 11 SEMARANG',
    lampiranSubjudul: 'PADA HARI KAMIS TANGGAL 19 NOVEMBER 2026',
    tanggalSuratHal1: '5       November 2026',
    tanggalSuratHal2: '18        November 2026',
    personelList: INITIAL_PERSONNEL_ROSTER.filter((p) =>
      ['75050022', '84091212', '78041138', '84030769', '85090287'].includes(p.nrp)
    ).map((p) => ({ ...p })),
  },
  SPRIN_KRYD_TEMPLATE,
  SPRIN_OLAHRAGA_TEMPLATE,
  SPRIN_PEMAKAMAN_TEMPLATE,
];

export const POLSEK_SMG_SELATAN_PAM_TEMPLATE: SprinDocument = {
  ...INITIAL_ARCHIVE_DOCUMENTS[1],
  id: 'template-polsek-piket-pam',
  status: 'Draft',
  useLampiran: true,
  nomorSprin: 'Sprin /  212  / XI / PAM.3.3./2026',
  pertimbangan:
    'bahwa dalam rangka memelihara keamanan dan ketertiban masyarakat serta kelancaran pelaksanaan piket fungsi dan pengamanan objek vital di wilayah hukum Polsek Semarang Selatan, dipandang perlu mengeluarkan Surat Perintah ini.',
  dasarList: [
    'Undang-Undang Republik Indonesia Nomor 2 Tahun 2002 tentang Kepolisian Negara Republik Indonesia.',
    'Peraturan Kepolisian Negara Republik Indonesia Nomor 2 Tahun 2021 tentang Susunan Organisasi dan Tata Kerja pada tingkat Kepolisian Resor dan Kepolisian Sektor sebagaimana telah diubah dengan Peraturan Kepolisian Negara Republik Indonesia Nomor 7 Tahun 2025.',
    'Jadwal Piket dan Pengamanan Objek Vital Polsek Semarang Selatan.',
  ],
  untukList: [
    'disamping tugas dan tanggung jawab sehari-hari agar melaksanakan tugas piket jaga Mako dan pengamanan objek vital sesuai daftar lampiran Surat Perintah ini;',
    'melaksanakan serah terima penjagaan tepat waktu, meningkatkan kewaspadaan Mako, dan melakukan patroli dialogis di wilayah hukum Polsek Semarang Selatan;',
    'melaporkan setiap perkembangan situasi kamtibmas dan hasil pelaksanaan tugas kepada Kapolsek Semarang Selatan;',
    'melaksanakan perintah ini dengan seksama dan penuh rasa tanggung jawab.',
  ],
  lampiranNomor: 'SPRIN /   212   /XI/ PAM.3.3./ 2026',
  lampiranJudul: 'DAFTAR NAMA PERSONEL PIKET & PERS PAM OBVIT POLSEK SEMARANG SELATAN',
  lampiranSubjudul: 'SESUAI JADWAL PIKET POLSEK SEMARANG SELATAN',
  personelList: INITIAL_PERSONNEL_ROSTER.filter((p) =>
    ['75050022', '84091212', '78041138', '84030769', '85090287'].includes(p.nrp)
  ).map((p) => ({ ...p })),
};

export const SPRIN_TEMPLATES: SprinTemplatePreset[] = [
  {
    id: 'template-polsek-kryd',
    title: 'Sprin Kegiatan KRYD (Balap Liar & Kenakalan Remaja)',
    subtitle: 'Sprin/213/X/HUK.6.6./2026 · Patroli & Strong Point Jl. Kompol Maksum (7 Pers)',
    category: 'Polsek Semarang Selatan',
    badge: 'KRYD',
    doc: SPRIN_KRYD_TEMPLATE,
  },
  {
    id: 'template-polsek-olahraga',
    title: 'Sprin Olah Raga Bersama Polrestabes',
    subtitle: 'Sprin / 196 / XI / BIN.2.1./2026 · Pembinaan Jasmani Halaman Apel Polrestabes (3 Pers)',
    category: 'Polsek Semarang Selatan',
    badge: 'Binjas',
    doc: SPRIN_OLAHRAGA_TEMPLATE,
  },
  {
    id: 'template-polsek-pemakaman',
    title: 'Sprin Upacara Persemayaman & Pemakaman',
    subtitle: 'Sprin / 164 / X / HUK.6.6./2026 · Peserta Upacara Pemakaman Anggota/Purnawirawan (10 Pers)',
    category: 'Polsek Semarang Selatan',
    badge: 'Upacara',
    doc: SPRIN_PEMAKAMAN_TEMPLATE,
  },
  {
    id: 'template-polsek-pensi',
    title: 'Sprin Pengamanan Kegiatan (Dengan Lampiran)',
    subtitle: 'Sprin / 211 / XI / HUK.6.6./2026 · Pengamanan Pentas Seni SMAN 11 Semarang (5 Pers)',
    category: 'Polsek Semarang Selatan',
    badge: 'Pengamanan',
    doc: INITIAL_ARCHIVE_DOCUMENTS[1],
  },
  {
    id: 'template-polsek-piket-pam',
    title: 'Sprin Piket & Pers PAM Harian Polsek',
    subtitle: 'Kop Polsek Semarang Selatan · Sinkronisasi otomatis Pers PAM dari Jadwal Piket',
    category: 'Polsek Semarang Selatan',
    badge: 'Piket & PAM',
    doc: POLSEK_SMG_SELATAN_PAM_TEMPLATE,
  },
  {
    id: 'template-polrestabes-1hal',
    title: 'Sprin 1 Halaman (Tanpa Lampiran)',
    subtitle: 'Sprin/ 1488 /X/KEP./2026 · Penugasan Personel Polrestabes Semarang (1 Pers)',
    category: 'Polrestabes Semarang',
    badge: '1 Halaman',
    doc: DEFAULT_SPRIN_DOCUMENT,
  },
];
