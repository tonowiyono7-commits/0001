import React, { useMemo, useState } from 'react';

interface SmoothAreaSparklineProps {
  data: number[];
  color: string;
  defaultHighlightIndex?: number;
  height?: number;
  unitPrefix?: string;
  unitSuffix?: string;
  smooth?: boolean;
}

function buildSmoothPath(points: { x: number; y: number }[], smooth: boolean): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (!smooth) {
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const SmoothAreaSparkline: React.FC<SmoothAreaSparklineProps> = ({
  data,
  color,
  defaultHighlightIndex = 7,
  height = 112,
  unitPrefix = '',
  unitSuffix = '',
  smooth = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const gradientId = React.useId();

  const width = 420;
  const padTop = 14;
  const padBottom = 14;
  const padX = 4;

  const { points, linePath, areaPath } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;

    const pts = data.map((val, idx) => {
      const x = padX + (idx / Math.max(data.length - 1, 1)) * usableW;
      const y = padTop + usableH - ((val - min) / span) * usableH;
      return { x, y, val };
    });

    const line = buildSmoothPath(pts, smooth);
    const last = pts[pts.length - 1];
    const first = pts[0];
    const area = pts.length ? `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z` : '';

    return { points: pts, linePath: line, areaPath: area };
  }, [data, height, smooth]);

  const activeIdx = hoveredIdx !== null ? hoveredIdx : Math.min(defaultHighlightIndex, data.length - 1);
  const activePoint = points[activeIdx];
  const tooltipLeftPct = activePoint ? (activePoint.x / width) * 100 : 50;

  return (
    <div
      className="relative w-full select-none"
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend sparkline chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="85%" stopColor={color} stopOpacity="0.03" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {activePoint && (
          <line
            x1={activePoint.x}
            y1={0}
            x2={activePoint.x}
            y2={height}
            stroke="#cbd5e1"
            strokeWidth="1.25"
            strokeDasharray="3 3"
          />
        )}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {activePoint && (
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="4.5"
            fill={color}
            stroke="#ffffff"
            strokeWidth="2.5"
          />
        )}

        {points.map((pt, idx) => (
          <rect
            key={idx}
            x={pt.x - width / data.length / 2}
            y={0}
            width={width / data.length}
            height={height}
            fill="transparent"
            className="cursor-crosshair"
            onMouseEnter={() => setHoveredIdx(idx)}
            onClick={() => setHoveredIdx(idx)}
          />
        ))}
      </svg>

      {activePoint && (
        <div
          className="pointer-events-none absolute top-[62%] -translate-x-1/2 rounded border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm tabular-nums transition-[left] duration-100"
          style={{ left: `${Math.min(Math.max(tooltipLeftPct, 8), 92)}%` }}
        >
          {unitPrefix}
          {activePoint.val}
          {unitSuffix}
        </div>
      )}
    </div>
  );
};

interface StackedSeries {
  name: string;
  color: string;
  values: number[];
}

interface StackedBarChartProps {
  labels: string[];
  series: StackedSeries[];
  height?: number;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  labels,
  series,
  height = 240,
}) => {
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const visibleSeries = series.filter((s) => !hiddenSeries[s.name]);

  const columnTotals = labels.map((_, colIdx) =>
    visibleSeries.reduce((acc, s) => acc + (s.values[colIdx] ?? 0), 0)
  );
  const maxTotal = Math.max(...columnTotals, 10);

  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      const remaining = series.filter((s) => !next[s.name]);
      if (remaining.length === 0) return prev;
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="relative flex flex-col justify-end" style={{ height: `${height}px` }}>
        {/* Horizontal gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-7">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="flex items-center gap-2">
              <span className="w-7 text-right text-[11px] text-slate-400 tabular-nums">
                {Math.round((maxTotal * pct) / 100)}
              </span>
              <div className="h-px flex-1 border-b border-dashed border-slate-200/80" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 flex h-full items-end gap-2 pl-9 pt-2">
          {labels.map((label, colIdx) => {
            const total = columnTotals[colIdx];
            const isHovered = hoveredCol === colIdx;
            return (
              <div
                key={label}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHoveredCol(colIdx)}
                onMouseLeave={() => setHoveredCol(null)}
              >
                {isHovered && (
                  <div className="pointer-events-none absolute -top-2 z-30 w-36 -translate-y-full rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
                    <div className="mb-1 flex items-center justify-between border-b border-slate-100 pb-1 font-semibold text-slate-800">
                      <span>{label}</span>
                      <span className="tabular-nums">${total}k</span>
                    </div>
                    <div className="space-y-0.5">
                      {visibleSeries.map((s) => (
                        <div key={s.name} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: s.color }} />
                            {s.name}
                          </span>
                          <span className="font-mono font-medium tabular-nums">${s.values[colIdx]}k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex w-full max-w-[30px] flex-1 flex-col justify-end pb-1">
                  <div
                    className={`flex w-full flex-col-reverse overflow-hidden rounded-t-sm transition-opacity duration-150 ${
                      hoveredCol !== null && !isHovered ? 'opacity-55' : 'opacity-100'
                    }`}
                    style={{ height: `${Math.max((total / maxTotal) * 84, 4)}%` }}
                  >
                    {visibleSeries.map((s) => {
                      const val = s.values[colIdx] ?? 0;
                      const segPct = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div
                          key={s.name}
                          style={{ height: `${segPct}%`, backgroundColor: s.color }}
                          className="w-full transition-all duration-200"
                        />
                      );
                    })}
                  </div>
                </div>

                <span className="mt-1 text-[11px] font-medium text-slate-500">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
        {series.map((s) => {
          const isHidden = !!hiddenSeries[s.name];
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => toggleSeries(s.name)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-opacity whitespace-nowrap ${
                isHidden ? 'text-slate-400 opacity-50 line-through' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface DonutRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
}

export const DonutRing: React.FC<DonutRingProps> = ({
  value,
  size = 64,
  strokeWidth = 6,
  color,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e9ecef"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-slate-700 tabular-nums">
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
};
