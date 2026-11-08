import React, { useState } from 'react';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord } from '../types/athlete';
import { calculateSRPE, calculateReadinessScore, evaluateFitnessTest } from '../utils/sportsScience';
import { Activity, Heart, Zap, X } from 'lucide-react';

interface QuickLogModalProps {
  athletes: Athlete[];
  initialAthleteId?: string;
  onClose: () => void;
  onAddSession: (session: Omit<TrainingSessionLog, 'id'>) => void;
  onAddWellness: (log: Omit<WellnessLog, 'id'>) => void;
  onAddFitnessTest: (test: Omit<FitnessTestRecord, 'id'>) => void;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  athletes,
  initialAthleteId,
  onClose,
  onAddSession,
  onAddWellness,
  onAddFitnessTest,
}) => {
  const [logType, setLogType] = useState<'session' | 'wellness' | 'test'>('session');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    initialAthleteId || athletes[0]?.id || ''
  );

  // Session state
  const [sessionType, setSessionType] = useState<TrainingSessionLog['sessionType']>('Kondisi Kardio & Aerobik');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [rpe, setRpe] = useState<number>(7);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Wellness state
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [fatigue, setFatigue] = useState<number>(2);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [mood, setMood] = useState<number>(4);
  const [restingHR, setRestingHR] = useState<number>(54);

  // Fitness Test state
  const [testName, setTestName] = useState<string>('Yo-Yo Intermittent Recovery Test Level 1');
  const [testCategory, setTestCategory] = useState<FitnessTestRecord['category']>('Daya Tahan Kardiovaskular');
  const [testValue, setTestValue] = useState<number>(55.0);
  const [testUnit, setTestUnit] = useState<string>('ml/kg/min');

  const sRPE = calculateSRPE(durationMinutes, rpe);
  const calculatedReadiness = calculateReadinessScore({
    sleepQuality,
    sleepHours,
    muscleSoreness,
    fatigue,
    stressLevel,
    mood,
    restingHR,
    baselineHR: 52,
  });

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) return;

    onAddSession({
      athleteId: selectedAthleteId,
      date: new Date().toISOString().slice(0, 10),
      sessionType,
      durationMinutes,
      rpe,
      sRPE,
      notes: sessionNotes || 'Sesi latihan tercatat.',
    });
    onClose();
  };

  const handleWellnessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) return;

    onAddWellness({
      athleteId: selectedAthleteId,
      date: new Date().toISOString().slice(0, 10),
      sleepQuality,
      sleepHours,
      muscleSoreness,
      fatigue,
      stressLevel,
      mood,
      restingHR,
      readinessScore: calculatedReadiness,
      notes: 'Kuesioner pra-latihan harian.',
    });
    onClose();
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) return;

    const athlete = athletes.find((a) => a.id === selectedAthleteId);
    const evaluation = evaluateFitnessTest(testName, testValue, athlete?.gender || 'Putra');

    onAddFitnessTest({
      athleteId: selectedAthleteId,
      date: new Date().toISOString().slice(0, 10),
      testName,
      category: testCategory,
      value: testValue,
      unit: testUnit,
      normGrade: evaluation.grade,
      percentile: evaluation.percentile,
      notes: 'Baterai tes fisik terstandar.',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Pencatatan Data Fisik & Latihan
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Type Picker */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setLogType('session')}
            className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              logType === 'session'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sesi Latihan (sRPE)
          </button>
          <button
            type="button"
            onClick={() => setLogType('wellness')}
            className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              logType === 'wellness'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Wellness Kesiapan
          </button>
          <button
            type="button"
            onClick={() => setLogType('test')}
            className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              logType === 'test'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Hasil Tes Fisik
          </button>
        </div>

        {/* Select Athlete */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Pilih Atlet
          </label>
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.sport} ({a.position})
              </option>
            ))}
          </select>
        </div>

        {/* Tab 1: Sesi Latihan */}
        {logType === 'session' && (
          <form onSubmit={handleSessionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kategori Latihan
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Kondisi Kardio & Aerobik">Kondisi Kardio & Aerobik (VO2 Max)</option>
                <option value="Kekuatan & Beban">Kekuatan & Beban (Resistance / Gym)</option>
                <option value="Kecepatan & Akselerasi">Kecepatan & Akselerasi (Sprint)</option>
                <option value="Kelincahan & Taktik">Kelincahan & Taktik (Game Simulation)</option>
                <option value="Pemulihan Aktif">Pemulihan Aktif (Recovery / Mobilitas)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Durasi Sesi (Menit)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Skala RPE Borg CR10 (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Calculated sRPE Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Beban Latihan Internal (sRPE):
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {sRPE} <span className="text-xs font-normal text-slate-400">AU (Arbitrary Units)</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Catatan Sesi Latihan
              </label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Contoh: Fokus interval pendek 100m, cuaca lembab"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
              >
                Simpan Sesi
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Wellness */}
        {logType === 'wellness' && (
          <form onSubmit={handleWellnessSubmit} className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Skor Kesiapan Terestimasi:
              </span>
              <span className="text-base font-mono font-bold text-emerald-600">
                {calculatedReadiness}%
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Kualitas Tidur (1-5):</span>
                <span className="font-mono font-bold">{sleepQuality}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Nyeri Otot DOMS (1=Bugar, 5=Nyeri Berat):</span>
                <span className="font-mono font-bold">{muscleSoreness}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={muscleSoreness}
                onChange={(e) => setMuscleSoreness(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Tingkat Kelelahan (1=Segar, 5=Lelah):</span>
                <span className="font-mono font-bold">{fatigue}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={fatigue}
                onChange={(e) => setFatigue(parseInt(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
              >
                Simpan Wellness
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Tes Fisik */}
        {logType === 'test' && (
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Tes Fisik
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Contoh: Yo-Yo Intermittent Recovery 1, Sprint 30m"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hasil / Skor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={testValue}
                  onChange={(e) => setTestValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value)}
                  placeholder="ml/kg/min, detik, cm, reps"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
              >
                Simpan Hasil Tes
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
