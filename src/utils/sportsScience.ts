import { WellnessLog, TrainingSessionLog, Athlete, BodyPainPoint } from '../types/athlete';

export function calculateSRPE(durationMinutes: number, rpe: number): number {
  return Math.round(durationMinutes * rpe);
}

export interface ACWRInfo {
  ratio: number;
  label: string;
  badgeStyle: string;
  riskDescription: string;
  actionRecommendation: string;
}

export function getACWRInfo(acwr: number): ACWRInfo {
  if (acwr < 0.8) {
    return {
      ratio: acwr,
      label: 'Under-Training (< 0.8)',
      badgeStyle: 'text-sky-700 dark:text-sky-400',
      riskDescription: 'Risiko cedera rendah saat ini, namun rentan jika mendadak diberikan intensitas tinggi.',
      actionRecommendation: 'Tingkatkan beban latihan secara bertahap (maksimal 10% per minggu) untuk membangun fondasi kronis.',
    };
  }
  if (acwr <= 1.3) {
    return {
      ratio: acwr,
      label: 'Optimal "Sweet Spot" (0.8 - 1.3)',
      badgeStyle: 'text-emerald-700 dark:text-emerald-400',
      riskDescription: 'Risiko cedera sangat minimal, kebugaran meningkat secara optimal.',
      actionRecommendation: 'Pertahankan program latihan sesuai rencana periodisasi saat ini.',
    };
  }
  if (acwr <= 1.5) {
    return {
      ratio: acwr,
      label: 'Waspada Lonjakan Beban (1.3 - 1.5)',
      badgeStyle: 'text-amber-700 dark:text-amber-400',
      riskDescription: 'Risiko cedera meningkat akibat akumulasi kelelahan jangka pendek.',
      actionRecommendation: 'Pantau ketat keluhan nyeri otot, batasi sesi kontak fisik atau volume sprint maksimal.',
    };
  }
  return {
    ratio: acwr,
    label: 'Zona Bahaya (> 1.5)',
    badgeStyle: 'text-rose-700 dark:text-rose-400',
    riskDescription: 'Risiko cedera tinggi (2x hingga 4x lebih rentan cedera jaringan lunak/overuse).',
    actionRecommendation: 'Wajib deloading: kurangi volume latihan 30-40% dan berikan sesi pemulihan aktif terstruktur.',
  };
}

export function calculateReadinessScore(wellness: {
  sleepQuality: number; // 1-5
  sleepHours: number;
  muscleSoreness: number; // 1-5 (1 best, 5 worst)
  fatigue: number; // 1-5 (1 best, 5 worst)
  stressLevel: number; // 1-5 (1 best, 5 worst)
  mood: number; // 1-5
  restingHR?: number;
  baselineHR?: number;
}): number {
  // Hooper index normalization (weights)
  // Sleep Quality: 20%
  const sleepPart = (wellness.sleepQuality / 5) * 20;
  // Invert negative indicators (1 is good, 5 is bad)
  const sorenessPart = ((6 - wellness.muscleSoreness) / 5) * 25;
  const fatiguePart = ((6 - wellness.fatigue) / 5) * 25;
  const stressPart = ((6 - wellness.stressLevel) / 5) * 15;
  const moodPart = (wellness.mood / 5) * 15;

  let total = sleepPart + sorenessPart + fatiguePart + stressPart + moodPart;

  // Penalties for extreme sleep deprivation
  if (wellness.sleepHours < 6) {
    total -= 8;
  } else if (wellness.sleepHours >= 8) {
    total += 3;
  }

  // Heart rate deviation penalty
  if (wellness.restingHR && wellness.baselineHR && wellness.restingHR > wellness.baselineHR + 7) {
    total -= 6;
  }

  return Math.max(10, Math.min(100, Math.round(total)));
}

export function evaluateFitnessTest(testName: string, value: number, gender: 'Putra' | 'Putri' = 'Putra'): {
  grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' | 'Sangat Kurang';
  percentile: number;
} {
  const norm = testName.toLowerCase();

  // Bleep / Yo-Yo VO2 Max (ml/kg/min)
  if (norm.includes('vo2') || norm.includes('bleep') || norm.includes('yo-yo')) {
    if (gender === 'Putra') {
      if (value >= 56) return { grade: 'Sangat Baik', percentile: 95 };
      if (value >= 50) return { grade: 'Baik', percentile: 80 };
      if (value >= 44) return { grade: 'Cukup', percentile: 60 };
      if (value >= 38) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    } else {
      if (value >= 50) return { grade: 'Sangat Baik', percentile: 95 };
      if (value >= 44) return { grade: 'Baik', percentile: 80 };
      if (value >= 38) return { grade: 'Cukup', percentile: 60 };
      if (value >= 32) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    }
  }

  // Sprint 30m (detik) - lower is better
  if (norm.includes('30m') || norm.includes('sprint')) {
    if (gender === 'Putra') {
      if (value <= 3.90) return { grade: 'Sangat Baik', percentile: 95 };
      if (value <= 4.10) return { grade: 'Baik', percentile: 80 };
      if (value <= 4.30) return { grade: 'Cukup', percentile: 60 };
      if (value <= 4.55) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    } else {
      if (value <= 4.25) return { grade: 'Sangat Baik', percentile: 95 };
      if (value <= 4.45) return { grade: 'Baik', percentile: 80 };
      if (value <= 4.70) return { grade: 'Cukup', percentile: 60 };
      if (value <= 5.00) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    }
  }

  // Illinois Agility Test (detik) - lower is better
  if (norm.includes('agility') || norm.includes('illinois')) {
    if (gender === 'Putra') {
      if (value <= 15.2) return { grade: 'Sangat Baik', percentile: 95 };
      if (value <= 16.1) return { grade: 'Baik', percentile: 80 };
      if (value <= 17.2) return { grade: 'Cukup', percentile: 60 };
      if (value <= 18.3) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    } else {
      if (value <= 16.5) return { grade: 'Sangat Baik', percentile: 95 };
      if (value <= 17.5) return { grade: 'Baik', percentile: 80 };
      if (value <= 18.6) return { grade: 'Cukup', percentile: 60 };
      if (value <= 19.8) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    }
  }

  // Vertical Jump (cm) - higher is better
  if (norm.includes('vertical') || norm.includes('jump')) {
    if (gender === 'Putra') {
      if (value >= 65) return { grade: 'Sangat Baik', percentile: 95 };
      if (value >= 55) return { grade: 'Baik', percentile: 80 };
      if (value >= 45) return { grade: 'Cukup', percentile: 60 };
      if (value >= 35) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    } else {
      if (value >= 50) return { grade: 'Sangat Baik', percentile: 95 };
      if (value >= 42) return { grade: 'Baik', percentile: 80 };
      if (value >= 34) return { grade: 'Cukup', percentile: 60 };
      if (value >= 26) return { grade: 'Kurang', percentile: 40 };
      return { grade: 'Sangat Kurang', percentile: 20 };
    }
  }

  // Sit and Reach (cm) - higher is better
  if (norm.includes('reach') || norm.includes('flexibility') || norm.includes('kelentukan')) {
    if (value >= 38) return { grade: 'Sangat Baik', percentile: 95 };
    if (value >= 32) return { grade: 'Baik', percentile: 80 };
    if (value >= 26) return { grade: 'Cukup', percentile: 60 };
    if (value >= 20) return { grade: 'Kurang', percentile: 40 };
    return { grade: 'Sangat Kurang', percentile: 20 };
  }

  // Push-up 60 detik (reps)
  if (norm.includes('push') || norm.includes('kekuatan')) {
    if (value >= 50) return { grade: 'Sangat Baik', percentile: 95 };
    if (value >= 40) return { grade: 'Baik', percentile: 80 };
    if (value >= 30) return { grade: 'Cukup', percentile: 60 };
    if (value >= 20) return { grade: 'Kurang', percentile: 40 };
    return { grade: 'Sangat Kurang', percentile: 20 };
  }

  return { grade: 'Baik', percentile: 75 };
}

export function exportAthletesToCSV(athletes: any[]): void {
  const headers = [
    'ID',
    'Nama Atlet',
    'Cabang Olahraga',
    'Posisi',
    'Usia',
    'Jenis Kelamin',
    'Tinggi (cm)',
    'Berat (kg)',
    'Body Fat (%)',
    'RHR (bpm)',
    'Status Fisik',
    'Skor Kesiapan (%)',
    'ACWR',
    'Beban Akut (AU)',
    'Beban Kronis (AU)',
  ];

  const rows = athletes.map((a) => [
    a.id,
    `"${a.name}"`,
    `"${a.sport}"`,
    `"${a.position}"`,
    a.age,
    a.gender,
    a.height,
    a.weight,
    a.bodyFat,
    a.restingHeartRate,
    a.status,
    a.readinessScore,
    a.acwr,
    a.acuteLoad,
    a.chronicLoad,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `rekap_kondisi_fisik_atlet_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface WorkloadDayPoint {
  date: string;
  dayLabel: string;
  sessionLoad: number;
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  isRestDay: boolean;
}

export function generateWorkloadTimelineData(
  athlete: { id: string; acuteLoad: number; chronicLoad: number; acwr: number },
  sessions: TrainingSessionLog[],
  daysCount: number = 14
): WorkloadDayPoint[] {
  const result: WorkloadDayPoint[] = [];
  const baseDate = new Date('2026-11-06T12:00:00Z');

  // Baseline load references
  const chronicBase = athlete.chronicLoad || 2400;
  const currentAcute = athlete.acuteLoad || 2600;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

    // Find actual logged session if available
    const session = sessions.find((s) => s.athleteId === athlete.id && s.date === dateStr);
    
    // Simulate realistic sports periodization wave if no direct log
    // Rest days on every 4th or 7th day
    const dayMod = i % 7;
    const isRest = dayMod === 3 || dayMod === 6;
    let load = session ? session.sRPE : isRest ? 0 : Math.round(350 + (Math.sin(i * 1.2) * 180) + (athlete.acwr > 1.4 ? 150 : 0));

    // Rolling acute & chronic approximation
    const progressFactor = (daysCount - i) / daysCount;
    const acute = Math.round(chronicBase * 0.9 + (currentAcute - chronicBase * 0.9) * progressFactor + (load > 0 ? load * 0.25 : -80));
    const chronic = Math.round(chronicBase * 0.95 + (chronicBase * 0.05 * progressFactor));
    const ratio = chronic > 0 ? parseFloat((acute / chronic).toFixed(2)) : 1.0;

    result.push({
      date: dateStr,
      dayLabel,
      sessionLoad: load,
      acuteLoad: acute,
      chronicLoad: chronic,
      acwr: ratio,
      isRestDay: load === 0,
    });
  }

  return result;
}

export interface WellnessTrendPoint {
  date: string;
  dayLabel: string;
  avgReadiness: number;
  avgSleep: number;
  avgSoreness: number;
  avgFatigue: number;
  avgStress: number;
  avgHR: number;
}

export function generateWellnessTrendData(
  wellnessLogs: WellnessLog[],
  daysCount: number = 7
): WellnessTrendPoint[] {
  const result: WellnessTrendPoint[] = [];
  const baseDate = new Date('2026-11-06T12:00:00Z');

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

    // Logs for this specific day
    const dayLogs = wellnessLogs.filter((w) => w.date === dateStr);
    
    let readiness = 82;
    let sleep = 4.2;
    let soreness = 2.1;
    let fatigue = 2.3;
    let stress = 2.0;
    let hr = 53;

    if (dayLogs.length > 0) {
      readiness = Math.round(dayLogs.reduce((acc, curr) => acc + curr.readinessScore, 0) / dayLogs.length);
      sleep = +(dayLogs.reduce((acc, curr) => acc + curr.sleepQuality, 0) / dayLogs.length).toFixed(1);
      soreness = +(dayLogs.reduce((acc, curr) => acc + curr.muscleSoreness, 0) / dayLogs.length).toFixed(1);
      fatigue = +(dayLogs.reduce((acc, curr) => acc + curr.fatigue, 0) / dayLogs.length).toFixed(1);
      stress = +(dayLogs.reduce((acc, curr) => acc + curr.stressLevel, 0) / dayLogs.length).toFixed(1);
      hr = Math.round(dayLogs.reduce((acc, curr) => acc + (curr.restingHR || 54), 0) / dayLogs.length);
    } else {
      // Natural variation
      const wave = Math.sin(i * 0.9);
      readiness = Math.round(78 + wave * 6);
      sleep = +(4.0 + wave * 0.3).toFixed(1);
      soreness = +(2.4 - wave * 0.4).toFixed(1);
      fatigue = +(2.5 - wave * 0.5).toFixed(1);
      hr = Math.round(54 - wave * 2);
    }

    result.push({
      date: dateStr,
      dayLabel,
      avgReadiness: readiness,
      avgSleep: sleep,
      avgSoreness: soreness,
      avgFatigue: fatigue,
      avgStress: stress,
      avgHR: hr,
    });
  }

  return result;
}

export interface AthleteRiskAlert {
  athlete: Athlete;
  isAcwrAlert: boolean;
  acwrType: 'high' | 'low' | null;
  acwrRatio: number;
  isPainAlert: boolean;
  highPainPoints: BodyPainPoint[];
  maxPainLevel: number;
  alertSummary: string[];
  severity: 'critical' | 'warning';
}

export function isRecent24h(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 24) return true;
    
    // Check calendar date match
    const todayStr = now.toISOString().slice(0, 10);
    if (dateStr.slice(0, 10) === todayStr) return true;

    // Check if within 48h
    if (diffHours <= 48) return true;
  } catch (e) {
    // fallback
  }
  return false;
}

export function evaluateAthleteAlerts(
  athletes: Athlete[],
  painPoints: BodyPainPoint[]
): AthleteRiskAlert[] {
  const alerts: AthleteRiskAlert[] = [];

  for (const athlete of athletes) {
    // 1. Check ACWR outside optimal (0.8 - 1.3)
    const isAcwrHigh = athlete.acwr > 1.3;
    const isAcwrLow = athlete.acwr < 0.8;
    const isAcwrAlert = isAcwrHigh || isAcwrLow;
    const acwrType = isAcwrHigh ? 'high' : isAcwrLow ? 'low' : null;

    // 2. Check high pain level (> 5) in last 24h or active pain
    const athletePains = painPoints.filter((p) => p.athleteId === athlete.id);
    const highPainPoints = athletePains.filter((p) => {
      if (p.painLevel <= 5) return false;
      // Pain level > 5. Check if reported in last 24h, or status is 'Akut', or recent date
      return isRecent24h(p.reportedDate) || p.status === 'Akut';
    });

    const isPainAlert = highPainPoints.length > 0;
    const maxPainLevel = highPainPoints.reduce((max, p) => Math.max(max, p.painLevel), 0);

    if (isAcwrAlert || isPainAlert) {
      const alertSummary: string[] = [];

      if (isAcwrHigh) {
        if (athlete.acwr > 1.5) {
          alertSummary.push(`ACWR Kritis ${athlete.acwr.toFixed(2)}: Zona Bahaya Cedera (> 1.5)`);
        } else {
          alertSummary.push(`ACWR Meningkat ${athlete.acwr.toFixed(2)}: Waspada Lonjakan Beban (> 1.3)`);
        }
      } else if (isAcwrLow) {
        alertSummary.push(`ACWR Rendah ${athlete.acwr.toFixed(2)}: Under-Training (< 0.8 - Risiko Beban Mendadak)`);
      }

      if (isPainAlert) {
        const locations = highPainPoints.map((p) => `${p.location} (VAS ${p.painLevel}/10)`).join(', ');
        alertSummary.push(`Nyeri Tinggi > 5: ${locations}`);
      }

      const severity: 'critical' | 'warning' =
        athlete.acwr > 1.5 || maxPainLevel >= 7 ? 'critical' : 'warning';

      alerts.push({
        athlete,
        isAcwrAlert,
        acwrType,
        acwrRatio: athlete.acwr,
        isPainAlert,
        highPainPoints,
        maxPainLevel,
        alertSummary,
        severity,
      });
    }
  }

  // Sort critical first, then highest ACWR divergence or highest pain
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return b.maxPainLevel - a.maxPainLevel;
  });
}

