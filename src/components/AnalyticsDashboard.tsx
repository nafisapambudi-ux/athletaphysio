import React, { useState } from 'react';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord, BodyPainPoint } from '../types/athlete';
import {
  generateWorkloadTimelineData,
  generateWellnessTrendData,
  getACWRInfo,
  WorkloadDayPoint,
} from '../utils/sportsScience';
import {
  TrendingUp,
  Activity,
  Zap,
  BarChart3,
  Calendar,
  AlertTriangle,
  Award,
  ChevronRight,
  Filter,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

interface AnalyticsDashboardProps {
  athletes: Athlete[];
  trainingSessions: TrainingSessionLog[];
  wellnessLogs: WellnessLog[];
  fitnessTests: FitnessTestRecord[];
  painPoints: BodyPainPoint[];
  onSelectAthleteDetail: (athlete: Athlete) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  athletes,
  trainingSessions,
  wellnessLogs,
  fitnessTests,
  painPoints,
  onSelectAthleteDetail,
  onSelectAthleteForAI,
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  // Default to 30 days as requested for longitudinal trends
  const [timeframeDays, setTimeframeDays] = useState<number>(30);
  const [benchmarkMetric, setBenchmarkMetric] = useState<'vo2' | 'sprint' | 'jump' | 'agility'>('vo2');

  // Chart layer toggles
  const [showSessionBars, setShowSessionBars] = useState<boolean>(true);
  const [showAcuteArea, setShowAcuteArea] = useState<boolean>(true);
  const [showChronicLine, setShowChronicLine] = useState<boolean>(true);
  const [showAcwrLine, setShowAcwrLine] = useState<boolean>(true);

  const sports = Array.from(new Set(athletes.map((a) => a.sport)));

  const filteredAthletes = athletes.filter((a) => {
    if (selectedSport !== 'all' && a.sport !== selectedSport) return false;
    return true;
  });

  const currentAthlete = athletes.find((a) => a.id === selectedAthleteId) || athletes[0];

  // 30-day longitudinal workload timeline data
  const workloadTimeline: WorkloadDayPoint[] = currentAthlete
    ? generateWorkloadTimelineData(currentAthlete, trainingSessions, timeframeDays)
    : [];

  // Team wellness 7-day trend
  const wellnessTrend = generateWellnessTrendData(wellnessLogs, 7);

  // Longitudinal 30-day KPI calculations
  const totalVolume30d = workloadTimeline.reduce((sum, d) => sum + d.sessionLoad, 0);
  const avgDailyLoad30d = Math.round(totalVolume30d / (workloadTimeline.length || 1));
  const currentAcuteVal = workloadTimeline[workloadTimeline.length - 1]?.acuteLoad || currentAthlete?.acuteLoad || 0;
  const currentChronicVal = workloadTimeline[workloadTimeline.length - 1]?.chronicLoad || currentAthlete?.chronicLoad || 0;
  const currentAcwrVal = workloadTimeline[workloadTimeline.length - 1]?.acwr || currentAthlete?.acwr || 1.0;
  const peakAcute30d = Math.max(...workloadTimeline.map((d) => d.acuteLoad), currentAcuteVal);
  const acuteChangePercent = currentChronicVal > 0 
    ? Math.round(((currentAcuteVal - currentChronicVal) / currentChronicVal) * 100)
    : 0;

  // Custom Recharts Tooltip for Sports Science
  const CustomWorkloadTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WorkloadDayPoint;
      const acwrInfo = getACWRInfo(data.acwr);

      return (
        <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3.5 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div className="font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{data.dayLabel}</span>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                data.acwr > 1.5
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : data.acwr >= 0.8 && data.acwr <= 1.3
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              ACWR {data.acwr.toFixed(2)}x
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                Beban Sesi (sRPE):
              </span>
              <span className="font-bold text-white tabular-nums">{data.sessionLoad} AU</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                Beban Akut (7d Fatigue):
              </span>
              <span className="font-bold text-blue-300 tabular-nums">{data.acuteLoad} AU</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block" />
                Beban Kronis (28d Fitness):
              </span>
              <span className="font-bold text-purple-300 tabular-nums">{data.chronicLoad} AU</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-[10px]">
              <span className="text-slate-400">Status Hari:</span>
              <span className={data.isRestDay ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                {data.isRestDay ? 'Rest / Pemulihan' : 'Latihan Aktif'}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-300/80 pt-1 border-t border-slate-700/60 font-sans leading-tight">
            {acwrInfo.actionRecommendation}
          </div>
        </div>
      );
    }
    return null;
  };

  // Benchmarks comparison data
  const getBenchmarkData = () => {
    switch (benchmarkMetric) {
      case 'vo2':
        return {
          title: 'Daya Tahan Kardiovaskular (VO2 Max)',
          unit: 'ml/kg/min',
          benchmark: 55.0,
          benchmarkLabel: 'Standar Nasional (55 ml/kg/min)',
          higherIsBetter: true,
          items: athletes
            .map((a) => {
              const test = fitnessTests.find(
                (t) => t.athleteId === a.id && t.category === 'Daya Tahan Kardiovaskular'
              );
              return {
                athlete: a,
                value: test ? test.value : 50 + a.acwr * 3,
                grade: test ? test.normGrade : 'Baik',
              };
            })
            .sort((a, b) => b.value - a.value),
        };
      case 'sprint':
        return {
          title: 'Kecepatan Lari (Sprint 30 Meter)',
          unit: 'detik',
          benchmark: 4.1,
          benchmarkLabel: 'Standar Nasional (4.10 detik)',
          higherIsBetter: false,
          items: athletes
            .map((a) => {
              const test = fitnessTests.find((t) => t.athleteId === a.id && t.category === 'Kecepatan');
              return {
                athlete: a,
                value: test
                  ? test.value
                  : +(4.15 - ((a.id.charCodeAt(a.id.length - 1) % 4) * 0.06)).toFixed(2),
                grade: test ? test.normGrade : 'Baik',
              };
            })
            .sort((a, b) => a.value - b.value),
        };
      case 'jump':
        return {
          title: 'Daya Ledak Tungkai (Vertical Jump)',
          unit: 'cm',
          benchmark: 65.0,
          benchmarkLabel: 'Standar Nasional (65 cm)',
          higherIsBetter: true,
          items: athletes
            .map((a) => {
              const test = fitnessTests.find((t) => t.athleteId === a.id && t.category === 'Daya Ledak');
              return {
                athlete: a,
                value: test ? test.value : 62,
                grade: test ? test.normGrade : 'Baik',
              };
            })
            .sort((a, b) => b.value - a.value),
        };
      case 'agility':
        return {
          title: 'Kelincahan & Akselerasi (Illinois Agility)',
          unit: 'detik',
          benchmark: 15.8,
          benchmarkLabel: 'Standar Nasional (15.8 detik)',
          higherIsBetter: false,
          items: athletes
            .map((a) => {
              const test = fitnessTests.find((t) => t.athleteId === a.id && t.category === 'Kelincahan');
              return {
                athlete: a,
                value: test ? test.value : 16.0,
                grade: test ? test.normGrade : 'Baik',
              };
            })
            .sort((a, b) => a.value - b.value),
        };
    }
  };

  const benchmarkData = getBenchmarkData();

  // Training Session Volume by Category
  const sessionTypesSummary = [
    { type: 'Kondisi Kardio & Aerobik', color: 'bg-emerald-500', count: 4, hours: 4.5 },
    { type: 'Kekuatan & Beban', color: 'bg-blue-500', count: 3, hours: 3.5 },
    { type: 'Kelincahan & Taktik', color: 'bg-amber-500', count: 3, hours: 4.0 },
    { type: 'Kecepatan & Akselerasi', color: 'bg-indigo-500', count: 2, hours: 2.5 },
    { type: 'Pemulihan Aktif', color: 'bg-teal-500', count: 1, hours: 1.0 },
  ];
  const totalVolumeHours = sessionTypesSummary.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Dashboard Analisis & Grafik Tren Longitudinal</span>
            <span className="text-[10px] font-semibold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
              Recharts Engine
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi analitik beban kerja progresif (Akut vs Kronis 30 Hari), rasio ACWR Tim Gabbett, matriks kuadran kebugaran, dan tolok ukur biomotorik.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sport Filter */}
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Cabang Olahraga</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Timeframe Selector with 30-Day Highlight */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {[7, 14, 30, 60].map((days) => (
              <button
                key={days}
                onClick={() => setTimeframeDays(days)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  timeframeDays === days
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {days} Hari{days === 30 ? ' (30d)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Chart: Integrated Recharts Longitudinal Workload & ACWR (Last 30 Days) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tren Longitudinal Beban Akut & Kronis: {currentAthlete.name} ({timeframeDays} Hari Terakhir)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Membandingkan beban sesi harian (sRPE), akumulasi beban akut (7d), fondasi kronis (28d), dan kurva rasio ACWR.
            </p>
          </div>

          {/* Athlete Selector Dropdown */}
          <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
            <span className="shrink-0 text-xs text-slate-500 font-medium">Pilih Atlet:</span>
            <select
              value={selectedAthleteId}
              onChange={(e) => setSelectedAthleteId(e.target.value)}
              className="w-full min-w-0 max-w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none sm:w-auto"
            >
              {filteredAthletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.sport} - {a.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 30-Day Longitudinal Metrics Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Total Volume {timeframeDays} Hari
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {totalVolume30d.toLocaleString()} <span className="text-xs font-normal text-slate-500">AU</span>
            </div>
            <span className="text-[10px] text-slate-500">Rata-rata: {avgDailyLoad30d} AU/hari</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
              Beban Akut (7-Hari)
            </span>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {currentAcuteVal.toLocaleString()} <span className="text-xs font-normal text-slate-500">AU</span>
            </div>
            <span className="text-[10px] text-slate-500">Puncak: {peakAcute30d.toLocaleString()} AU</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
              Beban Kronis (28-Hari)
            </span>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              {currentChronicVal.toLocaleString()} <span className="text-xs font-normal text-slate-500">AU</span>
            </div>
            <span className="text-[10px] text-slate-500">Fondasi Kapasitas Atlet</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
              Rasio ACWR Terkini
            </span>
            <div
              className={`text-lg font-bold font-mono mt-0.5 ${
                currentAcwrVal > 1.5
                  ? 'text-rose-600 dark:text-rose-400'
                  : currentAcwrVal >= 0.8 && currentAcwrVal <= 1.3
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {currentAcwrVal.toFixed(2)}x
            </div>
            <span className="text-[10px] text-slate-500">
              {currentAcwrVal >= 0.8 && currentAcwrVal <= 1.3
                ? 'Zona Optimal (Sweet Spot)'
                : currentAcwrVal > 1.5
                ? 'Zona Bahaya Cedera'
                : 'Perhatian Beban'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Delta Akut vs Kronis
            </span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
              <span>{acuteChangePercent > 0 ? `+${acuteChangePercent}%` : `${acuteChangePercent}%`}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              {acuteChangePercent > 30 ? 'Lonjakan Akut Tinggi' : 'Progresi Terkendali'}
            </span>
          </div>
        </div>

        {/* Metric Toggles & Interactive Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowSessionBars(!showSessionBars)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showSessionBars
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              <span>Beban Sesi (sRPE)</span>
            </button>

            <button
              onClick={() => setShowAcuteArea(!showAcuteArea)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showAcuteArea
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
              <span>Beban Akut (7-Hari)</span>
            </button>

            <button
              onClick={() => setShowChronicLine(!showChronicLine)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showChronicLine
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
              }`}
            >
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-purple-500 inline-block" />
              <span>Beban Kronis (28-Hari)</span>
            </button>

            <button
              onClick={() => setShowAcwrLine(!showAcwrLine)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                showAcwrLine
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Rasio ACWR</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500/30 border border-emerald-500 inline-block" /> Sweet Spot (0.8 - 1.3)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-rose-500/30 border border-rose-500 inline-block" /> Bahaya (&gt; 1.5)
            </span>
          </div>
        </div>

        {/* Recharts Responsive ComposedChart Viewport */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={workloadTimeline}
              margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="acuteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.5} />
                </linearGradient>
              </defs>

              {/* Sweet spot area (ACWR 0.8 - 1.3) */}
              <ReferenceArea
                yAxisId="acwr"
                y1={0.8}
                y2={1.3}
                fill="#10b981"
                fillOpacity={0.08}
              />

              {/* Danger area (ACWR > 1.5) */}
              <ReferenceArea
                yAxisId="acwr"
                y1={1.5}
                y2={2.2}
                fill="#ef4444"
                fillOpacity={0.06}
              />

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                strokeOpacity={0.2}
              />

              {/* X-Axis: 30-Day progression */}
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                dy={6}
                interval={timeframeDays >= 30 ? (timeframeDays >= 60 ? 4 : 2) : 0}
              />

              {/* Left Y-Axis: Workload in Arbitrary Units (AU) */}
              <YAxis
                yAxisId="load"
                orientation="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                domain={[0, 'auto']}
                tickFormatter={(val) => `${val}`}
              />

              {/* Right Y-Axis: ACWR Ratio */}
              <YAxis
                yAxisId="acwr"
                orientation="right"
                domain={[0, 2.2]}
                ticks={[0.5, 0.8, 1.0, 1.3, 1.5, 2.0]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                tickFormatter={(val) => `${val.toFixed(1)}x`}
              />

              {/* Reference Lines */}
              <ReferenceLine
                yAxisId="acwr"
                y={1.5}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Bahaya Cedera (1.5x)',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                yAxisId="acwr"
                y={1.3}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <ReferenceLine
                yAxisId="acwr"
                y={0.8}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              <Tooltip content={<CustomWorkloadTooltip />} />

              {/* Daily Session Load (sRPE) Bars */}
              {showSessionBars && (
                <Bar
                  yAxisId="load"
                  dataKey="sessionLoad"
                  name="Beban Sesi (sRPE)"
                  fill="url(#sessionGradient)"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={timeframeDays > 30 ? 12 : 20}
                />
              )}

              {/* Acute Workload (7-Day Fatigue) Area */}
              {showAcuteArea && (
                <Area
                  yAxisId="load"
                  type="monotone"
                  dataKey="acuteLoad"
                  name="Beban Akut (7 Hari)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#acuteGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {/* Chronic Workload (28-Day Fitness) Line */}
              {showChronicLine && (
                <Line
                  yAxisId="load"
                  type="monotone"
                  dataKey="chronicLoad"
                  name="Beban Kronis (28 Hari)"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {/* ACWR Ratio Line */}
              {showAcwrLine && (
                <Line
                  yAxisId="acwr"
                  type="monotone"
                  dataKey="acwr"
                  name="Kurva Rasio ACWR"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#059669', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Action helper bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Atlet Terpilih:{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentAthlete.name} ({currentAthlete.sport} - {currentAthlete.position})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAthleteDetail(currentAthlete)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span>Profil Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectAthleteForAI(currentAthlete)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis AI {currentAthlete.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2-Column Split (Quadrant Matrix + Daily Hooper Wellness Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Matriks Kuadran Risiko Cedera ACWR vs Kapasitas Kronis (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Matriks Kuadran Risiko Cedera (ACWR vs Chronic Workload)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hubungan antara fondasi kebugaran kronis (Fitness) dan rasio kelelahan akut (Fatigue).
            </p>
          </div>

          {/* Interactive 4-Quadrant Canvas */}
          <div className="relative w-full h-72 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
            {/* 4 Quadrants Background Shading */}
            <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 gap-1 pointer-events-none">
              {/* Top-Left: Low Fitness + High ACWR (Danger Spike) */}
              <div className="bg-rose-500/10 rounded p-2 flex flex-col justify-start">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400">
                  KUADRAN II: ZONA BAHAYA EKSTREM
                </span>
                <span className="text-[9px] text-slate-400">Fondasi Rendah + Beban Melonjak</span>
              </div>

              {/* Top-Right: High Fitness + High ACWR (Elevated) */}
              <div className="bg-amber-500/10 rounded p-2 flex flex-col justify-start items-end text-right">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  KUADRAN I: BEBAN TINGGI TERPANTAU
                </span>
                <span className="text-[9px] text-slate-400">Fondasi Tinggi + Perlu Pengawasan</span>
              </div>

              {/* Bottom-Left: Low Fitness + Low ACWR (Deconditioned) */}
              <div className="bg-sky-500/10 rounded p-2 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400">
                  KUADRAN III: UNDER-TRAINING
                </span>
                <span className="text-[9px] text-slate-400">Kapasitas Berkurang / Dekondisi</span>
              </div>

              {/* Bottom-Right: High Fitness + Optimal ACWR (Sweet Spot / Peak) */}
              <div className="bg-emerald-500/15 rounded p-2 flex flex-col justify-end items-end text-right border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  KUADRAN IV: ZONA JUARA (OPTIMAL)
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Fondasi Tinggi + Tahan Cedera</span>
              </div>
            </div>

            {/* Scatter Plot of Athletes */}
            <div className="relative w-full h-full z-10">
              {athletes.map((athlete) => {
                const minChronic = 1600;
                const maxChronic = 2900;
                const minRatio = 0.6;
                const maxRatio = 1.8;

                const leftPct = Math.max(
                  8,
                  Math.min(92, ((athlete.chronicLoad - minChronic) / (maxChronic - minChronic)) * 100)
                );
                const bottomPct = Math.max(
                  8,
                  Math.min(92, ((athlete.acwr - minRatio) / (maxRatio - minRatio)) * 100)
                );

                const isDanger = athlete.acwr > 1.5;
                const isWarning = athlete.acwr > 1.3 && athlete.acwr <= 1.5;

                return (
                  <button
                    key={athlete.id}
                    onClick={() => {
                      setSelectedAthleteId(athlete.id);
                      onSelectAthleteDetail(athlete);
                    }}
                    title={`${athlete.name}: ACWR ${athlete.acwr.toFixed(2)}, Kronis ${athlete.chronicLoad} AU`}
                    style={{ left: `${leftPct}%`, bottom: `${bottomPct}%` }}
                    className="absolute -translate-x-1/2 translate-y-1/2 group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white shadow-md transition-transform group-hover:scale-125 ${
                        isDanger
                          ? 'bg-rose-600 ring-2 ring-rose-300'
                          : isWarning
                          ? 'bg-amber-500 ring-2 ring-amber-300'
                          : 'bg-emerald-600 ring-2 ring-emerald-300'
                      }`}
                    >
                      {athlete.name.charAt(0)}
                    </div>
                    {/* Tooltip badge on hover */}
                    <div className="hidden group-hover:block absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-30 shadow-lg">
                      {athlete.name} ({athlete.sport}): {athlete.acwr.toFixed(2)}x
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Axes Labels */}
            <div className="w-full flex justify-between text-[10px] text-slate-400 font-mono pt-1 z-10 border-t border-slate-200 dark:border-slate-800">
              <span>← Beban Kronis Rendah (1600 AU)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Kapasitas Kebugaran Fondasi Kronis 28-Hari (AU)
              </span>
              <span>Beban Kronis Tinggi (2900 AU) →</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Prinsip Fisiologis:</span> Atlet di
            Kuadran IV (Fondasi Kronis Tinggi + ACWR Optimal) memiliki ketahanan cedera hingga 50% lebih baik dibanding
            atlet dengan fondasi rendah yang mendadak diberi lonjakan beban tinggi.
          </div>
        </div>

        {/* Right: Hooper Index Daily Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Tren Kesiapan Tim 7 Hari Terakhir
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Rata-rata Skuad</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dinamika skor kesiapan harian dan denyut nadi istirahat (RHR).
            </p>

            {/* Daily Bars */}
            <div className="space-y-2.5 pt-4">
              {wellnessTrend.map((day) => {
                const isGood = day.avgReadiness >= 80;
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{day.dayLabel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">RHR: {day.avgHR} bpm</span>
                        <span className={`font-bold tabular-nums ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {day.avgReadiness}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar with multi-factor breakdown */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${day.avgReadiness}%` }}
                        className={`h-full transition-all rounded-full ${
                          isGood ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Penurunan skor kesiapan &gt; 15% dalam 48 jam mengindikasikan perlunya evaluasi regenerasi otot dan kualitas
            tidur.
          </div>
        </div>
      </div>

      {/* Benchmark Comparisons Grid & Volume Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Biomotor Benchmark Ranking (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Peringkat Capaian Tes Fisik vs Standar Nasional
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan performa terhadap standar acuan KONI & Sports Science.
              </p>
            </div>

            {/* Benchmark Component Toggles */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setBenchmarkMetric('vo2')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  benchmarkMetric === 'vo2'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                VO2 Max
              </button>
              <button
                onClick={() => setBenchmarkMetric('sprint')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  benchmarkMetric === 'sprint'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sprint 30m
              </button>
              <button
                onClick={() => setBenchmarkMetric('jump')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  benchmarkMetric === 'jump'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Vert. Jump
              </button>
              <button
                onClick={() => setBenchmarkMetric('agility')}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                  benchmarkMetric === 'agility'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Agility
              </button>
            </div>
          </div>

          {/* Benchmark Line Legend */}
          <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{benchmarkData.title}</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              {benchmarkData.benchmarkLabel}
            </span>
          </div>

          {/* Ranking Bars */}
          <div className="space-y-3">
            {benchmarkData.items.map((item, idx) => {
              const isOverBenchmark = benchmarkData.higherIsBetter
                ? item.value >= benchmarkData.benchmark
                : item.value <= benchmarkData.benchmark;

              const maxDisplay = benchmarkMetric === 'vo2' ? 70 : benchmarkMetric === 'jump' ? 85 : 5.0;
              const barPercent = Math.min(100, (item.value / maxDisplay) * 100);

              return (
                <div key={item.athlete.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                      <button
                        onClick={() => {
                          setSelectedAthleteId(item.athlete.id);
                          onSelectAthleteDetail(item.athlete);
                        }}
                        className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 cursor-pointer text-left"
                      >
                        {item.athlete.name}
                      </button>
                      <span className="text-[11px] text-slate-400">({item.athlete.sport})</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {item.value} {benchmarkData.unit}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          isOverBenchmark
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.grade}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${barPercent}%` }}
                      className={`h-full rounded-full transition-all ${
                        isOverBenchmark ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Volume Distribution by Session Category (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Distribusi Volume Latihan Tim Mingguan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alokasi total {totalVolumeHours} jam porsi latihan berdasarkan kategori biomotorik.
            </p>
          </div>

          {/* Segmented Volume Stack Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex shadow-inner">
              {sessionTypesSummary.map((s, idx) => {
                const widthPct = (s.hours / totalVolumeHours) * 100;
                return (
                  <div
                    key={idx}
                    style={{ width: `${widthPct}%` }}
                    className={`${s.color} h-full transition-all`}
                    title={`${s.type}: ${s.hours} jam (${widthPct.toFixed(0)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Category Rows Breakdown */}
          <div className="space-y-2.5 pt-2">
            {sessionTypesSummary.map((s, idx) => {
              const widthPct = ((s.hours / totalVolumeHours) * 100).toFixed(0);
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{s.type}</span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white">{s.hours} jam</span> ({widthPct}%)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Rekomendasi Sports Science: Jaga rasio latihan pemulihan aktif (active recovery) minimal 15-20% dari total
            volume untuk menjaga elastisitas miofasial.
          </div>
        </div>
      </div>
    </div>
  );
};
