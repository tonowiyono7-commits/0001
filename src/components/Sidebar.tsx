import React, { useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Compass,
  Diamond,
  FileSignature,
  FileText,
  Layers,
  LayoutGrid,
  PieChart,
  Rocket,
  Table2,
  X,
} from 'lucide-react';
import type { NavSectionId } from '../types/dashboard';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeSection: NavSectionId;
  onSelectSection: (id: NavSectionId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  desktopCollapsed: boolean;
}

const DASHBOARD_ITEMS: { id: NavSectionId; label: string }[] = [
  { id: 'jadwal-piket', label: 'Jadwal Piket' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'management', label: 'Management' },
  { id: 'advertisement', label: 'Advertisement' },
  { id: 'helpdesk', label: 'Helpdesk' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'cryptocurrency', label: 'Cryptocurrency' },
  { id: 'project-management', label: 'Project Management' },
  { id: 'product', label: 'Product' },
  { id: 'statistics', label: 'Statistics' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  desktopCollapsed,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboards: true,
    pages: false,
    applications: false,
    elements: false,
    components: false,
    tables: false,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNav = (id: NavSectionId) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const isDashboardActive = DASHBOARD_ITEMS.some((d) => d.id === activeSection);

  const navContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
        <button
          type="button"
          onClick={() => handleNav('jadwal-piket')}
          aria-label="Polisi Bersama Masyarakat — Beranda"
          className="flex items-center gap-2.5 focus:outline-none cursor-pointer"
        >
          <img
            src="/assets/aistudio/logo_polisi_bersama_masyarakat.png?v=3"
            alt="Logo Polisi Bersama Masyarakat"
            className="h-12 w-auto object-contain"
          />
          <span className="text-left leading-tight">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
              Polsek Semarang
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Selatan
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6" aria-label="Sidebar Navigation">
        {/* MENU */}
        <div>
          <p
            className="mb-2.5 px-2 text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--kero-accent)' }}
          >
            MENU
          </p>

          {/* Dashboards */}
          <div>
            <button
              type="button"
              onClick={() => toggleGroup('dashboards')}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <Rocket
                  className="h-4 w-4 shrink-0"
                  style={{ color: isDashboardActive ? 'var(--kero-accent)' : '#64748b' }}
                />
                <span>Dashboards</span>
              </span>
              {openGroups.dashboards ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {openGroups.dashboards && (
              <ul className="mt-1 space-y-0.5 pl-3">
                {DASHBOARD_ITEMS.map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNav(item.id)}
                        className={`flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-[13.5px] transition-colors ${
                          active
                            ? 'font-semibold'
                            : 'font-normal text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        style={
                          active
                            ? {
                                backgroundColor: 'var(--kero-accent-soft)',
                                color: 'var(--kero-accent)',
                              }
                            : undefined
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: 'var(--kero-accent)' }}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Surat Perintah (SIPRIN) */}
          <div className="mt-2">
            <p
              className="mb-1.5 mt-4 px-2 text-[11px] font-bold tracking-wider uppercase"
              style={{ color: 'var(--kero-accent)' }}
            >
              SURAT PERINTAH
            </p>
            <ul className="space-y-0.5 pl-1">
              {[
                { id: 'sprin-editor' as NavSectionId, label: 'Buat Sprin (Editor A4)' },
                { id: 'sprin-arsip' as NavSectionId, label: 'Arsip Sprin' },
              ].map((item) => {
                const active = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`flex w-full items-center gap-3 rounded-full px-3 py-2 text-left text-[13.5px] transition-colors ${
                        active
                          ? 'font-semibold'
                          : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      style={
                        active
                          ? { backgroundColor: 'var(--kero-accent-soft)', color: 'var(--kero-accent)' }
                          : undefined
                      }
                    >
                      <FileSignature
                        className="h-4 w-4 shrink-0"
                        style={{ color: active ? 'var(--kero-accent)' : '#94a3b8' }}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pages */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => toggleGroup('pages')}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span>Pages</span>
              </span>
              {openGroups.pages ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {openGroups.pages && (
              <ul className="mt-1 space-y-0.5 pl-3">
                {[
                  { id: 'pages-profile' as NavSectionId, label: 'Team Profile' },
                  { id: 'pages-billing' as NavSectionId, label: 'Billing & Licenses' },
                  { id: 'pages-auth' as NavSectionId, label: 'Login & Auth Preview' },
                ].map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNav(item.id)}
                        className={`flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-[13.5px] transition-colors ${
                          active ? 'font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        style={
                          active
                            ? { backgroundColor: 'var(--kero-accent-soft)', color: 'var(--kero-accent)' }
                            : undefined
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: 'var(--kero-accent)' }}
                        />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Applications */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => toggleGroup('applications')}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="flex items-center gap-3">
                <LayoutGrid className="h-4 w-4 shrink-0 text-slate-400" />
                <span>Applications</span>
              </span>
              {openGroups.applications ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {openGroups.applications && (
              <ul className="mt-1 space-y-0.5 pl-3">
                {[
                  { id: 'app-mailbox' as NavSectionId, label: 'Mailbox' },
                  { id: 'app-chat' as NavSectionId, label: 'Team Chat' },
                  { id: 'app-faq' as NavSectionId, label: 'FAQ Section' },
                ].map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNav(item.id)}
                        className={`flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-[13.5px] transition-colors ${
                          active ? 'font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        style={
                          active
                            ? { backgroundColor: 'var(--kero-accent-soft)', color: 'var(--kero-accent)' }
                            : undefined
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: 'var(--kero-accent)' }}
                        />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* UI COMPONENTS */}
        <div>
          <p
            className="mb-2.5 px-2 text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--kero-accent)' }}
          >
            UI COMPONENTS
          </p>

          <button
            type="button"
            onClick={() => {
              toggleGroup('elements');
              handleNav('ui-elements');
            }}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
              activeSection === 'ui-elements' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Diamond className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Elements</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              toggleGroup('components');
              handleNav('ui-components');
            }}
            className={`mt-1 flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
              activeSection === 'ui-components' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Layers className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Components</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              toggleGroup('tables');
              handleNav('ui-tables');
            }}
            className={`mt-1 flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
              activeSection === 'ui-tables' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Table2 className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Tables</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* DASHBOARD WIDGETS */}
        <div>
          <p
            className="mb-2.5 px-2 text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--kero-accent)' }}
          >
            DASHBOARD WIDGETS
          </p>

          {[
            { id: 'widgets-charts-1' as NavSectionId, label: 'Chart Boxes 1', Icon: PieChart },
            { id: 'widgets-charts-2' as NavSectionId, label: 'Chart Boxes 2', Icon: Compass },
            { id: 'widgets-charts-3' as NavSectionId, label: 'Chart Boxes 3', Icon: BarChart2 },
          ].map(({ id, label, Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNav(id)}
                className={`mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors ${
                  active ? 'font-semibold' : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={
                  active
                    ? { backgroundColor: 'var(--kero-accent-soft)', color: 'var(--kero-accent)' }
                    : undefined
                }
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: active ? 'var(--kero-accent)' : '#94a3b8' }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Install PWA Action */}
      <div className="shrink-0 border-t border-slate-100 p-3.5">
        <PWAInstallButton variant="sidebar" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside
        className={`hidden lg:block print:hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-200 ${
          desktopCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[260px]'
        }`}
      >
        <div className="sticky top-0 h-screen w-[260px]">{navContent}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 h-full w-[280px] max-w-[82vw] shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
