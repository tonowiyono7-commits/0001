import React, { useState } from 'react';
import { Check, Copy, Download, Monitor, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleClick}
          title="Pasang aplikasi di Android & PC"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors cursor-pointer shrink-0"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Pasang App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4 shrink-0" style={{ color: 'var(--kero-accent)' }} />
          <span>Pasang di Android &amp; PC</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/logo_polisi_bersama_masyarakat.png?v=3"
                  alt="Ikon Aplikasi"
                  className="h-11 w-auto object-contain shrink-0"
                />
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Pasang Aplikasi di Android &amp; PC
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bisa dijalankan layaknya aplikasi native &amp; mendukung mode offline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
                <div className="font-semibold">
                  Sedang dibuka dalam mode pratinjau:
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Browser memblokir instalasi langsung dari dalam bingkai pratinjau. Buka alamat aplikasi di tab browser penuh (Chrome/Edge) terlebih dahulu untuk memunculkan tombol instalasi langsung.
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tautan Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Alamat Aplikasi</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              {/* Android */}
              <div
                className={`rounded-lg border p-3 space-y-1 ${
                  isAndroid ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Smartphone className="h-4 w-4 shrink-0" style={{ color: 'var(--kero-accent)' }} />
                  <span>Android (Google Chrome / Edge)</span>
                </div>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
                  <li>Buka aplikasi di browser Chrome Android.</li>
                  <li>
                    Ketuk menu <strong>⋮</strong> (kanan atas) lalu pilih{' '}
                    <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.
                  </li>
                  <li>Konfirmasi <strong>Instal</strong> hingga ikon muncul di layar utama HP.</li>
                </ol>
              </div>

              {/* PC / Laptop */}
              <div
                className={`rounded-lg border p-3 space-y-1 ${
                  !isAndroid && !isIOS
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Monitor className="h-4 w-4 shrink-0" style={{ color: 'var(--kero-accent)' }} />
                  <span>PC / Laptop (Windows, Mac, Linux — Chrome / Edge)</span>
                </div>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
                  <li>Buka aplikasi di browser Chrome atau Microsoft Edge.</li>
                  <li>
                    Klik ikon <strong>Instal Aplikasi</strong> (ikon layar + panah) di ujung kanan
                    kolom alamat, atau buka menu browser → <strong>Cast, save, and share</strong> →{' '}
                    <strong>Install page as app...</strong>
                  </li>
                  <li>Aplikasi akan terpasang dengan ikon sendiri di Desktop / Start Menu.</li>
                </ol>
              </div>

              {/* iPhone / iPad */}
              {isIOS && (
                <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Smartphone className="h-4 w-4 shrink-0" style={{ color: 'var(--kero-accent)' }} />
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-0.5 leading-relaxed">
                    <li>
                      Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.
                    </li>
                    <li>
                      Gulir ke bawah dan pilih <strong>Add to Home Screen / Tambah ke Layar Utama</strong>.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setShowGuide(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--kero-accent)' }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Instal Sekarang</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
