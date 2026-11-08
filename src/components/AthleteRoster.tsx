import React, { useState } from 'react';
import { Athlete } from '../types/athlete';
import { getACWRInfo, AthleteRiskAlert } from '../utils/sportsScience';
import { Search, Filter, Sparkles, Plus, Eye, UserPlus, ArrowUpDown, ShieldAlert, AlertTriangle } from 'lucide-react';

interface AthleteRosterProps {
  athletes: Athlete[];
  alerts?: AthleteRiskAlert[];
  onSelectAthleteDetail: (athlete: Athlete) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
  onOpenAddAthlete: () => void;
  onOpenLogSession: (athleteId: string) => void;
}

export const AthleteRoster: React.FC<AthleteRosterProps> = ({
  athletes,
  alerts = [],
  onSelectAthleteDetail,
  onSelectAthleteForAI,
  onOpenAddAthlete,
  onOpenLogSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const sports = Array.from(new Set(athletes.map((a) => a.sport)));

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch =
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSport = selectedSport === 'all' || athlete.sport === selectedSport;
    const matchesStatus =
      selectedStatus === 'all'
        ? true
        : selectedStatus === 'alert'
        ? alerts.some((al) => al.athlete.id === athlete.id)
        : athlete.status === selectedStatus;

    return matchesSearch && matchesSport && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Roster & Database Biometri Fisik Atlet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data antropometri, komposisi tubuh, beban akut/kronis, dan status kelayakan tanding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented table / cards view toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tabel Data
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Kartu Atlet
            </button>
          </div>

          <button
            onClick={onOpenAddAthlete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Atlet</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama atlet, cabor, atau posisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Sport Filter */}
        <div className="md:col-span-4">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Cabang Olahraga</option>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Status Fisik</option>
            <option value="alert">⚠️ Perlu Perhatian / Alert ({alerts.length})</option>
            <option value="Fit">Fit (Siap Tanding Penuh)</option>
            <option value="Observasi">Observasi (Pengawasan)</option>
            <option value="Modifikasi">Modifikasi (Beban Ringan)</option>
            <option value="Pemulihan">Pemulihan (Rehabilitasi)</option>
          </select>
        </div>

      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Atlet</th>
                  <th className="py-3 px-4">Cabor & Posisi</th>
                  <th className="py-3 px-4 text-center">Usia / Gender</th>
                  <th className="py-3 px-4 text-right">TB / BB</th>
                  <th className="py-3 px-4 text-right">Body Fat</th>
                  <th className="py-3 px-4 text-center">RHR</th>
                  <th className="py-3 px-4 text-center">ACWR</th>
                  <th className="py-3 px-4 text-center">Kesiapan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAthletes.map((athlete) => {
                  const bmi = (athlete.weight / ((athlete.height / 100) ** 2)).toFixed(1);
                  const isHighReadiness = athlete.readinessScore >= 80;
                  const isModReadiness = athlete.readinessScore >= 65 && athlete.readinessScore < 80;
                  const matchingAlert = alerts.find((al) => al.athlete.id === athlete.id);

                  return (
                    <tr
                      key={athlete.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectAthleteDetail(athlete)}
                          className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer text-left flex items-center gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                            {athlete.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{athlete.name}</span>
                              {matchingAlert && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-mono">
                                  Alert
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{athlete.sport}</div>
                        <div className="text-[11px] text-slate-400">{athlete.position}</div>
                      </td>

                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300 font-mono">
                        {athlete.age} th · {athlete.gender}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        <div>{athlete.height} cm / {athlete.weight} kg</div>
                        <div className="text-[11px] text-slate-400">BMI {bmi}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {athlete.bodyFat}%
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {athlete.restingHeartRate} <span className="text-[10px] text-slate-400">bpm</span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          athlete.acwr > 1.5
                            ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                            : athlete.acwr > 1.3
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                            : athlete.acwr < 0.8
                            ? 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40'
                            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        }`}>
                          {athlete.acwr.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold">
                        <span className={isHighReadiness ? 'text-emerald-600' : isModReadiness ? 'text-amber-600' : 'text-rose-600'}>
                          {athlete.readinessScore}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[11px] font-semibold ${
                          athlete.status === 'Fit'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : athlete.status === 'Observasi'
                            ? 'text-amber-700 dark:text-amber-400'
                            : athlete.status === 'Modifikasi'
                            ? 'text-orange-700 dark:text-orange-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {athlete.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectAthleteDetail(athlete)}
                            title="Lihat Profil Lengkap"
                            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectAthleteForAI(athlete)}
                            title="Analisis AI Sports Science"
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
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAthletes.map((athlete) => {
            const bmi = (athlete.weight / ((athlete.height / 100) ** 2)).toFixed(1);
            const matchingAlert = alerts.find((al) => al.athlete.id === athlete.id);

            return (
              <div
                key={athlete.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 space-y-3.5 transition-colors ${
                  matchingAlert
                    ? 'border-rose-300 dark:border-rose-900/80 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {matchingAlert && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-lg text-[10px] text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{matchingAlert.alertSummary[0]}</span>
                    </span>
                    <span className="font-mono font-bold uppercase">{matchingAlert.severity === 'critical' ? 'Kritis' : 'Waspada'}</span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {athlete.name}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {athlete.sport} · {athlete.position}
                    </div>
                  </div>

                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    athlete.status === 'Fit'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {athlete.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="text-slate-400 text-[10px]">TB / BB</div>
                    <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {athlete.height}cm / {athlete.weight}kg
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Body Fat</div>
                    <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {athlete.bodyFat}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">ACWR</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {athlete.acwr.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Kesiapan Latihan:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {athlete.readinessScore}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onSelectAthleteDetail(athlete)}
                    className="flex-1 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Profil Fisik
                  </button>
                  <button
                    onClick={() => onSelectAthleteForAI(athlete)}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analisis AI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
