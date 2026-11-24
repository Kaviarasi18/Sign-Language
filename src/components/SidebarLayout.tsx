import { useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Camera,
  History,
  Info,
  LayoutDashboard,
  Menu,
  RefreshCw,
  ShieldAlert,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { HealthStatus, NavSection } from '../types/isl';

interface SidebarLayoutProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  health: HealthStatus | null;
  onRefreshHealth: () => void;
  speechEnabled: boolean;
  onToggleSpeech: () => void;
  demoMode: boolean;
  children: ReactNode;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  iconColor: string;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, iconColor: 'text-pink-300' },
  { id: 'translator', label: 'Live Translator', icon: Camera, iconColor: 'text-rose-300' },
  { id: 'text-to-isl', label: 'Text to ISL', icon: BookOpen, iconColor: 'text-teal-300' },
  { id: 'history', label: 'Translation History', icon: History, iconColor: 'text-sky-300' },
  { id: 'emergency', label: 'Emergency Board', icon: ShieldAlert, iconColor: 'text-amber-300' },
  { id: 'about', label: 'Model Audit', icon: Info, iconColor: 'text-violet-300' },
];

const SECTION_TITLES: Record<NavSection, string> = {
  landing: 'Landing',
  overview: 'Overview',
  translator: 'Live ISL Translator',
  'text-to-isl': 'Text to ISL Lookup',
  history: 'Translation History',
  emergency: 'Emergency Communication',
  about: 'Model Audit & Setup',
};

export function SidebarLayout({
  activeSection,
  onNavigate,
  health,
  onRefreshHealth,
  speechEnabled,
  onToggleSpeech,
  demoMode,
  children,
}: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const fastapiReady = Boolean(health?.fastapiConnected && health?.modelLoaded);

  const handleNav = (id: NavSection) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-[#1F0A18] flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1F0A18]/45 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glitter-rose-surface text-white flex flex-col justify-between transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          <div className="h-1 w-full prismatic-top-bar" />
          <div className="px-6 py-4 border-b border-white/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleNav('landing')}
              className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              SignBridge
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-rose-100 hover:bg-white/10 cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1" aria-label="Dashboard Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'glitter-rose-btn text-white'
                      : 'text-rose-100/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.iconColor}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/15 space-y-3">
          <div className="rounded-lg bg-white/10 p-3 text-xs">
            <div className="flex items-center justify-between gap-2 text-white">
              <span className="font-medium">FastAPI Backend</span>
              {fastapiReady ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              )}
            </div>
            <p className="text-rose-100/80 mt-1">
              {fastapiReady
                ? 'Connected · Model ready'
                : health?.fastapiConnected
                  ? 'Connected · Model standby'
                  : 'Offline · Local laptop setup'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleNav('landing')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-1 w-full prismatic-top-bar" />
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-rose-200 text-[#1F0A18] hover:bg-rose-50 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-rose-500 font-medium hidden sm:inline whitespace-nowrap">
                SignBridge
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-[#1F0A18] truncate">
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {demoMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold whitespace-nowrap">
                <Activity className="w-3.5 h-3.5" />
                DEMO MODE
              </span>
            )}

            <button
              type="button"
              onClick={onToggleSpeech}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                speechEnabled
                  ? 'border-[#4c1d95] bg-[#1e1b4b] text-white hover:bg-[#312e81]'
                  : 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-900'
              }`}
            >
              {speechEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-violet-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-300" />
              )}
              <span>{speechEnabled ? 'Speech On' : 'Speech Off'}</span>
            </button>

            <button
              type="button"
              onClick={onRefreshHealth}
              title="Refresh FastAPI backend health status"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#115e59] bg-[#042f2e] text-xs font-medium text-white hover:bg-[#0f3f3c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">
                {fastapiReady ? 'Backend Ready' : 'Check Backend'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
