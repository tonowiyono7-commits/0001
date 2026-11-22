import React from 'react';
import { Download, TrendingDown, TrendingUp, X } from 'lucide-react';
import type { PortfolioItem, TimeframeKey } from '../types/dashboard';

interface ReportModalProps {
  open: boolean;
  mode: 'all' | 'complete';
  timeframe: TimeframeKey;
  items: PortfolioItem[];
  onClose: () => void;
  onExportCsv: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  open,
  mode,
  timeframe,
  items,
  onClose,
  onExportCsv,
}) => {
  if (!open) return null;

  const totalNumeric = items.reduce((acc, item) => acc + item.numericValue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="report-modal-title" className="font-display text-lg font-bold text-slate-900">
              {mode === 'complete' ? 'Complete Portfolio Performance Report' : 'All Portfolio Holdings'}
            </h2>
            <p className="text-xs text-slate-500">
              Reporting window: {timeframe.toUpperCase()} · Combined valuation ${(totalNumeric / 1000000).toFixed(2)}M
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-3">Asset Class</th>
                  <th className="pb-3 text-right">Current Value</th>
                  <th className="pb-3 text-right">Allocation</th>
                  <th className="pb-3 text-right">Benchmark</th>
                  <th className="pb-3 text-right">Period Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 font-medium text-slate-800">{item.label}</td>
                    <td className="py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {item.value}
                    </td>
                    <td className="py-3.5 text-right text-slate-600 tabular-nums">{item.allocationPct}%</td>
                    <td className="py-3.5 text-right text-slate-500 tabular-nums">{item.benchmark}</td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-medium tabular-nums ${
                          item.direction === 'up' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.direction === 'up' ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {item.deltaPrefix ? `${item.deltaPrefix} ` : ''}
                        {item.deltaLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mode === 'complete' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
              <div className="font-semibold text-slate-800 mb-1">Executive Summary</div>
              Treasury liquidity remains balanced at {items[0]?.allocationPct}% allocation while dividend-bearing
              assets contribute {items[1]?.allocationPct}% of total managed equity. Capital gains continue outperforming
              quarterly targets with zero drawdown alerts triggered.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
