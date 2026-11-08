import React from 'react';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord, BodyPainPoint } from '../types/athlete';
import { Activity, AlertTriangle, CheckCircle2, Zap, ArrowRight, ShieldAlert, Sparkles, Plus, Smartphone, Gauge, Bell, Flame } from 'lucide-react';
import { evaluateAthleteAlerts } from '../utils/sportsScience';
import heroImage from '../assets/images/hero_athlete_training_1793984142408.jpg';
import labImage from '../assets/images/sports_science_lab_1793984142764.jpg';

interface AthleteOverviewProps {
  athletes: Athlete[];
  trainingSessions: TrainingSessionLog[];
  wellnessLogs: WellnessLog[];
  fitnessTests: FitnessTestRecord[];
  painPoints: BodyPainPoint[];
  onNavigateTab: (tab: string) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
  onOpenQuickLog: () => void;
}

export const AthleteOverview: React.FC<AthleteOverviewProps> = ({
  athletes,
  trainingSessions,
  wellnessLogs,
  fitnessTests,
  painPoints,
  onNavigateTab,
  onSelectAthleteDetail,
  onSelectAthleteForAI,
  onOpenQuickLog,
}) => {
  // Aggregate calculations
  const totalAthletes = athletes.length;
  const avgReadiness = Math.round(
    athletes.reduce((acc, curr) => acc + curr.readinessScore, 0) / (totalAthletes || 1)
  );
  const avgACWR = (
    athletes.reduce((acc, curr) => acc + curr.acwr, 0) / (totalAthletes || 1)
  ).toFixed(2);

  const athleteAlerts = evaluateAthleteAlerts(athletes, painPoints);
  const highRiskAthletes = athletes.filter((a) => a.acwr > 1.5 || a.status === 'Modifikasi');
  const elevatedLoadAthletes = athletes.filter((a) => a.acwr > 1.3 && a.acwr <= 1.5);
  const activePains = painPoints.filter((p) => p.status !== 'Pulih');

  return (
    <div className="space-y-6">
      
      {/* Hero Showcase Split: Sports Science Performance Hub */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          
          {/* Text and Actions (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 z-10">
            <div>
              <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
                Pusat Monitoring Biomotorik & Kebugaran Atlet
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white max-w-xl text-balance">
                Pemantauan Kondisi Fisik, Beban Latihan & Kesiapan Bertanding
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                Integrasi kalkulasi beban akut:kronis (ACWR), kuesioner kesiapan harian Hooper Index, baterai tes fisik terstandar, dan peta nyeri anatomi berbasis sports science.
              </p>
            </div>

            {/* Micro stats banner */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
              <div>
                <div className="text-[11px] text-slate-400">Rata-rata Kesiapan Tim</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {avgReadiness}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Rasio ACWR Rata-rata</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {avgACWR}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Atlet Terpantau</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {totalAthletes} <span className="text-xs font-normal text-slate-400">atlet</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenQuickLog}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Data Latihan / Tes</span>
              </button>
              <button
                onClick={() => onNavigateTab('jump_vbt')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Uji VJ/CMJ & VBT Sensor HP</span>
              </button>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <span>Dashboard & Grafik</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('acwr')}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
              >
                <span>Beban ACWR</span>
              </button>
            </div>
          </div>

          {/* Hero Photography (5 cols) */}
          <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full">
            <img
              src={heroImage}
              alt="Atlet berlatih di lintasan stadion"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
            <div className="absolute bottom-3 right-3 text-[11px] text-slate-300/80 bg-slate-950/60 px-2 py-1 rounded backdrop-blur-xs">
              Pusat Pelatihan Atlet Nasional
            </div>
          </div>

        </div>
      </div>

      {/* Early Warning Risk Alert Banner (ACWR < 0.8 / > 1.3 or Pain > 5 in last 24h) */}
      {athleteAlerts.length > 0 && (
        <div className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Sistem Peringatan Dini: {athleteAlerts.length} Atlet Memerlukan Intervensi
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-mono">
                    Perhatian
                  </span>
                </div>
                <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                  Terdeteksi atlet dengan rasio ACWR di luar rentang aman optimal (&lt; 0.8 atau &gt; 1.3) atau melaporkan keluhan nyeri tinggi (VAS &gt; 5) dalam 24 jam terakhir.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateTab('acwr')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 transition-colors cursor-pointer text-center"
              >
                Tinjau ACWR
              </button>
              <button
                onClick={() => onNavigateTab('injuries')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 transition-colors cursor-pointer text-center"
              >
                Peta Nyeri
              </button>
            </div>
          </div>

          {/* Alert Athlete Cards Carousel / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {athleteAlerts.map((al) => {
              const a = al.athlete;
              const isDanger = al.severity === 'critical';

              return (
                <div
                  key={a.id}
                  onClick={() => onSelectAthleteDetail(a)}
                  className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-rose-100 dark:border-rose-950 hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer flex flex-col justify-between space-y-2 group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {a.sport} · {a.position}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        isDanger
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {isDanger ? 'Kritis' : 'Waspada'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    {al.isAcwrAlert && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400">Status ACWR:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {a.acwr.toFixed(2)} ({a.acwr > 1.3 ? 'Tinggi' : 'Rendah'})
                        </span>
                      </div>
                    )}
                    {al.isPainAlert && (
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400">Nyeri Akut:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          VAS {al.maxPainLevel}/10 ({al.highPainPoints[0]?.location || 'Nyeri'})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Lihat Profil & Download PDF &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Feature Domain Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: ACWR Workload */}
        <div 
          onClick={() => onNavigateTab('acwr')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              BEBAN KERJA (ACWR)
            </span>
            <Activity className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {athletes.filter((a) => a.acwr >= 0.8 && a.acwr <= 1.3).length} / {totalAthletes} Atlet
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Berada di Sweet Spot optimal
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mencegah lonjakan beban mendadak dan mengukur kapasitas kebugaran jangka panjang.
          </p>
        </div>

        {/* Card 2: Hooper Index Wellness */}
        <div 
          onClick={() => onNavigateTab('wellness')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              WELLNESS & KESIAPAN
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {athletes.filter((a) => a.readinessScore >= 80).length} Atlet Siap
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Skor kesiapan &ge; 80% siap beban penuh
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Evaluasi kualitas tidur, nyeri otot (DOMS), denyut nadi istirahat, dan mood.
          </p>
        </div>

        {/* Card 3: Standard Physical Tests */}
        <div 
          onClick={() => onNavigateTab('fitness')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              BATERAI TES FISIK
            </span>
            <Zap className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {fitnessTests.length} Rekam Tes
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              VO2 Max, Sprint, Agility, Jump
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Pengukuran terstandar capaian fisik terhadap norma prestasi nasional.
          </p>
        </div>

        {/* Card 4: Injury & Pain Points */}
        <div 
          onClick={() => onNavigateTab('injuries')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-emerald-500/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              PETA NYERI ANATOMI
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activePains.length} Titik Terpantau
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Dalam observasi fisioterapi
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Peta tubuh interaktif depan & belakang dengan skala nyeri VAS 1-10.
          </p>
        </div>

      </div>

      {/* Biomechanics Spotlight: VJ/CMJ & VBT Phone Sensor & Camera */}
      <div 
        onClick={() => onNavigateTab('jump_vbt')}
        className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 rounded-xl border border-emerald-800/50 p-5 hover:border-emerald-500 transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Fitur Baru Biomekanika
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Sensor Akselerometer HP & Kamera
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
              Uji Vertical Jump (CMJ / SJ) & Velocity-Based Training (VBT)
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-slate-300/80 max-w-2xl leading-relaxed">
              Ukur waktu melayang (<span className="font-mono text-emerald-300">flight time</span>), tinggi lompatan rumus Bosco (<span className="font-mono text-emerald-300">h = 122.625 &times; t&sup2;</span> cm), daya puncak Sayers (Watt), serta kecepatan angkatan konsentris (<span className="font-mono text-emerald-300">m/s</span>) dengan alarm pemutus kelelahan (<span className="font-mono text-emerald-300">velocity loss</span>) langsung menggunakan perangkat ponsel.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Metode VJ</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">CMJ &bull; SJ &bull; DJ</div>
              <div className="text-[10px] text-emerald-400">Bosco & Sayers</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-center min-w-[100px]">
              <div className="text-[10px] uppercase font-semibold text-slate-400">VBT Tracker</div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">Mean Vel (m/s)</div>
              <div className="text-[10px] text-amber-400">Cut-off & 1RM Est</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('jump_vbt');
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Mulai Uji Sekarang</span>
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Section: Athletes Roster Spotlight & Recent Workload Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Athletes Readiness Status (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Status Kesiapan & Fisik Atlet Terkini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pembaruan kondisi harian berdasarkan beban dan kuesioner.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('roster')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Lihat Semua ({athletes.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {athletes.slice(0, 5).map((athlete) => {
              const isHigh = athlete.readinessScore >= 80;
              const isMod = athlete.readinessScore >= 65 && athlete.readinessScore < 80;

              return (
                <div
                  key={athlete.id}
                  onClick={() => onSelectAthleteDetail(athlete)}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                      {athlete.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {athlete.name}
                        </h4>
                        {athleteAlerts.some((al) => al.athlete.id === athlete.id) && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-mono">
                            Perhatian
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {athlete.sport} · {athlete.position}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-[10px] text-slate-400">ACWR</div>
                      <div className="font-mono font-bold text-xs tabular-nums text-slate-800 dark:text-slate-200">
                        {athlete.acwr.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400">Kesiapan</div>
                      <div className={`font-mono font-bold text-xs tabular-nums ${
                        isHigh ? 'text-emerald-600' : isMod ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {athlete.readinessScore}%
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <span className={`text-[11px] font-semibold ${
                        athlete.status === 'Fit'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : athlete.status === 'Observasi'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {athlete.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Laboratory & Recovery Spotlight (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Fisioterapi & Tes Lab Fisiologi
              </h3>
              <span className="text-xs text-slate-500">Sports Science</span>
            </div>

            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative mb-3">
              <img
                src={labImage}
                alt="Laboratorium sports science"
                className="w-full h-36 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-xs font-semibold text-white">
                  Pengujian VO2 Max & Kapasitas Biomekanik
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Pantau ambang laktat dan respon kardiovaskular secara teratur untuk menyusun intensitas zona latihan (Z1 - Z5) yang akurat bagi tiap atlet.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Evaluasi AI Gemini 3.8 Flash
            </span>
            <button
              onClick={() => onSelectAthleteForAI(athletes[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jalankan Rekomendasi Cerdas</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
