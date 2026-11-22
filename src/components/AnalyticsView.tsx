import React, { useMemo, useState } from 'react';
import {
  AlignJustify,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  GraduationCap,
  Laptop,
  Plus,
  Search,
} from 'lucide-react';
import {
  ACCOUNT_ROWS,
  INCOME_REPORT_SERIES,
  INITIAL_TIMELINE,
  PORTFOLIO_BY_TIMEFRAME,
  TECH_SUPPORT_SERIES,
} from '../data/mockData';
import type { AccountRow, TimeframeKey, TimelineItem } from '../types/dashboard';
import { DonutRing, SmoothAreaSparkline, StackedBarChart } from './Charts';
import { ReportModal } from './ReportModal';

type SubTab = 'overview' | 'audiences' | 'demographics' | 'retention';
type StatusFilter = 'All' | AccountRow['status'];

export const AnalyticsView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('30d');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [smoothCharts, setSmoothCharts] = useState(true);
  const [showSubMenu, setShowSubMenu] = useState(true);

  const [reportModal, setReportModal] = useState<{ open: boolean; mode: 'all' | 'complete' }>({
    open: false,
    mode: 'complete',
  });

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('16:30 PM');

  // Table state
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortField, setSortField] = useState<'company' | 'mrr' | 'growth'>('mrr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const portfolioItems = PORTFOLIO_BY_TIMEFRAME[timeframe];
  const techSeries = TECH_SUPPORT_SERIES[timeframe];

  const handleSort = (field: 'company' | 'mrr' | 'growth') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredAccounts = useMemo(() => {
    return ACCOUNT_ROWS.filter((row) => {
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const q = tableSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.company.toLowerCase().includes(q) ||
        row.contact.toLowerCase().includes(q) ||
        row.segment.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    }).sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'company') return a.company.localeCompare(b.company) * mul;
      return (a[sortField] - b[sortField]) * mul;
    });
  }, [statusFilter, tableSearch, sortField, sortDir]);

  const exportCsv = () => {
    const headers = ['ID', 'Company', 'Contact', 'Segment', 'MRR', 'Growth %', 'Status', 'Last Activity'];
    const lines = [
      headers.join(','),
      ...filteredAccounts.map((r) =>
        [r.id, `"${r.company}"`, `"${r.contact}"`, r.segment, r.mrr, r.growth, r.status, `"${r.lastActivity}"`].join(
          ','
        )
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keroui-analytics-${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setTimeline((prev) => [
      {
        id: `tl-${Date.now()}`,
        title: newEventTitle.trim(),
        time: newEventTime.trim() || undefined,
        badge: 'New',
        tone: 'emerald',
        completed: false,
      },
      ...prev,
    ]);
    setNewEventTitle('');
    setAddingEvent(false);
  };

  const toggleTimelineItem = (id: string) => {
    setTimeline((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const getToneColor = (tone: TimelineItem['tone']) => {
    if (tone === 'crimson') return '#d92550';
    if (tone === 'amber') return '#f5b932';
    if (tone === 'emerald') return '#3ac47d';
    return '#3b6fd8';
  };

  const getPortfolioIcon = (id: string) => {
    if (id === 'cash') return Laptop;
    if (id === 'dividends') return GraduationCap;
    return Building2;
  };

  const getPortfolioBg = (tone: 'amber' | 'crimson' | 'emerald') => {
    if (tone === 'amber') return '#f5b932';
    if (tone === 'crimson') return '#d92550';
    return '#3ac47d';
  };

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This is an example dashboard created using built-in elements and components.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {(
              [
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'ytd', label: 'YTD' },
              ] as { id: TimeframeKey; label: string }[]
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  timeframe === tf.id
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={timeframe === tf.id ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Sub-Navigation Card matching Screenshot 2 & Screenshot 3 */}
      {showSubMenu && (
        <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3 shadow-xs">
          <button
            type="button"
            onClick={() => setShowSubMenu(false)}
            title="Hide sub-menu bar"
            className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
          >
            <AlignJustify className="h-4 w-4" />
            <span className="hidden md:inline">Hide page menu</span>
          </button>

          <div className="flex flex-1 flex-col items-center justify-center gap-2 sm:flex-row sm:gap-7">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'audiences', label: 'Audiences' },
                { id: 'demographics', label: 'Demographics' },
              ] as { id: SubTab; label: string }[]
            ).map((tab) => {
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setMoreOpen(false);
                  }}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    active ? 'font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={active ? { color: 'var(--kero-accent)' } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSubTab === 'retention' ? 'font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
                style={activeSubTab === 'retention' ? { color: 'var(--kero-accent)' } : undefined}
              >
                <span>{activeSubTab === 'retention' ? 'Retention' : 'More'}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {moreOpen && (
                <div className="absolute left-1/2 top-8 z-20 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('retention');
                      setMoreOpen(false);
                    }}
                    className="block w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cohort Retention
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportModal({ open: true, mode: 'complete' });
                      setMoreOpen(false);
                    }}
                    className="block w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Executive Summary
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              <span>Options</span>
              <AlignJustify className="h-4 w-4" />
            </button>

            {optionsOpen && (
              <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSmoothCharts((s) => !s);
                    setOptionsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Curve Smoothing</span>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--kero-accent)' }}>
                    {smoothCharts ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportCsv();
                    setOptionsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>Export Snapshot</span>
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!showSubMenu && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowSubMenu(true)}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
          >
            Show page menu
          </button>
        </div>
      )}

      {/* Contextual Sub-Tab Banner for Audiences / Demographics / Retention */}
      {activeSubTab !== 'overview' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
          {activeSubTab === 'audiences' && (
            <>
              <div>
                <div className="text-xs font-medium text-slate-500">Active Monthly Visitors</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">148,920</div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">+12.4% vs prior period</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Returning Sessions</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">64.8%</div>
                <div className="mt-1 text-xs text-slate-500">Avg. duration 4m 18s</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Mobile Share</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">41.2%</div>
                </div>
                <DonutRing value={41} color="#d65d43" />
              </div>
            </>
          )}

          {activeSubTab === 'demographics' && (
            <>
              <div>
                <div className="text-xs font-medium text-slate-500">North America</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">52.4%</div>
                <div className="mt-1 text-xs text-slate-500">78,034 active accounts</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Europe &amp; UK</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">29.1%</div>
                <div className="mt-1 text-xs text-slate-500">43,335 active accounts</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Asia-Pacific</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">18.5%</div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">+24.8% YoY growth</div>
              </div>
            </>
          )}

          {activeSubTab === 'retention' && (
            <>
              <div>
                <div className="text-xs font-medium text-slate-500">Day 30 Cohort Retention</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">86.4%</div>
                <div className="mt-1 text-xs text-emerald-600 font-medium">Top decile benchmark</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">Net Dollar Retention</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">118.2%</div>
                <div className="mt-1 text-xs text-slate-500">Expansion outpaces churn</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Annual Renewal Rate</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">94.0%</div>
                </div>
                <DonutRing value={94} color="#3ac47d" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Portfolio Performance Card (Matching Screenshot 2) */}
      <section className="rounded-lg border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row">
          <h2 className="font-display text-base font-medium text-slate-700">Portfolio Performance</h2>
          <button
            type="button"
            onClick={() => setReportModal({ open: true, mode: 'all' })}
            className="rounded-md border border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {portfolioItems.map((item) => {
            const Icon = getPortfolioIcon(item.id);
            const circleBg = getPortfolioBg(item.tone);
            const isGreenFigure = item.id === 'gains';

            return (
              <div key={item.id} className="flex items-center gap-5 px-6 py-6">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-xs"
                  style={{ backgroundColor: circleBg }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-slate-500">{item.label}</div>
                  <div
                    className={`mt-0.5 font-display text-3xl font-bold tracking-tight tabular-nums ${
                      isGreenFigure ? 'text-[#3ac47d]' : 'text-slate-800'
                    }`}
                  >
                    {item.value}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                    {item.deltaPrefix && <span>{item.deltaPrefix}</span>}
                    {item.direction === 'down' ? (
                      <ChevronDown
                        className={`h-3.5 w-3.5 ${
                          item.tone === 'amber' ? 'text-rose-500' : 'text-sky-500'
                        }`}
                      />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span
                      className={`font-semibold ${
                        item.tone === 'amber'
                          ? 'text-rose-500'
                          : item.tone === 'crimson'
                            ? 'text-sky-500'
                            : 'text-amber-500'
                      }`}
                    >
                      {item.deltaLabel.split(' ')[0]}
                    </span>
                    {item.deltaLabel.includes(' ') && (
                      <span className="text-slate-500">
                        {item.deltaLabel.substring(item.deltaLabel.indexOf(' ') + 1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => setReportModal({ open: true, mode: 'complete' })}
            className="rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            View Complete Report
          </button>
        </div>
      </section>

      {/* Main 2-Column Analytical Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left: Technical Support Card (Matching Screenshot 2) */}
        <section className="xl:col-span-5 rounded-lg border border-slate-200/80 bg-white shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-medium text-slate-700">Technical Support</h2>
            <button
              type="button"
              onClick={() => setSmoothCharts((s) => !s)}
              title="Toggle chart smoothing"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <AlignJustify className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 px-6">
            {/* 1. New Accounts Since 2018 */}
            <div className="py-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                New Accounts Since 2018
              </div>
              <div className="mt-2 flex items-baseline gap-2.5">
                <ChevronUp className="h-5 w-5 self-center text-[#3ac47d]" strokeWidth={2.5} />
                <span className="font-display text-3xl font-bold text-slate-800 tabular-nums">
                  {techSeries.newAccounts.value}
                </span>
                <span className="text-lg font-medium text-slate-400">{techSeries.newAccounts.unit}</span>
                <span className="text-sm font-semibold text-[#3ac47d] tabular-nums">
                  {techSeries.newAccounts.delta}
                </span>
              </div>
              <div className="mt-3">
                <SmoothAreaSparkline
                  data={techSeries.newAccounts.data}
                  color="#3ac47d"
                  defaultHighlightIndex={techSeries.newAccounts.highlightIndex}
                  smooth={smoothCharts}
                />
              </div>
            </div>

            {/* 2. Last Year Total Sales */}
            <div className="py-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Last Year Total Sales
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-normal text-slate-400">$</span>
                <span className="font-display text-3xl font-bold text-slate-800 tabular-nums">
                  {techSeries.totalSales.value}
                </span>
                {techSeries.totalSales.direction === 'down' ? (
                  <ChevronDown className="h-5 w-5 self-center text-[#d65d43]" strokeWidth={2.5} />
                ) : (
                  <ChevronUp className="h-5 w-5 self-center text-[#3ac47d]" strokeWidth={2.5} />
                )}
              </div>
              <div className="mt-3">
                <SmoothAreaSparkline
                  data={techSeries.totalSales.data}
                  color="#3b6fd8"
                  defaultHighlightIndex={techSeries.totalSales.highlightIndex}
                  smooth={smoothCharts}
                />
              </div>
            </div>

            {/* 3. Helpdesk Tickets */}
            <div className="py-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Helpdesk Tickets
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-[#f5b932] tabular-nums">
                  {techSeries.helpdeskTickets.value}
                </span>
                <span className="text-sm text-slate-600">{techSeries.helpdeskTickets.subtitle}</span>
              </div>
              <div className="mt-3">
                <SmoothAreaSparkline
                  data={techSeries.helpdeskTickets.data}
                  color="#f5b932"
                  defaultHighlightIndex={techSeries.helpdeskTickets.highlightIndex}
                  smooth={smoothCharts}
                />
              </div>
            </div>

            {/* 4. Sales Progress */}
            <div className="py-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sales Progress
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Total Orders</div>
                  <div className="text-xs text-slate-500">Last year expenses</div>
                </div>
                <div className="font-display text-2xl font-bold text-[#3ac47d] tabular-nums">
                  {techSeries.totalOrders.value}
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${techSeries.totalOrders.progress}%`,
                    backgroundColor: 'var(--kero-accent)',
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>YoY Growth</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Income Report + Timeline Example */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Income Report Card (from Screenshot 3 desktop preview) */}
          <section className="rounded-lg border border-slate-200/80 bg-white shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-display text-base font-medium text-slate-700">Income Report</h2>
                <p className="text-xs text-slate-400">Click legend items to isolate product lines</p>
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-bold text-slate-800 tabular-nums">$138,420</div>
                <div className="text-xs font-medium text-emerald-600">+16.4% vs last period</div>
              </div>
            </div>

            <div className="p-6">
              <StackedBarChart
                labels={INCOME_REPORT_SERIES.labels}
                series={INCOME_REPORT_SERIES.series}
                height={250}
              />
            </div>
          </section>

          {/* Timeline Example Card (Matching Screenshot 2) */}
          <section className="flex-1 rounded-lg border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-display text-base font-medium text-slate-700">Timeline Example</h2>
              <button
                type="button"
                onClick={() => setAddingEvent((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            </div>

            <div className="p-6">
              {addingEvent && (
                <form
                  onSubmit={handleAddTimeline}
                  className="mb-5 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row"
                >
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Event title (e.g. Deploy analytics patch)"
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="Time"
                    className="w-full sm:w-28 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-md px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--kero-accent)' }}
                  >
                    Save
                  </button>
                </form>
              )}

              <ul className="relative space-y-5 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {timeline.map((item) => (
                  <li key={item.id} className="relative flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTimelineItem(item.id)}
                      aria-label={`Toggle ${item.title}`}
                      className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white"
                    >
                      <span
                        className="h-3 w-3 rounded-full border-2 bg-white transition-transform hover:scale-110"
                        style={{
                          borderColor: getToneColor(item.tone),
                          backgroundColor: item.completed ? getToneColor(item.tone) : '#ffffff',
                        }}
                      />
                    </button>

                    <div
                      onClick={() => toggleTimelineItem(item.id)}
                      className="cursor-pointer text-sm leading-relaxed text-slate-700"
                    >
                      <span className={item.completed ? 'line-through text-slate-400' : ''}>
                        {item.title}
                      </span>
                      {item.time && (
                        <span className="ml-1.5 font-medium text-teal-600 tabular-nums">{item.time}</span>
                      )}
                      {item.badge && (
                        <span className="ml-2 inline-block rounded bg-[#d92550] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-400 shrink-0">
                      {item.completed ? 'Done' : 'Scheduled'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* Dynamic DataTable Card (Matching Screenshot 3 bottom) */}
      <section className="rounded-lg border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-base font-medium text-slate-700">Dynamic Account Ledger</h2>
            <p className="text-xs text-slate-400">
              {filteredAccounts.length} enterprise accounts · Click headers to sort
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter company or owner..."
                className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:border-slate-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['All', 'Active', 'Pending', 'Completed', 'At Risk'] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort('company')}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    Account
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('mrr')}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    Monthly Revenue
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('growth')}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    Growth
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No matching accounts found. Try clearing your filter.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{row.company}</div>
                      <div className="font-mono text-[11px] text-slate-400">{row.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={row.avatar}
                          alt={row.contact}
                          referrerPolicy="no-referrer"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <span className="text-slate-700">{row.contact}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{row.segment}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      ${row.mrr.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 font-semibold ${
                          row.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {row.growth >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(row.growth).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold ${
                          row.status === 'Active'
                            ? 'text-emerald-700'
                            : row.status === 'Completed'
                              ? 'text-sky-700'
                              : row.status === 'Pending'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-xs text-slate-500">{row.lastActivity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ReportModal
        open={reportModal.open}
        mode={reportModal.mode}
        timeframe={timeframe}
        items={portfolioItems}
        onClose={() => setReportModal((s) => ({ ...s, open: false }))}
        onExportCsv={exportCsv}
      />
    </div>
  );
};
