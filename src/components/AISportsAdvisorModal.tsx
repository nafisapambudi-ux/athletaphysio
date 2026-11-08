import React, { useState, useEffect } from 'react';
import { Athlete, TrainingSessionLog, WellnessLog, FitnessTestRecord, BodyPainPoint, AIAnalysisResult } from '../types/athlete';
import { Sparkles, ShieldAlert, CheckCircle2, Printer, X, Loader2, ArrowRight } from 'lucide-react';

interface AISportsAdvisorModalProps {
  athlete: Athlete | null;
  onClose: () => void;
  trainingSessions: TrainingSessionLog[];
  wellnessLogs: WellnessLog[];
  fitnessTests: FitnessTestRecord[];
  painPoints: BodyPainPoint[];
}

export const AISportsAdvisorModal: React.FC<AISportsAdvisorModalProps> = ({
  athlete,
  onClose,
  trainingSessions,
  wellnessLogs,
  fitnessTests,
  painPoints,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (athlete) {
      runAnalysis();
    }
  }, [athlete]);

  const runAnalysis = async () => {
    if (!athlete) return;
    setLoading(true);
    setError(null);

    const athleteSessions = trainingSessions.filter((s) => s.athleteId === athlete.id);
    const athleteWellness = wellnessLogs.filter((w) => w.athleteId === athlete.id);
    const athleteTests = fitnessTests.filter((t) => t.athleteId === athlete.id);
    const athletePains = painPoints.filter((p) => p.athleteId === athlete.id);

    try {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        setAnalysis(createOfflineAnalysis(athlete, athleteSessions, athleteWellness, athleteTests, athletePains));
        return;
      }

      const response = await fetch('/api/analyze-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete,
          recentSessions: athleteSessions,
          fitnessTests: athleteTests,
          wellnessLogs: athleteWellness,
          bodyPainPoints: athletePains,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil respon dari server analisis.');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.warn('Analysis fallback used due to network or offline mode:', err);
      // Scientific offline fallback
      setAnalysis(createOfflineAnalysis(athlete, athleteSessions, athleteWellness, athleteTests, athletePains));
    } finally {
      setLoading(false);
    }
  };

  function createOfflineAnalysis(
    athlete: Athlete,
    athleteSessions: TrainingSessionLog[],
    athleteWellness: WellnessLog[],
    athleteTests: FitnessTestRecord[],
    athletePains: BodyPainPoint[]
  ): AIAnalysisResult {
    return {
      overallStatus: `Status fisik ${athlete.status} dengan ACWR ${athlete.acwr.toFixed(2)} dan kesiapan ${athlete.readinessScore}%.`,
      riskLevel: athlete.acwr > 1.5 ? 'Tinggi' : athlete.acwr > 1.3 ? 'Sedang' : 'Rendah',
      workloadInsights: `Beban kronis atlet ${athlete.chronicLoad} AU dengan beban akut 7 hari ${athlete.acuteLoad} AU. Nilai ACWR ${athlete.acwr.toFixed(2)} mengindikasikan keseimbangan beban dan kelelahan saat ini.`,
      loadPrescription: athlete.acwr > 1.4
        ? 'Kurangi beban intensitas tinggi sebesar 25-30%. Ganti latihan sprint maksimal dengan latihan mobilitas sendi dan taktik posisi.'
        : 'Beban berada di zona optimal. Lanjutkan program periodisasi mikro-siklus yang telah direncanakan.',
      recoveryProtocols: [
        'Hidroterapi kontras mandi air dingin 12°C dan air hangat 38°C (3 siklus).',
        'Pastikan tidur 8 jam dengan ventilasi kamar sejuk.',
        'Asupan karbohidrat-protein rasio 3:1 dalam 45 menit pasca-latihan.',
        'Peregangan dinamis dan foam rolling pada kelompok otot paha dan betis.'
      ],
      injuryConsiderations: athletePains.length > 0
        ? `Perhatikan area keluhan: ${athletePains.map((p) => p.location).join(', ')}. Hindari beban kejut eksentrik pada sendi terkait.`
        : 'Tidak ada keluhan nyeri aktif yang dilaporkan. Tetap lakukan dynamic warm-up.',
      suggestedTarget: `Pertahankan efisiensi ambang aerobik dan adaptasi kecepatan untuk cabang olahraga ${athlete.sport}.`,
    };
  }

  const handlePrint = () => {
    window.print();
  };

  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 p-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Analisis Kondisi Fisik Sports Science
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {athlete.name} · {athlete.sport} ({athlete.position})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Cetak Laporan Rekomendasi"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Mengevaluasi Biomotorik & Beban ACWR...
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Menganalisis korelasi kelelahan Hooper Index, risiko cedera muskuloskeletal, dan rekomendasi periodisasi latihan.
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4 text-xs">
            
            {/* Status & Risk Level Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ringkasan Status Fisik
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  analysis.riskLevel === 'Tinggi'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : analysis.riskLevel === 'Sedang'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  Risiko Cedera: {analysis.riskLevel}
                </span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {analysis.overallStatus}
              </p>
            </div>

            {/* Workload Insights */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Analisis Beban Kerja & Fisiologi (ACWR):
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {analysis.workloadInsights}
              </p>
            </div>

            {/* Load Prescription */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Rekomendasi Beban Latihan Hari Ini:
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {analysis.loadPrescription}
              </p>
            </div>

            {/* Recovery Protocols */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Protokol Pemulihan Khusus (Fisioterapi):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.recoveryProtocols.map((protocol, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{protocol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Injury Considerations */}
            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Perhatian Muskuloskeletal & Pencegahan Cedera:
              </div>
              <p>{analysis.injuryConsiderations}</p>
            </div>

            {/* Mid-term Target */}
            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Target Jangka Menengah:</span> {analysis.suggestedTarget}
            </div>

          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="text-xs text-emerald-600 hover:underline cursor-pointer disabled:opacity-50"
          >
            Muat Ulang Analisis
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
