import React, { useState } from 'react';
import { Athlete, FitnessTestRecord } from '../types/athlete';
import { evaluateFitnessTest } from '../utils/sportsScience';
import { Trophy, Plus, Activity, Zap, Timer, Award } from 'lucide-react';

interface FitnessBatterySectionProps {
  athletes: Athlete[];
  fitnessTests: FitnessTestRecord[];
  onAddFitnessTest: (test: Omit<FitnessTestRecord, 'id'>) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
}

export const FitnessBatterySection: React.FC<FitnessBatterySectionProps> = ({
  athletes,
  fitnessTests,
  onAddFitnessTest,
  onSelectAthleteDetail,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formAthleteId, setFormAthleteId] = useState<string>(athletes[0]?.id || '');
  const [formTestName, setFormTestName] = useState<string>('Yo-Yo Intermittent Recovery Test Level 1');
  const [formCategory, setFormCategory] = useState<FitnessTestRecord['category']>('Daya Tahan Kardiovaskular');
  const [formValue, setFormValue] = useState<number>(55.0);
  const [formUnit, setFormUnit] = useState<string>('ml/kg/min');
  const [formNotes, setFormNotes] = useState<string>('');

  const standardTests = [
    {
      name: 'Yo-Yo Intermittent Recovery Test Level 1',
      category: 'Daya Tahan Kardiovaskular' as const,
      unit: 'ml/kg/min',
      defaultValue: 56.0,
    },
    {
      name: 'Bleep Test (Multistage Fitness Test)',
      category: 'Daya Tahan Kardiovaskular' as const,
      unit: 'ml/kg/min',
      defaultValue: 54.0,
    },
    {
      name: 'Sprint 30m (Elektronik/Stopwatch)',
      category: 'Kecepatan' as const,
      unit: 'detik',
      defaultValue: 4.05,
    },
    {
      name: 'Illinois Agility Test',
      category: 'Kelincahan' as const,
      unit: 'detik',
      defaultValue: 15.5,
    },
    {
      name: 'Vertical Jump (Sargent Jump)',
      category: 'Daya Ledak' as const,
      unit: 'cm',
      defaultValue: 65,
    },
    {
      name: 'Sit and Reach (Tes Kelentukan)',
      category: 'Kelentukan' as const,
      unit: 'cm',
      defaultValue: 36,
    },
    {
      name: 'Push-Up 60 Detik',
      category: 'Kekuatan Otot' as const,
      unit: 'repetisi',
      defaultValue: 45,
    },
  ];

  const handleTestSelection = (name: string) => {
    setFormTestName(name);
    const found = standardTests.find((t) => t.name === name);
    if (found) {
      setFormCategory(found.category);
      setFormUnit(found.unit);
      setFormValue(found.defaultValue);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAthleteId) return;

    const selectedAthlete = athletes.find((a) => a.id === formAthleteId);
    const evalResult = evaluateFitnessTest(formTestName, formValue, selectedAthlete?.gender || 'Putra');

    onAddFitnessTest({
      athleteId: formAthleteId,
      date: new Date().toISOString().slice(0, 10),
      testName: formTestName,
      category: formCategory,
      value: formValue,
      unit: formUnit,
      normGrade: evalResult.grade,
      percentile: evalResult.percentile,
      notes: formNotes || 'Tes fisik terstandar Sports Science.',
    });

    setShowAddModal(false);
    setFormNotes('');
  };

  const filteredTests = fitnessTests.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const getAthlete = (id: string) => athletes.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Baterai Tes Fisik Terstandar (Norma Sports Science)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluasi berkala 5 pilar biomotorik: Daya Tahan Kardiovaskular, Kecepatan, Kelincahan, Daya Ledak, dan Kelentukan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Input Hasil Tes Fisik</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
        {['all', 'Daya Tahan Kardiovaskular', 'Kecepatan', 'Kelincahan', 'Daya Ledak', 'Kelentukan'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              categoryFilter === cat
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {cat === 'all' ? 'Semua Komponen' : cat}
          </button>
        ))}
      </div>

      {/* Fitness Test Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => {
          const athlete = getAthlete(test.athleteId);
          const isExcellent = test.normGrade === 'Sangat Baik';
          const isGood = test.normGrade === 'Baik';

          return (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {test.category}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {test.testName}
                  </h3>
                </div>

                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isExcellent 
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : isGood 
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' 
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {test.normGrade}
                </span>
              </div>

              {/* Value and Percentile */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {test.value}
                  </span>
                  <span className="text-xs text-slate-500 ml-1 font-mono">
                    {test.unit}
                  </span>
                </div>

                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Persentil ke-{test.percentile}
                </div>
              </div>

              {/* Athlete Attribution */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {athlete ? (
                  <button
                    onClick={() => onSelectAthleteDetail(athlete)}
                    className="font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                  >
                    {athlete.name} ({athlete.sport})
                  </button>
                ) : (
                  <span className="text-slate-500">ID: {test.athleteId}</span>
                )}

                <span className="text-slate-400 text-[11px] font-mono">
                  {test.date}
                </span>
              </div>

              {test.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  "{test.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Catat Hasil Tes Fisik Atlet
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Atlet
                </label>
                <select
                  value={formAthleteId}
                  onChange={(e) => setFormAthleteId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                >
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.sport})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Baterai Tes Terstandar
                </label>
                <select
                  value={formTestName}
                  onChange={(e) => handleTestSelection(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {standardTests.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nilai Capaian Hasil Tes
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan Ukur
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Observasi Biomekanik
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Form gerak stabil, pendaratan seimbang"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Hasil Tes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
