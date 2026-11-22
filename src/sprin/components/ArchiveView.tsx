import React, { useMemo, useState } from 'react';
import { Copy, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { SprinDocument } from '../types/sprin';

interface ArchiveViewProps {
  documents: SprinDocument[];
  activeDocId: string;
  onOpenInEditor: (doc: SprinDocument) => void;
  onDuplicate: (doc: SprinDocument) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  documents,
  activeDocId,
  onOpenInEditor,
  onDuplicate,
  onDelete,
  onCreateNew,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | SprinDocument['status']>('Semua');

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      const matchesStatus = statusFilter === 'Semua' || d.status === statusFilter;
      const matchesQuery =
        !q ||
        d.nomorSprin.toLowerCase().includes(q) ||
        d.pertimbangan.toLowerCase().includes(q) ||
        d.lampiranJudul.toLowerCase().includes(q) ||
        d.pelaporNamaPangkat.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [documents, search, statusFilter]);

  const totalPersonelAssignments = documents.reduce(
    (acc, d) => acc + d.personelList.length,
    0
  );
  const readyCount = documents.filter(
    (d) => d.status === 'Siap Cetak' || d.status === 'Terbit'
  ).length;

  return (
    <div className="p-5 lg:p-6 space-y-6 bg-white">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
            Arsip Surat Perintah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat Surat Perintah dan Lampiran Personel yang tersimpan di perangkat ini.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: 'var(--kero-accent)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Buat Sprin Baru</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Total Arsip Sprin</div>
          <div className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
            {documents.length}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Siap Cetak &amp; Terbit</div>
          <div className="font-mono-num text-2xl font-bold text-emerald-600 mt-1">
            {readyCount}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Total Penugasan Personel</div>
          <div className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
            {totalPersonelAssignments}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor Sprin, kegiatan, atau pelapor..."
            className="w-full rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 focus:outline-none pl-10 pr-4 py-2 text-xs text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200/80">
          {(['Semua', 'Draft', 'Siap Cetak', 'Terbit'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={statusFilter === status ? { backgroundColor: 'var(--kero-accent)' } : undefined}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg bg-white border border-slate-200 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-800">
              Tidak ada Surat Perintah yang sesuai
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ubah kata kunci pencarian atau buat dokumen Surat Perintah baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Nomor Surat</th>
                  <th className="py-3 px-4">Perihal / Kegiatan</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Personel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocs.map((doc) => {
                  const isActive = doc.id === activeDocId;
                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        isActive ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div
                          className="font-mono-num text-xs font-semibold whitespace-nowrap"
                          style={{ color: 'var(--kero-accent)' }}
                        >
                          {doc.nomorSprin}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.polsek || doc.polres}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top max-w-md">
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {doc.useLampiran
                            ? doc.lampiranJudul
                            : `Kepada: ${
                                doc.personelList.length > 0
                                  ? doc.personelList
                                      .map((p) => `${p.pangkat} ${p.nama}`)
                                      .join(', ')
                                  : doc.kepadaText
                              }`}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {doc.pertimbangan}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-top font-mono-num text-xs text-slate-600 whitespace-nowrap">
                        {doc.tanggalKegiatan}
                      </td>
                      <td className="py-3.5 px-4 align-top text-right font-mono-num text-xs font-semibold text-slate-800">
                        {doc.personelList.length} pers
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            doc.status === 'Terbit'
                              ? 'text-emerald-600'
                              : doc.status === 'Siap Cetak'
                                ? 'text-sky-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenInEditor(doc)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-800 hover:text-white text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicate(doc)}
                            aria-label="Duplikat surat"
                            title="Duplikat surat"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {documents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDelete(doc.id)}
                              aria-label="Hapus surat"
                              title="Hapus surat"
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
