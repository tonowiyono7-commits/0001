import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Menu,
  MoreVertical,
  Palette,
  Search,
  X,
} from 'lucide-react';
import { AVATARS } from '../data/mockData';
import type { NavSectionId, ThemeAccent } from '../types/dashboard';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onToggleDesktopSidebar: () => void;
  activeSection: NavSectionId;
  onSelectSection: (id: NavSectionId) => void;
  themeAccent: ThemeAccent;
  onChangeTheme: (theme: ThemeAccent) => void;
  globalSearch: string;
  onChangeGlobalSearch: (q: string) => void;
}

const QUICK_ROUTES: { id: NavSectionId; label: string; group: string }[] = [
  { id: 'jadwal-piket', label: 'Jadwal Piket (Berkelanjutan)', group: 'Dashboards' },
  { id: 'sprin-editor', label: 'Buat Sprin (Editor A4)', group: 'Surat Perintah' },
  { id: 'sprin-arsip', label: 'Arsip Sprin', group: 'Surat Perintah' },
  { id: 'analytics', label: 'Analytics Overview', group: 'Dashboards' },
  { id: 'management', label: 'Management', group: 'Dashboards' },
  { id: 'advertisement', label: 'Advertisement', group: 'Dashboards' },
  { id: 'helpdesk', label: 'Helpdesk Queue', group: 'Dashboards' },
  { id: 'monitoring', label: 'Server Monitoring', group: 'Dashboards' },
  { id: 'cryptocurrency', label: 'Cryptocurrency', group: 'Dashboards' },
  { id: 'project-management', label: 'Project Management', group: 'Dashboards' },
  { id: 'product', label: 'Product Catalog', group: 'Dashboards' },
  { id: 'statistics', label: 'Statistics', group: 'Dashboards' },
  { id: 'app-mailbox', label: 'Mailbox', group: 'Applications' },
  { id: 'app-chat', label: 'Team Chat', group: 'Applications' },
  { id: 'ui-tables', label: 'Dynamic DataTables', group: 'UI Components' },
  { id: 'widgets-charts-1', label: 'Chart Boxes 1', group: 'Widgets' },
];

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onToggleDesktopSidebar,
  onSelectSection,
  themeAccent,
  onChangeTheme,
  globalSearch,
  onChangeGlobalSearch,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Production release ready', time: '4m ago', unread: true },
    { id: 'n2', title: 'Capital Gains up +7.35%', time: '28m ago', unread: true },
    { id: 'n3', title: 'TKT-8821 escalated to Marcus', time: '1h ago', unread: false },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setNotifOpen(false);
        setThemeOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filteredRoutes = globalSearch.trim()
    ? QUICK_ROUTES.filter(
        (r) =>
          r.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
          r.group.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : QUICK_ROUTES.slice(0, 6);

  const themes: { id: ThemeAccent; name: string; color: string }[] = [
    { id: 'coral', name: 'Kero Coral', color: '#d65d43' },
    { id: 'indigo', name: 'Royal Indigo', color: '#4353d6' },
    { id: 'emerald', name: 'Forest Emerald', color: '#188c60' },
    { id: 'slate', name: 'Midnight Slate', color: '#2c3e50' },
  ];

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 px-4 text-white shadow-xs sm:px-6 transition-colors duration-200 print:hidden"
      style={{ backgroundColor: 'var(--kero-accent)' }}
    >
      {/* Left Zone: Mobile brand + hamburger / Desktop sidebar toggle + search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          aria-label="Toggle desktop sidebar"
          className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectSection('jadwal-piket')}
          aria-label="Polisi Bersama Masyarakat — Beranda"
          className="flex items-center lg:hidden shrink-0 cursor-pointer"
        >
          <img
            src="/assets/aistudio/logo_polisi_bersama_masyarakat.png?v=3"
            alt="Logo Polisi Bersama Masyarakat"
            className="h-10 w-auto object-contain"
          />
        </button>

        {/* Search Input on Desktop */}
        <div className="relative hidden md:block">
          <div className="flex items-center rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white placeholder:text-white/70 focus-within:bg-white/25 transition-colors">
            <Search className="mr-2 h-4 w-4 text-white/80 shrink-0" />
            <input
              type="text"
              value={globalSearch}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                onChangeGlobalSearch(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search dashboards, tables..."
              className="w-56 bg-transparent text-sm text-white placeholder:text-white/75 focus:outline-none"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => onChangeGlobalSearch('')}
                aria-label="Clear search"
                className="ml-1 text-white/75 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {searchOpen && (
            <div className="absolute left-0 top-12 w-72 rounded-lg border border-slate-200 bg-white py-2 text-slate-800 shadow-lg">
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Jump
              </div>
              {filteredRoutes.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-500">No matching views found.</div>
              ) : (
                filteredRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(r.id);
                      setSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-700">{r.label}</span>
                    <span className="text-xs text-slate-400">{r.group}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Zone: Install App, Theme Switcher, Notifications, Profile, Mobile Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <PWAInstallButton variant="header" />

        {/* Theme Accent Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setThemeOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Color theme options"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 transition-colors"
          >
            <Palette className="h-5 w-5" />
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-lg border border-slate-200 bg-white p-2 text-slate-800 shadow-lg">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Color Scheme
              </div>
              <div className="mt-1 space-y-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChangeTheme(t.id);
                      setThemeOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-medium text-slate-700">{t.name}</span>
                    </span>
                    {themeAccent === t.id && <Check className="h-4 w-4 text-slate-700" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setThemeOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/15 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900 tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-72 rounded-lg border border-slate-200 bg-white p-2 text-slate-800 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1.5">
                <span className="text-xs font-semibold text-slate-800">Notifications</span>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                  }
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--kero-accent)' }}
                >
                  Mark all read
                </button>
              </div>
              <div className="mt-1 divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                      )
                    }
                    className={`cursor-pointer px-2 py-2.5 text-xs transition-colors hover:bg-slate-50 ${
                      n.unread ? 'bg-slate-50/70 font-semibold text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    <div>{n.title}</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-400">{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown (Desktop) */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
              setThemeOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg py-1 pl-1.5 pr-2 hover:bg-white/15 transition-colors"
          >
            <img
              src={AVATARS.beck}
              alt="Beck Collier"
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
            />
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-white whitespace-nowrap">Beck Collier</div>
              <div className="text-[11px] text-white/80 font-mono tabular-nums">$750.00</div>
            </div>
            <ChevronDown className="h-4 w-4 text-white/80" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-48 rounded-lg border border-slate-200 bg-white py-1.5 text-slate-800 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onSelectSection('pages-profile');
                  setProfileOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Team Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectSection('pages-billing');
                  setProfileOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Billing &amp; Licenses
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  onSelectSection('pages-auth');
                  setProfileOpen(false);
                }}
                className="block w-full px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              >
                Auth Preview
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger + More Menu matching Screenshot 2 */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/15 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-label="Account options"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/15 sm:hidden"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
