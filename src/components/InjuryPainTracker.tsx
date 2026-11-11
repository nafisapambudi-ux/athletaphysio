import React, { useState } from 'react';
import { Athlete, BodyPainPoint } from '../types/athlete';
import { AlertTriangle, Plus, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface InjuryPainTrackerProps {
  athletes: Athlete[];
  painPoints: BodyPainPoint[];
  onAddPainPoint: (pain: Omit<BodyPainPoint, 'id'>) => void;
  onUpdatePainStatus: (id: string, status: BodyPainPoint['status']) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
}

export const InjuryPainTracker: React.FC<InjuryPainTrackerProps> = ({
  athletes,
  painPoints,
  onAddPainPoint,
  onUpdatePainStatus,
  onSelectAthleteForAI,
}) => {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'anterior' | 'posterior'>('anterior');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formAthleteId, setFormAthleteId] = useState<string>(athletes[0]?.id || '');
  const [formLocation, setFormLocation] = useState<string>('Lutut Kanan');
  const [formPainLevel, setFormPainLevel] = useState<number>(5);
  const [formStatus, setFormStatus] = useState<BodyPainPoint['status']>('Akut');
  const [formNotes, setFormNotes] = useState<string>('');

  const filteredPainPoints = painPoints.filter((p) => {
    if (selectedAthleteId !== 'all' && p.athleteId !== selectedAthleteId) return false;
    return true;
  });

  const handleZoneClick = (zoneName: string, view: 'anterior' | 'posterior') => {
    setSelectedZone(zoneName);
    setFormLocation(zoneName);
    setCurrentView(view);
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAthleteId) return;

    onAddPainPoint({
      athleteId: formAthleteId,
      location: formLocation,
      view: currentView,
      painLevel: formPainLevel,
      status: formStatus,
      reportedDate: new Date().toISOString().slice(0, 10),
      notes: formNotes || 'Dicatat melalui peta anatomi tubuh atlet.',
    });

    setShowAddForm(false);
    setFormNotes('');
  };

  const getAthleteName = (id: string) => {
    const a = athletes.find((item) => item.id === id);
    return a ? `${a.name} (${a.sport})` : 'Atlet';
  };

  const getAthleteObj = (id: string) => athletes.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Peta Nyeri Anatomi & Monitoring Cedera
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual Analogue Scale (VAS 1-10) untuk melacak keluhan muskuloskeletal dan kesiapan biomekanik atlet.
          </p>
        </div>

        {/* Functional segmented controls */}
        <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
            <button
              onClick={() => setCurrentView('anterior')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'anterior'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampak Depan (Anterior)
            </button>
            <button
              onClick={() => setCurrentView('posterior')}
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'posterior'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampak Belakang (Posterior)
            </button>
          </div>

          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="w-full min-w-0 max-w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-auto"
          >
            <option value="all">Semua Atlet ({athletes.length})</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} - {a.sport}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Body Map + Injury Logs & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Anatomical Interactive Silhouette (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              {currentView === 'anterior' ? 'ANATOMI DEPAN (ANTERIOR)' : 'ANATOMI BELAKANG (POSTERIOR)'}
            </span>
            <span className="text-xs text-slate-400">
              Klik area tubuh untuk mencatat nyeri
            </span>
          </div>

          {/* SVG Silhouette with interactive target areas */}
          <div className="relative w-72 h-[480px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800/80 p-4 flex items-center justify-center">
            
            <svg
              viewBox="0 0 200 400"
              className="w-full h-full select-none text-slate-300 dark:text-slate-700"
            >
              {/* Silhouette Human Body Outline */}
              <g fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.5">
                {/* Head */}
                <circle cx="100" cy="30" r="20" />
                {/* Neck */}
                <path d="M94 49 L94 60 L106 60 L106 49 Z" />
                {/* Torso */}
                <path d="M72 65 C60 75 55 95 56 125 L58 175 L74 185 L126 185 L142 175 L144 125 C145 95 140 75 128 65 Z" />
                {/* Left Arm */}
                <path d="M55 75 L38 120 L30 180 L22 178 L32 120 L48 70 Z" />
                {/* Right Arm */}
                <path d="M145 75 L162 120 L170 180 L178 178 L168 120 L152 70 Z" />
                {/* Left Leg */}
                <path d="M74 185 L68 250 L72 320 L68 375 L82 375 L86 320 L92 250 L96 185 Z" />
                {/* Right Leg */}
                <path d="M126 185 L132 250 L128 320 L132 375 L118 375 L114 320 L108 250 L104 185 Z" />
              </g>

              {/* Interactive Anatomical Zones based on View */}
              {currentView === 'anterior' ? (
                <>
                  {/* Bahu Kanan (Left on screen) */}
                  <circle
                    cx="60" cy="78" r="11"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Bahu Kanan', 'anterior')}
                  />
                  {/* Bahu Kiri (Right on screen) */}
                  <circle
                    cx="140" cy="78" r="11"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Bahu Kiri', 'anterior')}
                  />
                  {/* Dada */}
                  <rect
                    x="75" y="80" width="50" height="30" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Dada & Tulang Rusuk', 'anterior')}
                  />
                  {/* Selangkangan & Pinggul */}
                  <rect
                    x="80" y="170" width="40" height="24" rx="4"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Selangkangan (Groin)', 'anterior')}
                  />
                  {/* Paha Depan Kanan */}
                  <rect
                    x="68" y="200" width="24" height="48" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Paha Depan Kanan (Quadriceps)', 'anterior')}
                  />
                  {/* Paha Depan Kiri */}
                  <rect
                    x="108" y="200" width="24" height="48" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Paha Depan Kiri (Quadriceps)', 'anterior')}
                  />
                  {/* Lutut Kanan */}
                  <circle
                    cx="80" cy="265" r="10"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Lutut Kanan (Patella)', 'anterior')}
                  />
                  {/* Lutut Kiri */}
                  <circle
                    cx="120" cy="265" r="10"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Lutut Kiri (Patella)', 'anterior')}
                  />
                  {/* Tulang Kering & Ankle Kanan */}
                  <circle
                    cx="76" cy="350" r="9"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Pergelangan Kaki Kanan (Ankle)', 'anterior')}
                  />
                  {/* Tulang Kering & Ankle Kiri */}
                  <circle
                    cx="124" cy="350" r="9"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Pergelangan Kaki Kiri (Ankle)', 'anterior')}
                  />
                </>
              ) : (
                <>
                  {/* Leher Belakang */}
                  <rect
                    x="92" y="52" width="16" height="15" rx="3"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Tengkuk & Leher Belakang', 'posterior')}
                  />
                  {/* Punggung Atas & Belikat */}
                  <rect
                    x="75" y="75" width="50" height="35" rx="5"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Punggung Atas (Thoracic)', 'posterior')}
                  />
                  {/* Punggung Bawah (Lumbar) */}
                  <rect
                    x="78" y="125" width="44" height="35" rx="5"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Punggung Bawah (Lumbar)', 'posterior')}
                  />
                  {/* Hamstring Kanan */}
                  <rect
                    x="68" y="200" width="24" height="48" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Paha Belakang Kanan (Hamstring)', 'posterior')}
                  />
                  {/* Hamstring Kiri */}
                  <rect
                    x="108" y="200" width="24" height="48" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Paha Belakang Kiri (Hamstring)', 'posterior')}
                  />
                  {/* Betis Kanan */}
                  <rect
                    x="68" y="285" width="20" height="45" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Betis Kanan (Gastrocnemius)', 'posterior')}
                  />
                  {/* Betis Kiri */}
                  <rect
                    x="112" y="285" width="20" height="45" rx="6"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Betis Kiri (Gastrocnemius)', 'posterior')}
                  />
                  {/* Tendon Achilles */}
                  <circle
                    cx="76" cy="355" r="8"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Tendon Achilles Kanan', 'posterior')}
                  />
                  <circle
                    cx="124" cy="355" r="8"
                    className="cursor-pointer fill-transparent hover:fill-emerald-500/30 transition-colors"
                    onClick={() => handleZoneClick('Tendon Achilles Kiri', 'posterior')}
                  />
                </>
              )}

              {/* Render Existing Injury Pain Markers */}
              {filteredPainPoints.map((pain) => {
                if (pain.view !== currentView) return null;
                // Rough coordinate mapping for markers
                let cx = 100;
                let cy = 200;

                const loc = pain.location.toLowerCase();
                if (loc.includes('bahu kanan')) { cx = 60; cy = 78; }
                else if (loc.includes('bahu kiri')) { cx = 140; cy = 78; }
                else if (loc.includes('dada')) { cx = 100; cy = 95; }
                else if (loc.includes('lutut kanan')) { cx = 80; cy = 265; }
                else if (loc.includes('lutut kiri')) { cx = 120; cy = 265; }
                else if (loc.includes('ankle') || loc.includes('pergelangan kaki')) {
                  cx = loc.includes('kiri') ? 124 : 76;
                  cy = 350;
                }
                else if (loc.includes('hamstring')) {
                  cx = loc.includes('kiri') ? 120 : 80;
                  cy = 220;
                }
                else if (loc.includes('quadriceps') || loc.includes('paha depan')) {
                  cx = loc.includes('kiri') ? 120 : 80;
                  cy = 220;
                }
                else if (loc.includes('betis') || loc.includes('achilles')) {
                  cx = loc.includes('kiri') ? 122 : 78;
                  cy = 300;
                }
                else if (loc.includes('punggung')) {
                  cx = 100;
                  cy = loc.includes('bawah') ? 140 : 90;
                }

                const markerColor = pain.painLevel >= 7 ? '#ef4444' : pain.painLevel >= 4 ? '#f59e0b' : '#3b82f6';

                return (
                  <g key={pain.id} className="cursor-pointer">
                    <circle cx={cx} cy={cy} r="9" fill={markerColor} fillOpacity="0.85" stroke="#ffffff" strokeWidth="2" />
                    <text x={cx} y={cy + 3} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {pain.painLevel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Helper Legend */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 py-1 px-2.5 rounded border border-slate-200/50 dark:border-slate-800/50">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Ringan (1-3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Sedang (4-6)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Berat (7-10)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Pain Point Details & Add Entry Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header Action */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Area Nyeri Terpantau ({filteredPainPoints.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peringatan dini untuk mencegah cedera akut menjadi kronis.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Tutup Formulir' : 'Catat Area Nyeri'}</span>
            </button>
          </div>

          {/* Add / Log Form */}
          {showAddForm && (
            <form onSubmit={handleFormSubmit} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-500/40 dark:border-emerald-500/30 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Formulir Keluhan Nyeri Fisik Baru
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Atlet
                  </label>
                  <select
                    value={formAthleteId}
                    onChange={(e) => setFormAthleteId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    required
                  >
                    {athletes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} - {a.sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Anatomi Tubuh
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Lutut Kanan (Patella)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Pain Level Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tingkat Nyeri VAS (Visual Analogue Scale): <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">{formPainLevel}/10</span>
                  </label>
                  <span className={`text-xs font-medium ${
                    formPainLevel >= 7 ? 'text-rose-600' : formPainLevel >= 4 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {formPainLevel >= 7 ? 'Nyeri Berat / Gangguan Gerak' : formPainLevel >= 4 ? 'Nyeri Sedang / Terasa saat Latihan' : 'Nyeri Ringan / Discomfort'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formPainLevel}
                  onChange={(e) => setFormPainLevel(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Penanganan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Akut">Akut (Nyeri baru / radang)</option>
                    <option value="Sub-akut">Sub-akut (Dalam pengawasan)</option>
                    <option value="Pemulihan">Pemulihan (Rehabilitasi & Fisioterapi)</option>
                    <option value="Pulih">Pulih (Kembali bertanding penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Fisioterapi / Mekanisme
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Terjadi saat mendarat, kompres es 15 mnt"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          )}

          {/* List of Pain Points */}
          <div className="space-y-3">
            {filteredPainPoints.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Tidak Ada Keluhan Nyeri Aktif</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Semua atlet terpilih saat ini dalam kondisi bebas keluhan cedera muskuloskeletal.
                </p>
              </div>
            ) : (
              filteredPainPoints.map((pain) => {
                const athleteObj = getAthleteObj(pain.athleteId);
                const isHighPain = pain.painLevel >= 7;
                const isModeratePain = pain.painLevel >= 4;

                return (
                  <div
                    key={pain.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isHighPain ? 'bg-rose-500' : isModeratePain ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {pain.location}
                        </h4>
                        <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          VAS {pain.painLevel}/10
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {getAthleteName(pain.athleteId)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{pain.reportedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{pain.view === 'anterior' ? 'Depan' : 'Belakang'}</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                        {pain.notes}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <select
                        value={pain.status}
                        onChange={(e) => onUpdatePainStatus(pain.id, e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="Akut">Akut</option>
                        <option value="Sub-akut">Sub-akut</option>
                        <option value="Pemulihan">Pemulihan</option>
                        <option value="Pulih">Pulih (Selesai)</option>
                      </select>

                      {athleteObj && (
                        <button
                          onClick={() => onSelectAthleteForAI(athleteObj)}
                          title="Analisis Fisiologis & Pemulihan dengan AI"
                          className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
