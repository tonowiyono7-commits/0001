export type NavSectionId =
  | 'jadwal-piket'
  | 'sprin-editor'
  | 'sprin-arsip'
  | 'analytics'
  | 'management'
  | 'advertisement'
  | 'helpdesk'
  | 'monitoring'
  | 'cryptocurrency'
  | 'project-management'
  | 'product'
  | 'statistics'
  | 'pages-profile'
  | 'pages-billing'
  | 'pages-auth'
  | 'app-mailbox'
  | 'app-chat'
  | 'app-faq'
  | 'ui-elements'
  | 'ui-components'
  | 'ui-tables'
  | 'widgets-charts-1'
  | 'widgets-charts-2'
  | 'widgets-charts-3';

export type PersonnelUnit =
  | 'PIMPINAN'
  | 'PAWAS'
  | 'SAMAPTA'
  | 'LANTAS'
  | 'BHABIN'
  | 'INTEL'
  | 'RESKRIM'
  | 'STANBY'
  | 'SPK'
  | 'JAGA BANK'
  | 'SIUM';

export type ShiftCode = '' | 'X' | 'S' | 'M' | 'L' | 'P' | 'C' | 'C1' | 'C2';

export interface PersonnelSchedule {
  id: string;
  no: number;
  unit: PersonnelUnit;
  nama: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  ket?: string;
  tidakPiket?: boolean;
  dutyMode: 'roster' | 'staff' | 'pam' | 'pimpinan';
  cyclePattern: ShiftCode[]; // Repeating cycle anchored at 1 Desember 2026 (day offset 0)
}

export type ThemeAccent = 'coral' | 'indigo' | 'emerald' | 'slate';

export type TimeframeKey = '7d' | '30d' | '90d' | 'ytd';

export interface TimelineItem {
  id: string;
  title: string;
  time?: string;
  badge?: string;
  tone: 'crimson' | 'amber' | 'emerald' | 'blue';
  completed?: boolean;
}

export interface AccountRow {
  id: string;
  company: string;
  contact: string;
  avatar: string;
  segment: string;
  mrr: number;
  growth: number;
  status: 'Active' | 'Pending' | 'Completed' | 'At Risk';
  lastActivity: string;
}

export interface PortfolioItem {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  deltaLabel: string;
  deltaPrefix?: string;
  direction: 'up' | 'down';
  tone: 'amber' | 'crimson' | 'emerald';
  allocationPct: number;
  benchmark: string;
}

export interface TicketRow {
  id: string;
  subject: string;
  requester: string;
  assignee: string;
  assigneeAvatar: string;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  slaRemaining: string;
  channel: 'Email' | 'Chat' | 'Portal';
}

export interface ProjectTask {
  id: string;
  title: string;
  epic: string;
  owner: string;
  ownerAvatar: string;
  stage: 'Backlog' | 'In Progress' | 'Review' | 'Done';
  progress: number;
  dueDate: string;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  holdings: number;
  sparkline: number[];
  color: string;
}

export interface ServerNode {
  id: string;
  name: string;
  region: string;
  cpu: number;
  memory: number;
  latencyMs: number;
  uptime: string;
  state: 'Healthy' | 'Elevated' | 'Maintenance';
}

export interface MailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
  folder: 'Inbox' | 'Sent' | 'Archive';
}

export interface ChatThread {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastSeen: string;
  messages: {
    id: string;
    fromMe: boolean;
    text: string;
    time: string;
  }[];
}
