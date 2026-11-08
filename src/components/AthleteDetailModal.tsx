import React, { useState } from 'react';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord, BodyPainPoint, PerformanceGoal } from '../types/athlete';
import { getACWRInfo } from '../utils/sportsScience';
import { Sparkles, Activity, Heart, Moon, Flame, Zap, ShieldAlert, Award, X, Target, CheckCircle2, FileDown } from 'lucide-react';
import { generateAthleteReportPDF } from '../utils/pdfReportGenerator';

interface AthleteDetailModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  trainingSessions: TrainingSessionLog[];
  wellnessLogs: WellnessLog[];
  fitnessTests: FitnessTestRecord[];
  painPoints: BodyPainPoint[];
  goals?: PerformanceGoal[];
  onSelectAthleteForAI: (athlete: Athlete) => void;
  onOpenLogSession: (athleteId: string) => void;
}

export const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({
  athlete,
  onClose,
  trainingSessions,
  wellnessLogs,
  fitnessTests,
  painPoints,
  goals = [],
  onSelectAthleteForAI,
  onOpenLogSession,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!athlete) return null;

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    try {
      generateAthleteReportPDF({
        athlete,
        trainingSessions,
        wellnessLogs,
        fitnessTests,
        painPoints,
        goals,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3500);
    } catch (err) {
      console.error('Failed to generate athlete PDF report:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const acwrInfo = getACWRInfo(athlete.acwr);
  const bmi = (athlete.weight / ((athlete.height / 100) ** 2)).toFixed(1);

  const athleteSessions = trainingSessions.filter((s) => s.athleteId === athlete.id);
  const athleteWellness = wellnessLogs.filter((w) => w.athleteId === athlete.id);
  const athleteTests = fitnessTests.filter((t) => t.athleteId === athlete.id);
  const athletePains = painPoints.filter((p) => p.athleteId === athlete.id);

  // Approximate 5 biomotor pillars for SVG radar chart (scaled 0-100)
  // 1: Endurance (VO2Max), 2: Speed (30m), 3: Agility (Illinois), 4: Power (Jump), 5: Flexibility (Sit&Reach)
  const enduranceVal = athleteTests.find((t) => t.category === 'Daya Tahan Kardiovaskular')?.percentile || 85;
  const speedVal = athleteTests.find((t) => t.category === 'Kecepatan')?.percentile || 80;
  const agilityVal = athleteTests.find((t) => t.category === 'Kelincahan')?.percentile || 88;
  const powerVal = athleteTests.find((t) => t.category === 'Daya Ledak')?.percentile || 82;
  const flexVal = athleteTests.find((t) => t.category === 'Kelentukan')?.percentile || 78;

  // Radar chart mathematical coordinates for a 5-point polygon (center at 100, 100, radius max 75)
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 75;

  const getCoordinates = (valuePercent: number, angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const r = (valuePercent / 100) * maxRadius;
    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);
    return { x, y };
  };

  const p1 = getCoordinates(enduranceVal, 0); // Top: Endurance
  const p2 = getCoordinates(speedVal, 72); // Right Top: Speed
  const p3 = getCoordinates(powerVal, 144); // Right Bottom: Power
  const p4 = getCoordinates(agilityVal, 216); // Left Bottom: Agility
  const p5 = getCoordinates(flexVal, 288); // Left Top: Flexibility

  const polygonPoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p5.x},${p5.y}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 p-6">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
              {athlete.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {athlete.name}
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  athlete.status === 'Fit'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {athlete.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {athlete.sport} · {athlete.position} · {athlete.age} Tahun · {athlete.gender}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs border ${
                pdfDownloaded
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
              }`}
              title="Unduh Laporan Ringkasan PDF Sports Science"
            >
              {pdfDownloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>PDF Terunduh</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>{isGeneratingPDF ? 'Menyiapkan...' : 'Download Report'}</span>
                </>
              )}
            </button>
            <button
              onClick={() => onSelectAthleteForAI(athlete)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis AI</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Biometric Strip: 5 metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tinggi / Berat</div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {athlete.height} <span className="text-xs font-normal">cm</span> / {athlete.weight} <span className="text-xs font-normal">kg</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">BMI: {bmi}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Body Fat</div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {athlete.bodyFat}%
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Komposisi Atletik</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Resting HR</div>
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {athlete.restingHeartRate} <span className="text-xs font-normal">bpm</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Denyut Istirahat</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Rasio ACWR</div>
            <div className={`text-sm font-mono font-bold mt-1 ${acwrInfo.badgeStyle}`}>
              {athlete.acwr.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{acwrInfo.label}</div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Kesiapan Latihan</div>
            <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {athlete.readinessScore}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Skor Hooper</div>
          </div>
        </div>

        {/* 2-Column Split: Radar Chart & Pain/Injury Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Radar Chart 5 Pilar Biomotorik (6 cols) */}
          <div className="md:col-span-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Profil 5 Pilar Biomotorik Atlet
              </span>
              <span className="text-[11px] text-slate-400">Persentil Prestasi</span>
            </div>

            <div className="w-60 h-60 relative flex items-center justify-center my-2 select-none">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Concentric Guideline Circles */}
                <circle cx={centerX} cy={centerY} r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
                <circle cx={centerX} cy={centerY} r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
                <circle cx={centerX} cy={centerY} r="60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700" />
                <circle cx={centerX} cy={centerY} r="75" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-slate-600" />

                {/* Spoke Lines */}
                {[0, 72, 144, 216, 288].map((angle, i) => {
                  const rad = ((angle - 90) * Math.PI) / 180;
                  const x2 = centerX + maxRadius * Math.cos(rad);
                  const y2 = centerY + maxRadius * Math.sin(rad);
                  return (
                    <line
                      key={i}
                      x1={centerX}
                      y1={centerY}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="0.8"
                      className="text-slate-300 dark:text-slate-700"
                    />
                  );
                })}

                {/* Polygon Shape */}
                <polygon
                  points={polygonPoints}
                  fill="#10b981"
                  fillOpacity="0.35"
                  stroke="#10b981"
                  strokeWidth="2"
                />

                {/* Points */}
                {[p1, p2, p3, p4, p5].map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#047857" stroke="#ffffff" strokeWidth="1" />
                ))}

                {/* Labels */}
                <text x="100" y="14" textAnchor="middle" className="text-[8px] font-semibold fill-slate-700 dark:fill-slate-300">
                  Daya Tahan ({enduranceVal}%)
                </text>
                <text x="180" y="68" textAnchor="middle" className="text-[8px] font-semibold fill-slate-700 dark:fill-slate-300">
                  Kecepatan ({speedVal}%)
                </text>
                <text x="155" y="175" textAnchor="middle" className="text-[8px] font-semibold fill-slate-700 dark:fill-slate-300">
                  Daya Ledak ({powerVal}%)
                </text>
                <text x="45" y="175" textAnchor="middle" className="text-[8px] font-semibold fill-slate-700 dark:fill-slate-300">
                  Kelincahan ({agilityVal}%)
                </text>
                <text x="20" y="68" textAnchor="middle" className="text-[8px] font-semibold fill-slate-700 dark:fill-slate-300">
                  Kelentukan ({flexVal}%)
                </text>
              </svg>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Evaluasi komprehensif mengacu pada standar fisik KONI & FIO Sports Science.
            </div>
          </div>

          {/* Right: Active Injuries & Action (6 cols) */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Pain Points */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Area Keluhan Nyeri Tubuh
                </span>
                <span className="text-[11px] text-slate-400">
                  {athletePains.length} Catatan
                </span>
              </div>

              {athletePains.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                  Tidak ada keluhan nyeri muskuloskeletal yang dilaporkan. Kondisi bebas nyeri.
                </div>
              ) : (
                athletePains.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900 dark:text-white">{p.location}</span>
                      <span className="text-rose-600 font-mono">VAS {p.painLevel}/10 ({p.status})</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {p.notes}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Coach Notes */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Catatan Fisiologis Pelatih:
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{athlete.notes || 'Atlet menunjukkan kedisiplinan pemulihan yang baik.'}"
              </p>
            </div>

            <button
              onClick={() => onOpenLogSession(athlete.id)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              + Catat Sesi Latihan Baru untuk {athlete.name}
            </button>

          </div>

        </div>

        {/* Target Performa & Capaian Individual (Performance Goals) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Target Performa Individual & Progress Indikator
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {goals.filter((g) => g.athleteId === athlete.id).length} Target Aktif
            </span>
          </div>

          {goals.filter((g) => g.athleteId === athlete.id).length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Belum ada target performa khusus yang ditetapkan untuk atlet ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals
                .filter((g) => g.athleteId === athlete.id)
                .map((goal) => {
                  let progress = 0;
                  if (goal.higherIsBetter) {
                    const range = goal.targetValue - goal.baselineValue;
                    progress = range > 0 ? ((goal.currentValue - goal.baselineValue) / range) * 100 : 100;
                  } else {
                    const range = goal.baselineValue - goal.targetValue;
                    progress = range > 0 ? ((goal.baselineValue - goal.currentValue) / range) * 100 : 100;
                  }
                  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
                  const isAchieved = goal.status === 'Achieved' || clampedProgress >= 100;

                  return (
                    <div
                      key={goal.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            {goal.title}
                          </div>
                          {goal.exerciseName && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {goal.exerciseName}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isAchieved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : goal.status === 'Needs Attention'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {isAchieved ? 'Tercapai' : goal.status === 'In Progress' ? 'Berjalan' : 'Perhatian'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Pencapaian Target</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {clampedProgress}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isAchieved
                                ? 'bg-emerald-500'
                                : clampedProgress >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${clampedProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Baseline</div>
                          <div className="font-mono text-slate-600 dark:text-slate-400">
                            {goal.baselineValue} {goal.unit}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] text-slate-400 uppercase">Saat Ini</div>
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {goal.currentValue} {goal.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Target</div>
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {goal.targetValue} {goal.unit}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Batas: {goal.deadlineDate}</span>
                        <span>{goal.category}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Recent Training Sessions and Fitness Tests */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Riwayat Tes Fisik Terakhir
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {athleteTests.map((t) => (
              <div key={t.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{t.testName}</div>
                  <div className="text-[11px] text-slate-400">{t.date} · {t.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {t.value} <span className="text-[11px] font-normal text-slate-400">{t.unit}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {t.normGrade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
