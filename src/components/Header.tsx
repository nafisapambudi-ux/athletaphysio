import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Plus,
  Sun,
  Moon,
  Download,
  Database,
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
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Athlete } from '../types/athlete';
import { AthleteRiskAlert } from '../utils/sportsScience';

interface HeaderProps {
  demoMode: boolean;
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
  alerts?: AthleteRiskAlert[];
  onSelectAthleteDetail?: (athlete: Athlete) => void;
  onSelectAthleteForAI?: (athlete: Athlete) => void;
}

export const Header: React.FC<HeaderProps> = ({
  demoMode,
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
  alerts = [],
  onSelectAthleteDetail,
  onSelectAthleteForAI,
}) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const alertDropdownRef = useRef<HTMLDivElement | null>(null);

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
  const navItems = [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'analytics', label: 'Dashboard & Grafik' },
    { id: 'jump_vbt', label: 'Uji VJ & VBT' },
    { id: 'goals', label: 'Target Performa' },
    { id: 'roster', label: 'Roster Atlet' },
    { id: 'acwr', label: 'Beban ACWR' },
    { id: 'wellness', label: 'Wellness' },
    { id: 'fitness', label: 'Tes Fisik' },
    { id: 'injuries', label: 'Peta Nyeri' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark + Cloud DB Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
                AthletaPhysio
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 rounded border border-emerald-300 dark:border-emerald-800/80">
                <Database className="w-2.5 h-2.5" />
                <span>Firestore DB</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer rounded-md ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions + Auth Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Cloud Sync Status Indicator */}
          {demoMode ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-md">
              Demo Lokal
            </span>
          ) : <div 
            title={isCloudSyncing ? "Menyinkronkan ke Cloud Firestore..." : "Database Cloud Firestore Terhubung"} 
            className="hidden md:flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md"
          >
            <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-[10px]">{isCloudSyncing ? 'Sync...' : 'Cloud Aktif'}</span>
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
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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

          {/* Firebase Authentication Sign-In / User Chip */}
          {!demoMode ? (currentUser ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'P')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <button
                  onClick={onSignOut}
                  title="Keluar (Sign Out)"
                  className="p-1 hover:text-red-500 text-slate-500 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              title="Masuk dengan Google (Firebase Auth)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Masuk Google</span>
            </button>
          )) : null}

          <button
            onClick={onOpenQuickLog}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catat Data</span>
          </button>
        </div>

      </div>

      {/* Mobile Navigation Scrollbar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 rounded ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
