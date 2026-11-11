import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Plus,
  Sun,
  Moon,
  Download,
  LogIn,
  LogOut,
  CheckCircle2,
  Bell,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  X,
  Sparkles,
  ChevronRight,
  Flame,
  LayoutDashboard,
  Home,
  Menu,
  BarChart3,
  Zap,
  Target,
  UsersRound,
  HeartPulse,
  ClipboardCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Athlete } from '../types/athlete';
import { AthleteRiskAlert } from '../utils/sportsScience';

interface HeaderProps {
  demoMode: boolean;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickLog: () => void;
  onExportCSV: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isCloudSyncing: boolean;
  cloudSyncError?: string | null;
  alerts?: AthleteRiskAlert[];
  onSelectAthleteDetail?: (athlete: Athlete) => void;
  onSelectAthleteForAI?: (athlete: Athlete) => void;
}

export const Header: React.FC<HeaderProps> = ({
  demoMode,
  sidebarExpanded,
  onToggleSidebar,
  activeTab,
  setActiveTab,
  onOpenQuickLog,
  onExportCSV,
  darkMode,
  setDarkMode,
  currentUser,
  onSignIn,
  onSignOut,
  isCloudSyncing,
  cloudSyncError = null,
  alerts = [],
  onSelectAthleteDetail,
  onSelectAthleteForAI,
}) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const alertDropdownRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
    mobileMenuButtonRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertDropdownRef.current && !alertDropdownRef.current.contains(event.target as Node)) {
        setAlertOpen(false);
      }
    };
    if (alertOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [alertOpen]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileSidebar();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analitik', icon: BarChart3 },
    { id: 'jump_vbt', label: 'Uji VJ & VBT', icon: Zap },
    { id: 'goals', label: 'Target Performa', icon: Target },
    { id: 'roster', label: 'Roster Atlet', icon: UsersRound },
    { id: 'acwr', label: 'Beban ACWR', icon: Activity },
    { id: 'wellness', label: 'Wellness', icon: HeartPulse },
    { id: 'fitness', label: 'Tes Fisik', icon: ClipboardCheck },
    { id: 'injuries', label: 'Peta Nyeri', icon: Flame },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 md:flex ${
          sidebarExpanded ? 'w-60' : 'w-[76px]'
        }`}
      >
        <button
          onClick={() => setActiveTab('home')}
          className={`flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-4 text-left dark:border-slate-800 ${
            sidebarExpanded ? '' : 'justify-center px-2'
          }`}
          title="AthletaPhysio — Beranda"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          {sidebarExpanded && (
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                AthletaPhysio
              </span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {demoMode ? 'Demo publik' : currentUser ? 'Firestore DB' : 'Mode lokal'}
              </span>
            </span>
          )}
        </button>

        <nav aria-label="Navigasi utama" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {[
            { label: 'UTAMA', ids: ['home', 'dashboard', 'analytics'] },
            { label: 'PERFORMA', ids: ['jump_vbt', 'goals', 'roster'] },
            { label: 'PEMANTAUAN', ids: ['acwr', 'wellness', 'fitness', 'injuries'] },
          ].map((group) => (
            <div key={group.label}>
              {sidebarExpanded && (
                <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {navItems.filter((item) => group.ids.includes(item.id)).map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                      }}
                      title={sidebarExpanded ? undefined : item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      } ${sidebarExpanded ? '' : 'justify-center px-0'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {sidebarExpanded && <span className="truncate">{item.label}</span>}
                      {sidebarExpanded && isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t border-slate-100 p-3 dark:border-slate-800 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
          {sidebarExpanded ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span className={`h-2 w-2 shrink-0 rounded-full ${
                demoMode ? 'bg-amber-500' : cloudSyncError ? 'bg-rose-500' : isCloudSyncing ? 'animate-pulse bg-amber-500' : currentUser ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                  {demoMode ? 'Demo — data lokal' : cloudSyncError ? 'Sinkronisasi bermasalah' : isCloudSyncing ? 'Menyinkronkan data' : currentUser ? 'Cloud aktif' : 'Mode lokal'}
                </p>
                <p className="truncate text-[9px] text-slate-500 dark:text-slate-400">
                  {currentUser?.displayName || currentUser?.email || 'AthletaPhysio'}
                </p>
              </div>
            </div>
          ) : (
            <span
              title={demoMode ? 'Demo — data lokal' : cloudSyncError ? 'Sinkronisasi bermasalah' : isCloudSyncing ? 'Menyinkronkan data' : currentUser ? 'Cloud aktif' : 'Mode lokal'}
              className={`h-2 w-2 rounded-full ${
                demoMode ? 'bg-amber-500' : cloudSyncError ? 'bg-rose-500' : isCloudSyncing ? 'animate-pulse bg-amber-500' : currentUser ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          )}
          {!demoMode && (
            <div className={`mt-2 ${sidebarExpanded ? '' : 'mt-3'}`}>
              {currentUser ? (
                <button
                  onClick={onSignOut}
                  title="Keluar dari akun"
                  className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${
                    sidebarExpanded ? '' : 'justify-center'
                  }`}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="h-5 w-5 rounded-full" />
                  ) : (
                    <LogOut className="h-4 w-4 shrink-0" />
                  )}
                  {sidebarExpanded && <span className="truncate">Keluar dari akun</span>}
                </button>
              ) : (
                <button
                  onClick={onSignIn}
                  title={sidebarExpanded ? undefined : 'Masuk dengan Google'}
                  className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${
                    sidebarExpanded ? '' : 'justify-center'
                  }`}
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  {sidebarExpanded && <span>Masuk dengan Google</span>}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 md:hidden ${
          mobileSidebarOpen ? '' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileSidebarOpen}
        inert={!mobileSidebarOpen}
      >
        <button
          aria-label="Tutup menu"
          tabIndex={mobileSidebarOpen ? 0 : -1}
          onClick={closeMobileSidebar}
          className={`absolute inset-0 bg-slate-950/45 transition-opacity ${
            mobileSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[min(19rem,85vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab('home');
                closeMobileSidebar();
              }}
              className="flex items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Activity className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900 dark:text-white">AthletaPhysio</span>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {demoMode ? 'Demo publik' : currentUser ? 'Firestore DB' : 'Mode lokal'}
                </span>
              </span>
            </button>
            <button
              onClick={closeMobileSidebar}
              aria-label="Tutup menu"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Navigasi utama" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {[
              { label: 'UTAMA', ids: ['home', 'dashboard', 'analytics'] },
              { label: 'PERFORMA', ids: ['jump_vbt', 'goals', 'roster'] },
              { label: 'PEMANTAUAN', ids: ['acwr', 'wellness', 'fitness', 'injuries'] },
            ].map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-400">{group.label}</p>
                <div className="space-y-1">
                  {navItems.filter((item) => group.ids.includes(item.id)).map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          closeMobileSidebar();
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <p className="mb-3 text-[10px] text-slate-500 dark:text-slate-400">
              {demoMode ? 'Demo — data hanya tersimpan di browser ini' : cloudSyncError ? 'Sinkronisasi bermasalah' : isCloudSyncing ? 'Menyinkronkan data' : currentUser ? 'Cloud aktif' : 'Mode lokal — data tersimpan di browser'}
            </p>
            {!demoMode && (currentUser ? (
              <button onClick={onSignOut} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                <LogOut className="h-4 w-4" />
                Keluar dari akun
              </button>
            ) : (
              <button onClick={onSignIn} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                <LogIn className="h-4 w-4" />
                Masuk dengan Google
              </button>
            ))}
          </div>
        </aside>
      </div>

      <header className={`fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-[left] dark:border-slate-800 dark:bg-slate-900/95 ${
        sidebarExpanded ? 'md:left-60' : 'md:left-[76px]'
      }`}>
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-5 lg:px-7">
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={mobileSidebarOpen}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarExpanded ? 'Ciutkan sidebar' : 'Buka sidebar'}
            aria-expanded={sidebarExpanded}
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
              {navItems.find((item) => item.id === activeTab)?.label || 'AthletaPhysio'}
            </span>
            <span className="hidden text-xs text-slate-400 md:inline">/</span>
            <span className="hidden truncate text-xs text-slate-500 dark:text-slate-400 md:inline">
              Monitoring kondisi atlet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          
          {/* Cloud Sync Status Indicator */}
          {demoMode ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-md">
              Demo Lokal
            </span>
          ) : <div 
            title={cloudSyncError || (isCloudSyncing ? "Menyinkronkan ke Cloud Firestore..." : currentUser ? "Database Cloud Firestore Terhubung" : "Masuk untuk mengaktifkan sinkronisasi cloud")}
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md"
          >
            <span className={`w-2 h-2 rounded-full ${cloudSyncError ? 'bg-rose-500' : isCloudSyncing ? 'bg-amber-500 animate-ping' : currentUser ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-[10px]">
              {cloudSyncError ? 'Sync gagal' : isCloudSyncing ? 'Sync...' : currentUser ? 'Cloud Aktif' : 'Lokal'}
            </span>
          </div>}

          {/* Alert Center Notification Bell */}
          <div className="relative" ref={alertDropdownRef}>
            <button
              onClick={() => setAlertOpen(!alertOpen)}
              title={
                alerts.length > 0
                  ? `${alerts.length} Atlet Membutuhkan Perhatian Khusus (ACWR di luar batas atau Nyeri > 5)`
                  : 'Semua atlet dalam kondisi beban optimal dan bebas nyeri akut'
              }
              className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
                alerts.length > 0
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold font-mono shadow-xs ring-2 ring-white dark:ring-slate-900">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {alertOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-left">
                {/* Popover Header */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Peringatan Dini Atlet ({alerts.length})
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        ACWR di luar optimal (0.8 - 1.3) & Nyeri &gt; 5 / 24 Jam
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAlertOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Popover Content */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Kondisi Tim Terjaga</div>
                      <p className="text-[11px] mt-1 text-slate-400">
                        Tidak ada atlet dengan ACWR di luar rentang optimal atau keluhan nyeri tinggi.
                      </p>
                    </div>
                  ) : (
                    alerts.map((al) => {
                      const athlete = al.athlete;
                      const isDangerAcwr = al.isAcwrAlert && al.acwrRatio > 1.5;
                      const isHighAcwr = al.isAcwrAlert && al.acwrRatio > 1.3 && al.acwrRatio <= 1.5;
                      const isLowAcwr = al.isAcwrAlert && al.acwrRatio < 0.8;

                      return (
                        <div
                          key={athlete.id}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {athlete.avatarUrl ? (
                                <img
                                  src={athlete.avatarUrl}
                                  alt={athlete.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                                  {athlete.name[0]}
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {athlete.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {athlete.sport} · {athlete.position}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                                al.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {al.severity === 'critical' ? 'Kritis' : 'Waspada'}
                            </span>
                          </div>

                          {/* Alert Reason Pills */}
                          <div className="space-y-1">
                            {al.isAcwrAlert && (
                              <div
                                className={`text-[10px] font-medium p-1.5 rounded flex items-center justify-between ${
                                  isDangerAcwr
                                    ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                    : isHighAcwr
                                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>
                                    {isDangerAcwr
                                      ? 'ACWR Kritis (Zona Bahaya)'
                                      : isHighAcwr
                                      ? 'ACWR Meningkat (Lonjakan Beban)'
                                      : 'ACWR Rendah (Under-training)'}
                                  </span>
                                </span>
                                <span className="font-mono font-bold">{al.acwrRatio.toFixed(2)}</span>
                              </div>
                            )}

                            {al.isPainAlert && (
                              <div className="text-[10px] font-medium p-1.5 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 shrink-0 text-rose-600" />
                                  <span>
                                    {al.highPainPoints[0]?.location || 'Nyeri Muskuloskeletal'}
                                  </span>
                                </span>
                                <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                                  VAS {al.maxPainLevel}/10
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {onSelectAthleteDetail && (
                              <button
                                onClick={() => {
                                  onSelectAthleteDetail(athlete);
                                  setAlertOpen(false);
                                }}
                                className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 transition-colors text-center cursor-pointer"
                              >
                                Detail & Unduh PDF
                              </button>
                            )}
                            {onSelectAthleteForAI && (
                              <button
                                onClick={() => {
                                  onSelectAthleteForAI(athlete);
                                  setAlertOpen(false);
                                }}
                                className="py-1 px-2 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>AI</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer Shortcuts */}
                {alerts.length > 0 && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setActiveTab('acwr');
                        setAlertOpen(false);
                      }}
                      className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer"
                    >
                      Buka Tab Beban ACWR &rarr;
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('injuries');
                        setAlertOpen(false);
                      }}
                      className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold cursor-pointer"
                    >
                      Peta Nyeri &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onExportCSV}
            title="Ekspor Rekapitulasi Data Fisik (CSV)"
            className="hidden p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:inline-flex"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenQuickLog}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catat Data</span>
          </button>
        </div>

      </div>
      </header>
    </>
  );
};
