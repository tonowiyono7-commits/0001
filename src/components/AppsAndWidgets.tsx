import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Mail,
  Send,
  Star,
} from 'lucide-react';
import {
  ACCOUNT_ROWS,
  AVATARS,
  INITIAL_CHATS,
  INITIAL_MAILS,
  TECH_SUPPORT_SERIES,
} from '../data/mockData';
import type { MailMessage, NavSectionId } from '../types/dashboard';
import { DonutRing, SmoothAreaSparkline } from './Charts';

interface AppsAndWidgetsProps {
  section: NavSectionId;
}

export const AppsAndWidgets: React.FC<AppsAndWidgetsProps> = ({ section }) => {
  // Mailbox state
  const [mails, setMails] = useState<MailMessage[]>(INITIAL_MAILS);
  const [selectedMailId, setSelectedMailId] = useState<string>(INITIAL_MAILS[0].id);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Chat state
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState(INITIAL_CHATS[0].id);
  const [chatInput, setChatInput] = useState('');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Form Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    orgName: 'Northstar Logistics',
    region: 'North America',
    plan: 'Enterprise',
    billingEmail: 'ops@northstar.co',
  });
  const [wizardDone, setWizardDone] = useState(false);

  // Interactive Elements state
  const [selectedPlan, setSelectedPlan] = useState<'Personal' | 'Developer' | 'Lifetime'>('Developer');
  const [toggleValues, setToggleValues] = useState({ alerts: true, digest: false, twoFa: true });

  const selectedMail = mails.find((m) => m.id === selectedMailId) ?? mails[0];
  const activeChat = chats.find((c) => c.id === activeChatId) ?? chats[0];

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim()) return;
    const newMail: MailMessage = {
      id: `m-${Date.now()}`,
      sender: 'Beck Collier (You)',
      senderEmail: 'b.collier@keroui.io',
      avatar: AVATARS.beck,
      subject: composeSubject.trim(),
      preview: composeBody.slice(0, 80),
      body: composeBody || 'Sent from KeroUI Mailbox.',
      time: 'Just now',
      unread: false,
      starred: false,
      folder: 'Sent',
    };
    setMails((prev) => [newMail, ...prev]);
    setSelectedMailId(newMail.id);
    setComposeSubject('');
    setComposeBody('');
    setComposeOpen(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: `cm-${Date.now()}`, fromMe: true, text: chatInput.trim(), time: 'Now' },
              ],
            }
          : c
      )
    );
    setChatInput('');
  };

  if (section === 'app-mailbox') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Mailbox</h1>
            <p className="mt-1 text-sm text-slate-500">Internal executive correspondence and audit threads.</p>
          </div>
          <button
            type="button"
            onClick={() => setComposeOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: 'var(--kero-accent)' }}
          >
            <Mail className="h-4 w-4" />
            Compose
          </button>
        </div>

        {composeOpen && (
          <form onSubmit={handleSendMail} className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
            />
            <textarea
              rows={3}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write your message..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--kero-accent)' }}
              >
                Send Message
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs lg:grid-cols-12">
          <div className="divide-y divide-slate-100 border-b border-slate-200 lg:col-span-5 lg:border-b-0 lg:border-r">
            {mails.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMailId(m.id);
                  setMails((prev) => prev.map((x) => (x.id === m.id ? { ...x, unread: false } : x)));
                }}
                className={`cursor-pointer p-4 transition-colors hover:bg-slate-50 ${
                  m.id === selectedMailId ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img src={m.avatar} alt={m.sender} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
                    <span className={`text-sm ${m.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {m.sender}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{m.time}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMails((prev) => prev.map((x) => (x.id === m.id ? { ...x, starred: !x.starred } : x)));
                      }}
                      aria-label="Star message"
                    >
                      <Star className={`h-4 w-4 ${m.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 text-xs font-semibold text-slate-800">{m.subject}</div>
                <div className="mt-0.5 truncate text-xs text-slate-500">{m.preview}</div>
              </div>
            ))}
          </div>

          <div className="p-6 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedMail.avatar} alt={selectedMail.sender} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">{selectedMail.subject}</h2>
                  <div className="text-xs text-slate-500">
                    {selectedMail.sender} &lt;{selectedMail.senderEmail}&gt; · {selectedMail.time}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {selectedMail.body}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'app-chat') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Team Chat</h1>
          <p className="mt-1 text-sm text-slate-500">Direct team channels for incident and release coordination.</p>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs lg:grid-cols-12">
          <div className="divide-y divide-slate-100 border-b border-slate-200 lg:col-span-4 lg:border-b-0 lg:border-r">
            {chats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChatId(c.id)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                  c.id === activeChatId ? 'bg-slate-50' : ''
                }`}
              >
                <img src={c.avatar} alt={c.name} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.role} · {c.lastSeen}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col justify-between lg:col-span-8 min-h-[380px]">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="font-display text-sm font-bold text-slate-900">{activeChat.name}</div>
              <div className="text-xs text-slate-500">{activeChat.role}</div>
            </div>

            <div className="flex-1 space-y-3 p-6">
              {activeChat.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-xl px-4 py-2.5 text-sm ${
                      msg.fromMe ? 'text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                    style={msg.fromMe ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                  >
                    <div>{msg.text}</div>
                    <div className={`mt-1 text-[10px] ${msg.fromMe ? 'text-white/75' : 'text-slate-400'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-100 p-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message ${activeChat.name}...`}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--kero-accent)' }}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'app-faq') {
    const faqs = [
      {
        q: 'How are Portfolio Performance metrics calculated?',
        a: 'Cash Deposits, Invested Dividends, and Capital Gains are aggregated across treasury accounts at the close of each reporting window (7D, 30D, 90D, YTD).',
      },
      {
        q: 'Can I switch between Sidebar and Theme color schemes?',
        a: 'Yes. Use the palette button in the top navigation bar to switch between Kero Coral, Royal Indigo, Forest Emerald, and Midnight Slate, or collapse the sidebar anytime.',
      },
      {
        q: 'Are the Dynamic DataTables exportable?',
        a: 'Every table view supports live search, column sorting, status filtering, and one-click CSV export.',
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">FAQ Section</h1>
          <p className="mt-1 text-sm text-slate-500">Documentation and common operational questions.</p>
        </div>
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200/80 bg-white shadow-xs">
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={f.q} className="p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between text-left font-display text-sm font-semibold text-slate-900"
                >
                  <span>{f.q}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {isOpen && <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'ui-components') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Components &amp; Form Wizard</h1>
          <p className="mt-1 text-sm text-slate-500">Multi-step onboarding wizard with field validation and state persistence.</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setWizardStep(step);
                  setWizardDone(false);
                }}
                className={`flex items-center gap-2 text-xs font-semibold ${
                  wizardStep === step ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: wizardStep >= step ? 'var(--kero-accent)' : '#cbd5e1' }}
                >
                  {wizardStep > step ? <Check className="h-3.5 w-3.5" /> : step}
                </span>
                <span>{step === 1 ? 'Organization' : step === 2 ? 'Plan & Region' : 'Review'}</span>
              </button>
            ))}
          </div>

          {wizardDone ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
              Workspace provisioned for <strong>{wizardForm.orgName}</strong> ({wizardForm.plan}) in {wizardForm.region}.
              <button
                type="button"
                onClick={() => {
                  setWizardStep(1);
                  setWizardDone(false);
                }}
                className="ml-3 underline font-semibold"
              >
                Reset Wizard
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg">
              {wizardStep === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={wizardForm.orgName}
                      onChange={(e) => setWizardForm({ ...wizardForm, orgName: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Email</label>
                    <input
                      type="email"
                      value={wizardForm.billingEmail}
                      onChange={(e) => setWizardForm({ ...wizardForm, billingEmail: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Region</label>
                    <select
                      value={wizardForm.region}
                      onChange={(e) => setWizardForm({ ...wizardForm, region: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    >
                      <option>North America</option>
                      <option>Europe &amp; UK</option>
                      <option>Asia-Pacific</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">License Tier</label>
                    <select
                      value={wizardForm.plan}
                      onChange={(e) => setWizardForm({ ...wizardForm, plan: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    >
                      <option>Personal</option>
                      <option>Developer</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-1">
                  <div><strong>Organization:</strong> {wizardForm.orgName}</div>
                  <div><strong>Email:</strong> {wizardForm.billingEmail}</div>
                  <div><strong>Region:</strong> {wizardForm.region}</div>
                  <div><strong>Tier:</strong> {wizardForm.plan}</div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Back
                  </button>
                )}
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--kero-accent)' }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWizardDone(true)}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--kero-accent)' }}
                  >
                    Complete Setup
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (section === 'ui-tables') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dynamic Tables</h1>
          <p className="mt-1 text-sm text-slate-500">Clean enterprise ledger with tabular numerals and row states.</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3 text-right">MRR</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACCOUNT_ROWS.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{r.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{r.company}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.segment}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      ${r.mrr.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-700">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'widgets-charts-1' || section === 'widgets-charts-2' || section === 'widgets-charts-3') {
    const t = TECH_SUPPORT_SERIES['30d'];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {section === 'widgets-charts-1'
              ? 'Chart Boxes 1'
              : section === 'widgets-charts-2'
                ? 'Chart Boxes 2'
                : 'Chart Boxes 3'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Modular KPI cards, radial rings, and interactive sparkline boxes.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Accounts</div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">78%</div>
            <div className="mt-4">
              <SmoothAreaSparkline data={t.newAccounts.data} color="#3ac47d" defaultHighlightIndex={7} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Sales</div>
            <div className="mt-1 font-display text-3xl font-bold text-slate-900 tabular-nums">$629</div>
            <div className="mt-4">
              <SmoothAreaSparkline data={t.totalSales.data} color="#3b6fd8" defaultHighlightIndex={7} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Support Tickets</div>
            <div className="mt-1 font-display text-3xl font-bold text-[#f5b932] tabular-nums">34</div>
            <div className="mt-4">
              <SmoothAreaSparkline data={t.helpdeskTickets.data} color="#f5b932" defaultHighlightIndex={7} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { label: 'Server Capacity', val: 72, color: '#3b6fd8' },
            { label: 'Storage Pool', val: 48, color: '#3ac47d' },
            { label: 'Budget Spent', val: 89, color: '#d65d43' },
          ].map((ring) => (
            <div key={ring.label} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-5 shadow-xs">
              <div>
                <div className="text-xs text-slate-500">{ring.label}</div>
                <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">{ring.val}%</div>
              </div>
              <DonutRing value={ring.val} color={ring.color} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'pages-billing' || section === 'ui-elements') {
    const plans: { id: 'Personal' | 'Developer' | 'Lifetime'; price: string; seats: string; desc: string }[] = [
      { id: 'Personal', price: '$69', seats: '1 Workspace · 3 Dashboards', desc: 'For individual operators & analysts' },
      { id: 'Developer', price: '$149', seats: '5 Workspaces · All 9 Dashboards', desc: 'For product & engineering teams' },
      { id: 'Lifetime', price: '$349', seats: 'Unlimited Workspaces · Priority SLA', desc: 'For scaling enterprise operations' },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {section === 'pages-billing' ? 'Billing & Licenses' : 'UI Elements & Controls'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Interactive buttons, preference switches, and license tiers.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {plans.map((p) => {
            const active = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-lg border bg-white p-6 shadow-xs transition-all ${
                  active ? 'border-slate-800 ring-1 ring-slate-800' : 'border-slate-200/80'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{p.id} License</div>
                <div className="mt-2 font-display text-3xl font-bold text-slate-900 tabular-nums">{p.price}</div>
                <div className="mt-1 text-xs text-slate-500">{p.desc}</div>
                <div className="mt-3 text-xs font-medium text-slate-700">{p.seats}</div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(p.id)}
                  className={`mt-5 w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
                    active ? 'text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  style={active ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                >
                  {active ? 'Selected Plan' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs">
          <h2 className="font-display text-base font-semibold text-slate-800 mb-4">Preference Switches</h2>
          <div className="divide-y divide-slate-100">
            {[
              { key: 'alerts' as const, label: 'Real-time threshold alerts' },
              { key: 'digest' as const, label: 'Weekly executive PDF digest' },
              { key: 'twoFa' as const, label: 'Enforce 2FA across workspace' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-700">{item.label}</span>
                <button
                  type="button"
                  onClick={() => setToggleValues((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    toggleValues[item.key] ? '' : 'bg-slate-200'
                  }`}
                  style={toggleValues[item.key] ? { backgroundColor: 'var(--kero-accent)' } : undefined}
                >
                  <span
                    className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-xs transition-transform ${
                      toggleValues[item.key] ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'pages-auth') {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/logo_polisi_bersama_masyarakat.png?v=3"
              alt="Logo Polisi Bersama Masyarakat"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="mt-2 font-display text-xl font-bold text-slate-900">Sign in to Workspace</h1>
          <p className="mt-1 text-xs text-slate-500">Standard boxed authentication template preview.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                defaultValue="b.collier@keroui.io"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--kero-accent)' }}
            >
              Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Team Profile fallback (`pages-profile`)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Team Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Account owner details and active team seats.</p>
      </div>
      <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <img src={AVATARS.beck} alt="Beck Collier" referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover" />
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Beck Collier</h2>
          <p className="text-sm text-slate-500">VP Operations · b.collier@keroui.io · Balance $750.00</p>
        </div>
      </div>
    </div>
  );
};
