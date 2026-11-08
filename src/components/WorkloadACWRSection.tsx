import React, { useState } from 'react';
import { Athlete, TrainingSessionLog } from '../types/athlete';
import { getACWRInfo } from '../utils/sportsScience';
import { AlertCircle, CheckCircle, ShieldAlert, Sparkles, Filter, TrendingUp } from 'lucide-react';

interface WorkloadACWRSectionProps {
  athletes: Athlete[];
  trainingSessions: TrainingSessionLog[];
  onOpenLogSession: (athleteId?: string) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
}

export const WorkloadACWRSection: React.FC<WorkloadACWRSectionProps> = ({
  athletes,
  trainingSessions,
  onOpenLogSession,
  onSelectAthleteForAI,
  onSelectAthleteDetail,
}) => {
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const sports = Array.from(new Set(athletes.map((a) => a.sport)));

  const filteredAthletes = athletes.filter((a) => {
    if (sportFilter !== 'all' && a.sport !== sportFilter) return false;
    if (zoneFilter === 'sweet' && (a.acwr < 0.8 || a.acwr > 1.3)) return false;
    if (zoneFilter === 'warning' && (a.acwr <= 1.3 || a.acwr > 1.5)) return false;
    if (zoneFilter === 'danger' && a.acwr <= 1.5) return false;
    if (zoneFilter === 'under' && a.acwr >= 0.8) return false;
    return true;
  });

  // Calculate team distribution
  const sweetSpotCount = athletes.filter((a) => a.acwr >= 0.8 && a.acwr <= 1.3).length;
  const warningCount = athletes.filter((a) => a.acwr > 1.3 && a.acwr <= 1.5).length;
  const dangerCount = athletes.filter((a) => a.acwr > 1.5).length;
  const underCount = athletes.filter((a) => a.acwr < 0.8).length;

  return (
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Monitoring Beban Latihan & ACWR (Acute:Chronic Workload Ratio)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Metodologi Sports Science (Dr. Tim Gabbett) untuk mengoptimalkan kebugaran sekaligus memitigasi risiko cedera non-kontak.
          </p>
        </div>

        <button
          onClick={() => onOpenLogSession()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
        >
          <span>+ Catat Sesi Latihan (sRPE)</span>
        </button>
      </div>

      {/* 4 Summary Distribution KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sweet Spot */}
        <div 
          onClick={() => setZoneFilter(zoneFilter === 'sweet' ? 'all' : 'sweet')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            zoneFilter === 'sweet'
              ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Zona Optimal (Sweet Spot)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {sweetSpotCount}
            </span>
            <span className="text-xs text-slate-500">atlet</span>
          </div>
          <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            ACWR 0.80 – 1.30 (Risiko Sangat Rendah)
          </div>
        </div>

        {/* Elevated Load */}
        <div 
          onClick={() => setZoneFilter(zoneFilter === 'warning' ? 'all' : 'warning')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            zoneFilter === 'warning'
              ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Waspada Lonjakan Beban</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {warningCount}
            </span>
            <span className="text-xs text-slate-500">atlet</span>
          </div>
          <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            ACWR 1.31 – 1.50 (Risiko Sedang)
          </div>
        </div>

        {/* Danger Zone */}
        <div 
          onClick={() => setZoneFilter(zoneFilter === 'danger' ? 'all' : 'danger')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            zoneFilter === 'danger'
              ? 'border-rose-600 bg-rose-50/80 dark:bg-rose-950/40 ring-1 ring-rose-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Zona Bahaya (Danger Zone)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {dangerCount}
            </span>
            <span className="text-xs text-slate-500">atlet</span>
          </div>
          <div className="mt-1 text-xs text-rose-700 dark:text-rose-400">
            ACWR &gt; 1.50 (Risiko Tinggi Overuse)
          </div>
        </div>

        {/* Under Training */}
        <div 
          onClick={() => setZoneFilter(zoneFilter === 'under' ? 'all' : 'under')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            zoneFilter === 'under'
              ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/40 ring-1 ring-sky-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Kurang Stimulasi (Under-training)</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {underCount}
            </span>
            <span className="text-xs text-slate-500">atlet</span>
          </div>
          <div className="mt-1 text-xs text-sky-700 dark:text-sky-400">
            ACWR &lt; 0.80 (Fondasi Berkurang)
          </div>
        </div>

      </div>

      {/* Visual ACWR Distribution Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Grafik Spektrum Rasio Beban (ACWR) Skuad Atlet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Posisi rasio beban akut dibanding kronis tiap atlet relatif terhadap zona aman (Sweet Spot: 0.80 - 1.30).
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Skala: 0.5x — 2.0x
          </span>
        </div>

        {/* Horizontal Stack of Athletes */}
        <div className="space-y-3 pt-2">
          {athletes.map((athlete) => {
            const minScale = 0.5;
            const maxScale = 2.0;
            const markerPos = Math.max(2, Math.min(98, ((athlete.acwr - minScale) / (maxScale - minScale)) * 100));
            const isDanger = athlete.acwr > 1.5;
            const isWarning = athlete.acwr > 1.3 && athlete.acwr <= 1.5;
            const isOptimal = athlete.acwr >= 0.8 && athlete.acwr <= 1.3;

            return (
              <div key={athlete.id} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectAthleteDetail(athlete)}
                      className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer"
                    >
                      {athlete.name}
                    </button>
                    <span className="text-[11px] text-slate-400">({athlete.sport})</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[11px] text-slate-400">
                      Akut: {athlete.acuteLoad} AU / Kronis: {athlete.chronicLoad} AU
                    </span>
                    <span className={`font-bold tabular-nums px-2 py-0.5 rounded text-xs ${
                      isDanger
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : isOptimal
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                    }`}>
                      {athlete.acwr.toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* Track with zones and athlete indicator */}
                <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-sky-200/40 dark:bg-sky-900/30" />
                  <div className="absolute left-[20%] top-0 bottom-0 w-[33.3%] bg-emerald-300/40 dark:bg-emerald-800/40" />
                  <div className="absolute left-[53.3%] top-0 bottom-0 w-[13.3%] bg-amber-300/40 dark:bg-amber-800/40" />
                  <div className="absolute left-[66.6%] top-0 bottom-0 w-[33.4%] bg-rose-300/40 dark:bg-rose-800/40" />

                  <div
                    style={{ left: `${markerPos}%` }}
                    className={`absolute top-0 bottom-0 w-2 -translate-x-1/2 rounded-full shadow-xs ${
                      isDanger
                        ? 'bg-rose-600'
                        : isWarning
                        ? 'bg-amber-500'
                        : isOptimal
                        ? 'bg-emerald-600'
                        : 'bg-sky-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Cabor:</span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSportFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                sportFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua Cabor
            </button>
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSportFilter(sport)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  sportFilter === sport
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {zoneFilter !== 'all' && (
          <button
            onClick={() => setZoneFilter('all')}
            className="text-xs text-emerald-600 hover:underline cursor-pointer"
          >
            Reset Filter Zona ({zoneFilter})
          </button>
        )}
      </div>

      {/* High-Density Workload Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Nama Atlet</th>
                <th className="py-3 px-4">Cabor & Posisi</th>
                <th className="py-3 px-4 text-right">Beban Akut (7 Hari)</th>
                <th className="py-3 px-4 text-right">Beban Kronis (28 Hari)</th>
                <th className="py-3 px-4 text-center">Rasio ACWR</th>
                <th className="py-3 px-4">Klasifikasi & Rekomendasi Beban</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAthletes.map((athlete) => {
                const info = getACWRInfo(athlete.acwr);
                const isDanger = athlete.acwr > 1.5;
                const isWarning = athlete.acwr > 1.3 && athlete.acwr <= 1.5;

                return (
                  <tr 
                    key={athlete.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectAthleteDetail(athlete)}
                        className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer text-left"
                      >
                        {athlete.name}
                      </button>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {athlete.id}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{athlete.sport}</div>
                      <div className="text-[11px] text-slate-400">{athlete.position}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                      {athlete.acuteLoad.toLocaleString()} <span className="text-[10px] text-slate-400">AU</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                      {athlete.chronicLoad.toLocaleString()} <span className="text-[10px] text-slate-400">AU</span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block font-mono font-bold text-sm tabular-nums px-2.5 py-1 rounded-md ${
                        isDanger 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' 
                          : isWarning 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                          : athlete.acwr < 0.8
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {athlete.acwr.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className={`font-semibold ${info.badgeStyle}`}>
                        {info.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate">
                        {info.actionRecommendation}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenLogSession(athlete.id)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        >
                          + Log Sesi
                        </button>
                        <button
                          onClick={() => onSelectAthleteForAI(athlete)}
                          title="Analisis Beban Olahraga dengan Gemini"
                          className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scientific Reference Box */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-white">
          Panduan Interpretasi Rasio Beban Akut:Kronis (ACWR):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Session-RPE (sRPE):</span> Dihitung dengan rumus <code className="font-mono font-semibold">Skala RPE (1-10) × Durasi Sesi (Menit)</code>. Menghasilkan Arbitrary Units (AU) yang mencerminkan beban internal atlet.
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Lonjakan Beban (Spike):</span> Jika ACWR &gt; 1.5, risiko cedera jaringan lunak meningkat 2–4 kali lipat karena kelelahan akut melampaui toleransi beban fondasi kronis 28 hari.
          </div>
        </div>
      </div>

    </div>
  );
};
