import { useEffect, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { AppsAndWidgets } from './components/AppsAndWidgets';
import { Header } from './components/Header';
import { JadwalPiketView } from './components/JadwalPiketView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Sidebar } from './components/Sidebar';
import { SprinWorkspaceView } from './components/SprinWorkspaceView';
import { SuiteDashboards } from './components/SuiteDashboards';
import type { AppView } from './sprin/types/sprin';
import type { NavSectionId, ThemeAccent } from './types/dashboard';

const SUITE_SECTIONS = new Set<NavSectionId>([
  'management',
  'advertisement',
  'helpdesk',
  'monitoring',
  'cryptocurrency',
  'project-management',
  'product',
  'statistics',
]);

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSectionId>('jadwal-piket');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('coral');
  const [globalSearch, setGlobalSearch] = useState('');
  const [pendingPiketSync, setPendingPiketSync] = useState<{ isoDate: string; nonce: number } | null>(null);

  useEffect(() => {
    if (themeAccent === 'coral') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeAccent);
    }
  }, [themeAccent]);

  const isSprinSection = activeSection === 'sprin-editor' || activeSection === 'sprin-arsip';

  const sprinView: AppView = activeSection === 'sprin-arsip' ? 'arsip' : 'editor';

  const handleSprinTabChange = (view: AppView) => {
    if (view === 'arsip') setActiveSection('sprin-arsip');
    else setActiveSection('sprin-editor');
  };

  const handleCreateSprinFromPiket = (isoDate: string) => {
    setPendingPiketSync({ isoDate, nonce: Date.now() });
    setActiveSection('sprin-editor');
  };

  return (
    <div className="flex min-h-screen bg-[#f1f4f6] text-slate-800">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((v) => !v)}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          themeAccent={themeAccent}
          onChangeTheme={setThemeAccent}
          globalSearch={globalSearch}
          onChangeGlobalSearch={setGlobalSearch}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          {activeSection === 'jadwal-piket' ? (
            <JadwalPiketView onCreateSprinFromPiket={handleCreateSprinFromPiket} />
          ) : isSprinSection ? (
            <SprinWorkspaceView
              activeView={sprinView}
              onChangeView={handleSprinTabChange}
              pendingPiketSync={pendingPiketSync}
              onConsumePendingPiketSync={() => setPendingPiketSync(null)}
            />
          ) : activeSection === 'analytics' ? (
            <AnalyticsView />
          ) : SUITE_SECTIONS.has(activeSection) ? (
            <SuiteDashboards section={activeSection} />
          ) : (
            <AppsAndWidgets section={activeSection} />
          )}
        </main>
      </div>
      <OfflineIndicator />
    </div>
  );
}
