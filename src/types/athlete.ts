export type SportType = 
  | 'Sepak Bola'
  | 'Atletik (Sprint)'
  | 'Bola Basket'
  | 'Bulutangkis'
  | 'Renang'
  | 'Bola Voli'
  | 'Futsal'
  | 'Pencak Silat'
  | 'Lainnya';

export type PhysicalStatus = 'Fit' | 'Observasi' | 'Modifikasi' | 'Pemulihan';

export interface Athlete {
  id: string;
  name: string;
  sport: SportType;
  position: string;
  age: number;
  gender: 'Putra' | 'Putri';
  height: number; // in cm
  weight: number; // in kg
  bodyFat: number; // in %
  restingHeartRate: number; // in bpm
  status: PhysicalStatus;
  readinessScore: number; // 0 - 100%
  acwr: number; // e.g., 1.15
  acuteLoad: number; // 7-day average load in AU
  chronicLoad: number; // 28-day average load in AU
  avatarUrl?: string;
  notes?: string;
}

export interface TrainingSessionLog {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  sessionType: 'Kekuatan & Beban' | 'Kondisi Kardio & Aerobik' | 'Kecepatan & Akselerasi' | 'Kelincahan & Taktik' | 'Pemulihan Aktif';
  durationMinutes: number;
  rpe: number; // 1 - 10 (Borg CR10)
  sRPE: number; // duration * rpe
  notes: string;
}

export interface WellnessLog {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  sleepQuality: number; // 1-5 (5 = sangat baik)
  sleepHours: number;
  muscleSoreness: number; // 1-5 (1 = bugar tanpa nyeri, 5 = sangat nyeri/pegal)
  fatigue: number; // 1-5 (1 = sangat bertenaga, 5 = kelelahan berat)
  stressLevel: number; // 1-5 (1 = sangat rileks, 5 = stres tinggi)
  mood: number; // 1-5 (5 = sangat positif/termotivasi)
  restingHR: number; // bpm
  readinessScore: number; // 0-100 calculated
  notes: string;
}

export interface FitnessTestRecord {
  id: string;
  athleteId: string;
  date: string;
  testName: string;
  category: 'Daya Tahan Kardiovaskular' | 'Kecepatan' | 'Kelincahan' | 'Daya Ledak' | 'Kekuatan Otot' | 'Kelentukan';
  value: number;
  unit: string;
  normGrade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang' | 'Sangat Kurang';
  percentile: number;
  notes?: string;
}

export interface BodyPainPoint {
  id: string;
  athleteId: string;
  location: string;
  view: 'anterior' | 'posterior'; // depan atau belakang
  painLevel: number; // 1 - 10 (VAS)
  status: 'Akut' | 'Sub-akut' | 'Pemulihan' | 'Pulih';
  reportedDate: string;
  notes: string;
}

export interface AIAnalysisResult {
  overallStatus: string;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  workloadInsights: string;
  loadPrescription: string;
  recoveryProtocols: string[];
  injuryConsiderations: string;
  suggestedTarget: string;
}

export interface JumpMeasurementRecord {
  id: string;
  athleteId: string;
  date: string;
  jumpType: 'CMJ (Countermovement Jump)' | 'SJ (Squat Jump)' | 'DJ (Drop Jump)';
  method: 'Kamera (Flight Time)' | 'Sensor Akselerometer HP';
  jumpHeightCm: number;
  flightTimeMs: number;
  takeoffVelocity: number; // in m/s
  peakPowerWatts: number; // in W
  contactTimeMs?: number;
  rsi?: number; // Reactive Strength Index
  eccentricDepthCm?: number;
  notes?: string;
}

export interface VBTRepData {
  repNumber: number;
  meanVelocity: number; // in m/s
  peakVelocity: number; // in m/s
  velocityLoss: number; // in %
  peakPowerWatts: number;
  concentricDurationMs: number;
  quality: 'Optimal' | 'Warning' | 'Fatigued';
}

export interface VBTSessionRecord {
  id: string;
  athleteId: string;
  date: string;
  exercise: string;
  loadKg: number;
  reps: VBTRepData[];
  meanVelocityAvg: number;
  estimated1RM: number;
  targetZone: 'Kecepatan Murni (>1.0 m/s)' | 'Speed-Strength (0.75-1.0 m/s)' | 'Strength-Speed (0.5-0.75 m/s)' | 'Kekuatan Maksimal (<0.5 m/s)';
  velocityLossCutoffPercent: number;
  notes?: string;
}

export type GoalMetricType = 
  | 'jump_height'      // e.g. Target Jump Height (cm)
  | 'vbt_velocity'     // e.g. Target Mean Concentric Velocity (m/s)
  | 'vo2_max'          // e.g. Target VO2 Max (ml/kg/min)
  | 'sprint_speed'     // e.g. Target Sprint 20m/30m (detik - lower is better)
  | 'squat_1rm'        // e.g. Estimated 1RM (kg)
  | 'readiness_target';// e.g. Target Readiness Score (%)

export interface PerformanceGoal {
  id: string;
  athleteId: string;
  metricType: GoalMetricType;
  title: string;
  exerciseName?: string; // e.g. "Barbell Back Squat @ 70kg"
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  unit: string;
  higherIsBetter: boolean;
  deadlineDate?: string;
  category: 'Daya Ledak & Lompatan' | 'Kecepatan & VBT' | 'Kapasitas Kardio' | 'Kekuatan Beban' | 'Kesiapan & Wellness';
  status: 'In Progress' | 'Achieved' | 'Needs Attention';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
}


