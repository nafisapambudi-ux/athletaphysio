import React, { useState } from 'react';
import { Athlete, WellnessLog } from '../types/athlete';
import { calculateReadinessScore } from '../utils/sportsScience';
import { Heart, Moon, Flame, Smile, Frown, Sparkles, Plus, CheckCircle2 } from 'lucide-react';

interface DailyWellnessTrackerProps {
  athletes: Athlete[];
  wellnessLogs: WellnessLog[];
  onAddWellnessLog: (log: Omit<WellnessLog, 'id'>) => void;
  onSelectAthleteForAI: (athlete: Athlete) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
}

export const DailyWellnessTracker: React.FC<DailyWellnessTrackerProps> = ({
  athletes,
  wellnessLogs,
  onAddWellnessLog,
  onSelectAthleteForAI,
  onSelectAthleteDetail,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);

  // Form state
  const [formAthleteId, setFormAthleteId] = useState<string>(athletes[0]?.id || '');
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(8.0);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [fatigue, setFatigue] = useState<number>(2);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [mood, setMood] = useState<number>(4);
  const [restingHR, setRestingHR] = useState<number>(54);
  const [notes, setNotes] = useState<string>('');

  const currentReadiness = calculateReadinessScore({
    sleepQuality,
    sleepHours,
    muscleSoreness,
    fatigue,
    stressLevel,
    mood,
    restingHR,
    baselineHR: 52,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAthleteId) return;

    onAddWellnessLog({
      athleteId: formAthleteId,
      date: new Date().toISOString().slice(0, 10),
      sleepQuality,
      sleepHours,
      muscleSoreness,
      fatigue,
      stressLevel,
      mood,
      restingHR,
      readinessScore: currentReadiness,
      notes: notes || 'Kuesioner kesiapan harian pra-latihan.',
    });

    setShowLogModal(false);
    setNotes('');
  };

  const getAthlete = (id: string) => athletes.find((a) => a.id === id);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Kuesioner Kesiapan & Wellness Harian (Hooper Index)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Penilaian subjektif pra-latihan: Kualitas tidur, pegal otot (DOMS), kelelahan, dan tingkat stres untuk menentukan kesiapan bertanding.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Isi Kuesioner Hari Ini</span>
        </button>
      </div>

      {/* Wellness Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {athletes.map((athlete) => {
          const log = wellnessLogs.find((w) => w.athleteId === athlete.id);
          const score = log?.readinessScore ?? athlete.readinessScore;
          const isHigh = score >= 80;
          const isModerate = score >= 65 && score < 80;

          return (
            <div
              key={athlete.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <button
                    onClick={() => onSelectAthleteDetail(athlete)}
                    className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer text-left block"
                  >
                    {athlete.name}
                  </button>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {athlete.sport} · {athlete.position}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block font-mono font-bold text-base tabular-nums ${
                    isHigh ? 'text-emerald-700 dark:text-emerald-400' : isModerate ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                  }`}>
                    {score}%
                  </span>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Readiness
                  </div>
                </div>
              </div>

              {/* Hooper Factor Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Moon className="w-3 h-3" /> Tidur
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {log?.sleepQuality || 4}/5
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {log?.sleepHours || 8}h
                  </div>
                </div>

                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3" /> Pegal
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {log?.muscleSoreness || 2}/5
                  </div>
                  <div className="text-[9px] text-slate-400">
                    DOMS
                  </div>
                </div>

                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Smile className="w-3 h-3" /> Lelah
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {log?.fatigue || 2}/5
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Fatigue
                  </div>
                </div>

                <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3" /> RHR
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {log?.restingHR || athlete.restingHeartRate}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    bpm
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                "{log?.notes || athlete.notes}"
              </p>

              {/* Quick AI Advice Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className={`text-[11px] font-semibold ${
                  isHigh ? 'text-emerald-700 dark:text-emerald-400' : isModerate ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {isHigh ? 'Siap Latihan Penuh' : isModerate ? 'Modifikasi Porsi Beban' : 'Fokus Pemulihan Aktif'}
                </span>

                <button
                  onClick={() => onSelectAthleteForAI(athlete)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Saran AI</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog: Log Wellness Form */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kuesioner Wellness & Kesiapan Harian
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Calculated Live Readiness Preview */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Kalkulasi Skor Kesiapan (Readiness):
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {currentReadiness >= 80 ? 'Status: Siap Latihan Penuh' : currentReadiness >= 65 ? 'Status: Perlu Modifikasi' : 'Status: Kelelahan Tinggi'}
                  </div>
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {currentReadiness}%
                </div>
              </div>

              {/* Slider 1: Kualitas Tidur */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Kualitas Tidur (1 = Buruk, 5 = Sangat Nyenyak):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{sleepQuality}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Input: Jam Tidur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Durasi Tidur (Jam)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="3"
                    max="14"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Denyut Nadi Istirahat (RHR bpm)
                  </label>
                  <input
                    type="number"
                    min="38"
                    max="110"
                    value={restingHR}
                    onChange={(e) => setRestingHR(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Slider 2: Nyeri Otot (DOMS) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Nyeri Otot / Pegal (1 = Bugar, 5 = Sangat Pegal):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{muscleSoreness}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={muscleSoreness}
                  onChange={(e) => setMuscleSoreness(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Slider 3: Kelelahan (Fatigue) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Tingkat Kelelahan (1 = Bertenaga, 5 = Sangat Lelah):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{fatigue}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={fatigue}
                  onChange={(e) => setFatigue(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Slider 4: Stres Level */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Tingkat Stres (1 = Rileks, 5 = Sangat Stres):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{stressLevel}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan Atlet
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Otot betis agak kaku setelah latihan fisik kemarin sore"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Kuesioner
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
