import * as XLSX from 'xlsx';
import { PersonnelRow } from '../types/sprin';

export interface ExcelImportResult {
  rows: PersonnelRow[];
  sheetName: string;
  skippedCount: number;
}

function normalizeHeader(val: unknown): string {
  return String(val ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function cleanNrpValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, '');
}

function isSubheaderNumberRow(row: unknown[]): boolean {
  const nonEmpty = row.map((c) => String(c ?? '').trim()).filter(Boolean);
  if (nonEmpty.length < 3) return false;
  return nonEmpty.every((cell) => /^[1-9]\d?$/.test(cell));
}

export async function parsePersonnelExcel(file: File): Promise<ExcelImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName =
    workbook.SheetNames.find((name) => {
      const sheet = workbook.Sheets[name];
      const range = sheet['!ref'];
      return Boolean(range);
    }) || workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });

  if (!matrix || matrix.length === 0) {
    throw new Error('Isi sheet Excel kosong.');
  }

  // Locate header row automatically (handles Kop Surat rows above table)
  let headerRowIdx = -1;
  let colMap = {
    nama: -1,
    pangkat: -1,
    nrp: -1,
    jabatan: -1,
    ket: -1,
  };

  const scanLimit = Math.min(matrix.length, 25);
  for (let r = 0; r < scanLimit; r++) {
    const row = matrix[r] || [];
    const headers = row.map(normalizeHeader);

    const namaIdx = headers.findIndex(
      (h) => h === 'NAMA' || h === 'NAMA LENGKAP' || h.includes('NAMA PERSONEL')
    );
    const pangkatIdx = headers.findIndex((h) => h === 'PANGKAT' || h.includes('PKT'));
    const nrpIdx = headers.findIndex(
      (h) => h === 'NRP' || h === 'NIP' || h === 'NRP / NIP' || h === 'NRP/NIP'
    );
    const jabatanIdx = headers.findIndex(
      (h) => h === 'JABATAN' || h === 'JAB' || h.includes('PENUGASAN')
    );
    const ketIdx = headers.findIndex(
      (h) => h === 'KET' || h === 'KETERANGAN'
    );

    if (namaIdx >= 0 && (pangkatIdx >= 0 || nrpIdx >= 0 || jabatanIdx >= 0)) {
      headerRowIdx = r;
      colMap = {
        nama: namaIdx,
        pangkat: pangkatIdx,
        nrp: nrpIdx,
        jabatan: jabatanIdx,
        ket: ketIdx,
      };
      break;
    }
  }

  // Fallback column mapping if sheet has no header row
  let startRow = headerRowIdx + 1;
  if (headerRowIdx === -1) {
    startRow = 0;
    const firstNonEmpty = matrix.find((row) => row.some((c) => String(c ?? '').trim() !== ''));
    const firstCell = String(firstNonEmpty?.[0] ?? '').trim();
    const startsWithNo = /^\d+$/.test(firstCell);
    colMap = startsWithNo
      ? { nama: 1, pangkat: 2, nrp: 3, jabatan: 4, ket: 5 }
      : { nama: 0, pangkat: 1, nrp: 2, jabatan: 3, ket: 4 };
  }

  const rows: PersonnelRow[] = [];
  let skippedCount = 0;

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r] || [];
    if (row.every((c) => String(c ?? '').trim() === '')) continue;
    if (isSubheaderNumberRow(row)) continue;

    const rawNama = colMap.nama >= 0 ? String(row[colMap.nama] ?? '').trim() : '';
    const rawPangkat = colMap.pangkat >= 0 ? String(row[colMap.pangkat] ?? '').trim() : '';
    const rawNrp = colMap.nrp >= 0 ? cleanNrpValue(row[colMap.nrp]) : '';
    const rawJabatan = colMap.jabatan >= 0 ? String(row[colMap.jabatan] ?? '').trim() : '';
    const rawKet = colMap.ket >= 0 ? String(row[colMap.ket] ?? '').trim() : '';

    if (!rawNama && !rawNrp) {
      skippedCount++;
      continue;
    }

    if (!rawNama) {
      skippedCount++;
      continue;
    }

    rows.push({
      id: `pers-xlsx-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
      nama: rawNama.toUpperCase(),
      pangkat: rawPangkat.toUpperCase() || '-',
      nrp: rawNrp || `NON-NRP-${r + 1}`,
      jabatan: rawJabatan.toUpperCase() || 'ANGGOTA',
      ket: rawKet.toUpperCase(),
    });
  }

  return { rows, sheetName, skippedCount };
}

export function downloadPersonnelExcelTemplate(): void {
  const data = [
    ['NO', 'NAMA', 'PANGKAT', 'NRP', 'JABATAN', 'KET'],
    ['1', '2', '3', '4', '5', '6'],
    [1, 'AHMAD SOKI', 'AIPTU', '75050022', 'PS. PANIT 3 SAMAPTA', ''],
    [2, 'CANDRA MARMESA, S.H.', 'AIPDA', '84091212', 'BHABIN LAMPER TENGAH', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 14 },
    { wch: 20 },
    { wch: 32 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DATA PERSONEL');
  XLSX.writeFile(wb, 'Template_Data_Personel.xlsx');
}
