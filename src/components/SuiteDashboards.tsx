import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  DollarSign,
  FolderKanban,
  Headphones,
  Megaphone,
  Package,
  Plus,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ACCOUNT_ROWS,
  AVATARS,
  CRYPTO_ASSETS,
  HELPDESK_TICKETS,
  INCOME_REPORT_SERIES,
  PROJECT_TASKS,
  SERVER_NODES,
} from '../data/mockData';
import type { NavSectionId, ProjectTask, TicketRow } from '../types/dashboard';
import { DonutRing, SmoothAreaSparkline, StackedBarChart } from './Charts';

interface SuiteDashboardsProps {
  section: NavSectionId;
}

export const SuiteDashboards: React.FC<SuiteDashboardsProps> = ({ section }) => {
  // Interactive state for Helpdesk tickets
  const [tickets, setTickets] = useState<TicketRow[]>(HELPDESK_TICKETS);
  const [ticketFilter, setTicketFilter] = useState<'All' | TicketRow['status']>('All');

  // Interactive state for Project tasks
  const [tasks, setTasks] = useState<ProjectTask[]>(PROJECT_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Interactive state for Crypto currency selector
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');

  // Interactive state for Monitoring node refresh
  const [nodes, setNodes] = useState(SERVER_NODES);

  // Interactive state for Product stock filter
  const [productCategory, setProductCategory] = useState<'All' | 'Software' | 'Hardware'>('All');

  const cycleTicketStatus = (id: string) => {
    const order: TicketRow['status'][] = ['Open', 'In Progress', 'Resolved'];
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = order[(order.indexOf(t.status) + 1) % order.length];
        return { ...t, status: next, slaRemaining: next === 'Resolved' ? 'Met' : t.slaRemaining };
      })
    );
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [
      {
        id: `PRJ-${305 + prev.length}`,
        title: newTaskTitle.trim(),
        epic: 'Operations',
        owner: 'Beck Collier',
        ownerAvatar: AVATARS.beck,
        stage: 'Backlog',
        progress: 10,
        dueDate: 'Dec 03',
      },
      ...prev,
    ]);
    setNewTaskTitle('');
  };

  const advanceTaskStage = (id: string) => {
    const stages: ProjectTask['stage'][] = ['Backlog', 'In Progress', 'Review', 'Done'];
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const idx = (stages.indexOf(task.stage) + 1) % stages.length;
        const nextStage = stages[idx];
        const nextProgress = nextStage === 'Done' ? 100 : nextStage === 'Review' ? 85 : nextStage === 'In Progress' ? 50 : 15;
        return { ...task, stage: nextStage, progress: nextProgress };
      })
    );
  };

  const rebalanceCluster = () => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        cpu: Math.max(18, Math.min(82, n.cpu + Math.round((Math.random() - 0.55) * 18))),
        latencyMs: Math.max(12, n.latencyMs + Math.round((Math.random() - 0.5) * 8)),
      }))
    );
  };

  if (section === 'management') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Executive leadership overview, departmental headcount, and quarterly revenue velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Operating Margin', val: '28.4%', delta: '+3.2% QoQ', color: '#3ac47d', Icon: TrendingUp },
            { label: 'Active Headcount', val: '184', delta: '12 open roles', color: '#3b6fd8', Icon: Users },
            { label: 'Annual Recurring', val: '$4.82M', delta: '+19.1% YoY', color: '#d65d43', Icon: DollarSign },
            { label: 'OKR Completion', val: '82%', delta: 'Q4 Cycle', color: '#f5b932', Icon: CheckCircle2 },
          ].map((k) => (
            <div key={k.label} className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
                <k.Icon className="h-4 w-4" style={{ color: k.color }} />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">{k.val}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">{k.delta}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="font-display text-base font-semibold text-slate-800 mb-4">
              Departmental Budget Utilization
            </h2>
            <StackedBarChart labels={INCOME_REPORT_SERIES.labels} series={INCOME_REPORT_SERIES.series} height={240} />
          </div>

          <div className="lg:col-span-5 rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="font-display text-base font-semibold text-slate-800 mb-4">Leadership Roster</h2>
            <div className="divide-y divide-slate-100">
              {[
                { name: 'Beck Collier', role: 'VP Operations', avatar: AVATARS.beck, dept: 'Executive', score: 94 },
                { name: 'Sarah Chen', role: 'Head of Product', avatar: AVATARS.sarah, dept: 'Product', score: 91 },
                { name: 'Marcus Vance', role: 'Principal Architect', avatar: AVATARS.marcus, dept: 'Engineering', score: 88 },
              ].map((person) => (
                <div key={person.name} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={person.avatar} alt={person.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{person.name}</div>
                      <div className="text-xs text-slate-500">{person.role} · {person.dept}</div>
                    </div>
                  </div>
                  <DonutRing value={person.score} size={46} strokeWidth={5} color="#3ac47d" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'advertisement') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Advertisement</h1>
          <p className="mt-1 text-sm text-slate-500">
            Multi-channel campaign performance, ROAS attribution, and ad spend efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: 'Search Paid Campaigns', roas: '4.8x', spend: '$24,100', data: [22, 28, 31, 35, 33, 41, 46, 48], color: '#3ac47d' },
            { title: 'Social Retargeting', roas: '3.2x', spend: '$18,450', data: [18, 21, 19, 25, 29, 27, 31, 34], color: '#3b6fd8' },
            { title: 'Display & Partner', roas: '2.6x', spend: '$11,200', data: [24, 22, 25, 21, 23, 26, 24, 28], color: '#f5b932' },
          ].map((c) => (
            <div key={c.title} className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.title}</span>
                <Megaphone className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">{c.roas} ROAS</span>
                <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">{c.spend}</span>
              </div>
              <div className="mt-4">
                <SmoothAreaSparkline data={c.data} color={c.color} defaultHighlightIndex={5} height={95} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'helpdesk') {
    const visibleTickets = tickets.filter((t) => ticketFilter === 'All' || t.status === ticketFilter);
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Helpdesk</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live support ticket queue, agent SLA tracking, and resolution velocity. Click any status to advance it.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {(['All', 'Open', 'In Progress', 'Resolved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setTicketFilter(st)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  ticketFilter === st ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={ticketFilter === st ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>First Response SLA</span>
              <Headphones className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">14m 20s</div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="text-xs text-slate-500">Active Queue</div>
            <div className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
              {tickets.filter((t) => t.status !== 'Resolved').length} tickets
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="text-xs text-slate-500">CSAT Rating (30D)</div>
            <div className="mt-2 font-display text-2xl font-bold text-[#3ac47d] tabular-nums">97.4%</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-6 py-3 text-right">Status (Click to Cycle)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-800">{t.subject}</div>
                      <div className="font-mono text-[11px] text-slate-400">{t.id} · {t.channel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{t.requester}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <img src={t.assigneeAvatar} alt={t.assignee} referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover" />
                        <span className="text-slate-700">{t.assignee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold ${
                          t.priority === 'Urgent'
                            ? 'text-rose-600'
                            : t.priority === 'High'
                              ? 'text-amber-600'
                              : 'text-slate-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 tabular-nums">{t.slaRemaining}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => cycleTicketStatus(t.id)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          t.status === 'Resolved'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : t.status === 'In Progress'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {t.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'monitoring') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Monitoring</h1>
            <p className="mt-1 text-sm text-slate-500">
              Regional cluster telemetry, CPU/RAM load distribution, and API gateway uptime.
            </p>
          </div>
          <button
            type="button"
            onClick={rebalanceCluster}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            <Activity className="h-4 w-4" />
            Sample Live Metrics
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {nodes.map((node) => (
            <div key={node.id} className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-900">{node.name}</div>
                    <div className="text-xs text-slate-500">{node.region} · Uptime {node.uptime}</div>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    node.state === 'Healthy' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {node.state}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Cpu className="h-3.5 w-3.5" /> CPU
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-800 tabular-nums">{node.cpu}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Memory</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-800 tabular-nums">{node.memory}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">p95 Latency</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-800 tabular-nums">{node.latencyMs} ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'cryptocurrency') {
    const selectedAsset = CRYPTO_ASSETS.find((a) => a.symbol === selectedSymbol) ?? CRYPTO_ASSETS[0];
    const totalPortfolio = CRYPTO_ASSETS.reduce((acc, c) => acc + c.price * c.holdings, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Cryptocurrency</h1>
            <p className="mt-1 text-sm text-slate-500">
              Digital asset treasury holdings, 24h spot price movement, and liquidity overview.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-500">Treasury Value</div>
            <div className="font-display text-2xl font-bold text-slate-900 tabular-nums">
              ${totalPortfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CRYPTO_ASSETS.map((asset) => {
            const active = asset.symbol === selectedSymbol;
            return (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => setSelectedSymbol(asset.symbol)}
                className={`rounded-lg border bg-white p-5 text-left shadow-xs transition-colors ${
                  active ? 'border-slate-800 ring-1 ring-slate-800' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-slate-900">
                    {asset.name} <span className="text-slate-400">{asset.symbol}</span>
                  </span>
                  <span
                    className={`inline-flex items-center text-xs font-semibold tabular-nums ${
                      asset.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {asset.change24h >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(asset.change24h)}%
                  </span>
                </div>
                <div className="mt-2 font-mono text-xl font-bold text-slate-900 tabular-nums">
                  ${asset.price.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-500 tabular-nums">
                  Holdings: {asset.holdings} {asset.symbol}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-800">
                {selectedAsset.name} ({selectedAsset.symbol}) 7-Day Trend
              </h2>
              <p className="text-xs text-slate-500">24h Global Volume: {selectedAsset.volume24h}</p>
            </div>
            <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
              ${(selectedAsset.price * selectedAsset.holdings).toLocaleString(undefined, { maximumFractionDigits: 2 })} held
            </div>
          </div>
          <SmoothAreaSparkline
            data={selectedAsset.sparkline}
            color={selectedAsset.color}
            defaultHighlightIndex={4}
            height={160}
            unitPrefix="$"
          />
        </div>
      </div>
    );
  }

  if (section === 'project-management') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Project Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Active sprint deliverables, milestone ownership, and completion tracking.
            </p>
          </div>
        </div>

        <form onSubmit={addTask} className="flex flex-col gap-2 rounded-lg border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new sprint deliverable..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            <Plus className="h-4 w-4" />
            Add Deliverable
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-400">
                    {task.id} · {task.epic} · Due {task.dueDate}
                  </div>
                  <h3 className="mt-1 font-display text-sm font-semibold text-slate-900">{task.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => advanceTaskStage(task.id)}
                  className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {task.stage}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <img src={task.ownerAvatar} alt={task.owner} referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover" />
                  <span className="text-xs text-slate-600">{task.owner}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${task.progress}%`, backgroundColor: 'var(--kero-accent)' }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">{task.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'product') {
    const catalog = [
      { sku: 'KRO-ENT-01', name: 'Enterprise Analytics Suite', cat: 'Software', price: '$1,290/mo', units: 142, stock: 'Active' },
      { sku: 'KRO-SEC-04', name: 'Zero-Trust SSO Gateway', cat: 'Software', price: '$490/mo', units: 218, stock: 'Active' },
      { sku: 'KRO-HW-12', name: 'Edge Telemetry Sensor v3', cat: 'Hardware', price: '$340', units: 64, stock: 'Low Stock' },
      { sku: 'KRO-HW-19', name: 'Rack Gateway Appliance', cat: 'Hardware', price: '$1,850', units: 29, stock: 'Active' },
    ].filter((item) => productCategory === 'All' || item.cat === productCategory);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Product</h1>
            <p className="mt-1 text-sm text-slate-500">
              SKU catalogue, recurring license velocity, and inventory health.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {(['All', 'Software', 'Hardware'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setProductCategory(c)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  productCategory === c ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={productCategory === c ? { backgroundColor: 'var(--kero-accent)' } : undefined}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {catalog.map((p) => (
            <div key={p.sku} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.sku} · {p.cat}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-slate-900 tabular-nums">{p.price}</div>
                <div className={`text-xs font-medium ${p.stock === 'Low Stock' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {p.units} units · {p.stock}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Statistics Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consolidated statistical benchmarks across customer acquisition, revenue, and retention.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Conversion Efficiency</div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">78.4%</div>
            <div className="mt-1 text-xs text-emerald-600 font-medium">+6.2% above baseline</div>
          </div>
          <DonutRing value={78} size={72} color="#3ac47d" />
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">SLA Adherence</div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">94.2%</div>
            <div className="mt-1 text-xs text-slate-500">{ACCOUNT_ROWS.length} enterprise tiers</div>
          </div>
          <DonutRing value={94} size={72} color="#3b6fd8" />
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Quota Attainment</div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">86.0%</div>
            <div className="mt-1 text-xs text-amber-600 font-medium">2 weeks left in cycle</div>
          </div>
          <DonutRing value={86} size={72} color="#d65d43" />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <FolderKanban className="h-4 w-4 text-slate-500" />
          <h2 className="font-display text-base font-semibold text-slate-800">Annual Cohort Performance</h2>
        </div>
        <StackedBarChart labels={INCOME_REPORT_SERIES.labels} series={INCOME_REPORT_SERIES.series} height={260} />
      </div>
    </div>
  );
};
