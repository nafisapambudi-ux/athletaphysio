import { JumpMeasurementRecord, VBTSessionRecord } from '../types/athlete';

// Calculate Jump Height from Flight Time (Bosco Formula)
// h = (g * t^2) / 8 where g = 9.81 m/s^2, t in seconds, h in cm
export function calculateJumpFromFlightTime(flightTimeMs: number): {
  heightCm: number;
  takeoffVelocity: number;
} {
  const t = flightTimeMs / 1000;
  const heightMeters = (9.81 * t * t) / 8;
  const heightCm = +(heightMeters * 100).toFixed(1);
  const takeoffVelocity = +( (9.81 * t) / 2 ).toFixed(2);
  return { heightCm, takeoffVelocity };
}

// Sayers Equation for Peak Mechanical Power (Watts)
// Peak Power = 60.7 * JumpHeight(cm) + 45.3 * BodyMass(kg) - 2055
export function calculateSayersPeakPower(jumpHeightCm: number, bodyMassKg: number): number {
  const power = 60.7 * jumpHeightCm + 45.3 * bodyMassKg - 2055;
  return Math.round(Math.max(500, power));
}

// Reactive Strength Index (RSI) for Drop Jump or fast stretch-shortening cycle
// RSI = Jump Height (m) / Contact Time (s)
export function calculateRSI(jumpHeightCm: number, contactTimeMs: number): number {
  if (!contactTimeMs || contactTimeMs <= 0) return 0;
  const heightM = jumpHeightCm / 100;
  const contactS = contactTimeMs / 1000;
  return +(heightM / contactS).toFixed(2);
}

// VBT Velocity Zones (González-Badillo & Sánchez-Medina)
export function getVBTZone(meanVelocity: number): {
  zone: 'Kecepatan Murni (>1.0 m/s)' | 'Speed-Strength (0.75-1.0 m/s)' | 'Strength-Speed (0.5-0.75 m/s)' | 'Kekuatan Maksimal (<0.5 m/s)';
  intensityPct1RM: string;
  badgeColor: string;
  description: string;
} {
  if (meanVelocity >= 1.0) {
    return {
      zone: 'Kecepatan Murni (>1.0 m/s)',
      intensityPct1RM: '< 40% 1RM',
      badgeColor: 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400',
      description: 'Latihan kecepatan gerak maksimal, stimulasi rekruitmen motor unit cepat tanpa kelelahan.',
    };
  }
  if (meanVelocity >= 0.75) {
    return {
      zone: 'Speed-Strength (0.75-1.0 m/s)',
      intensityPct1RM: '40% - 60% 1RM',
      badgeColor: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      description: 'Zona daya ledak optimal (optimal power zone). Kecepatan tinggi dengan beban moderat.',
    };
  }
  if (meanVelocity >= 0.50) {
    return {
      zone: 'Strength-Speed (0.5-0.75 m/s)',
      intensityPct1RM: '60% - 80% 1RM',
      badgeColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      description: 'Zona kekuatan dinamis. Beban berat digerakkan dengan akselerasi maksimal.',
    };
  }
  return {
    zone: 'Kekuatan Maksimal (<0.5 m/s)',
    intensityPct1RM: '> 80% 1RM',
    badgeColor: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
    description: 'Zona hipertrofi tinggi dan adaptasi saraf kekuatan maksimal mendekati 1RM.',
  };
}

// Estimate 1RM from Load (kg) and Mean Velocity (m/s) for Squat/Bench
// %1RM = -59.53 * velocity + 112.5 (Standard load-velocity profile regression)
export function estimate1RMFromVBT(loadKg: number, meanVelocity: number): number {
  if (meanVelocity <= 0.2) return loadKg;
  const pct1RM = Math.min(100, Math.max(30, -59.53 * meanVelocity + 112.5));
  const estimated1RM = (loadKg / pct1RM) * 100;
  return Math.round(estimated1RM);
}

// Web Audio API Synthesizer for instant audible feedback during camera/sensor tests
class SportsAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTakeoffBeep() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 high beep
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay restrictions catch
    }
  }

  playLandingBeep() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5 landing chime
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playRepSuccessBeep() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playFatigueWarningBuzz() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime); // Low warning buzz
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {}
  }
}

export const sportsAudio = new SportsAudioSynthesizer();

// Initial seed jump records
export const initialJumpRecords: JumpMeasurementRecord[] = [
  {
    id: 'jmp-01',
    athleteId: 'atl-06',
    date: '2026-11-06',
    jumpType: 'CMJ (Countermovement Jump)',
    method: 'Kamera (Flight Time)',
    jumpHeightCm: 74.2,
    flightTimeMs: 778,
    takeoffVelocity: 3.82,
    peakPowerWatts: 4720,
    eccentricDepthCm: 32.5,
    notes: 'Pendaratan stabil, ekstensi triple joint sempurna.',
  },
  {
    id: 'jmp-02',
    athleteId: 'atl-02',
    date: '2026-11-05',
    jumpType: 'CMJ (Countermovement Jump)',
    method: 'Sensor Akselerometer HP',
    jumpHeightCm: 68.5,
    flightTimeMs: 747,
    takeoffVelocity: 3.67,
    peakPowerWatts: 4380,
    eccentricDepthCm: 28.0,
    notes: 'Daya ledak akselerasi tinggi, waktu deselerasi sangat singkat.',
  },
  {
    id: 'jmp-03',
    athleteId: 'atl-04',
    date: '2026-11-04',
    jumpType: 'CMJ (Countermovement Jump)',
    method: 'Kamera (Flight Time)',
    jumpHeightCm: 61.4,
    flightTimeMs: 708,
    takeoffVelocity: 3.47,
    peakPowerWatts: 3950,
    eccentricDepthCm: 35.0,
    notes: 'Terlihat sedikit kehati-hatian pada knee flexion lutut kanan.',
  },
];

// Initial seed VBT records
export const initialVBTRecords: VBTSessionRecord[] = [
  {
    id: 'vbt-01',
    athleteId: 'atl-01',
    date: '2026-11-06',
    exercise: 'Back Squat',
    loadKg: 85,
    reps: [
      { repNumber: 1, meanVelocity: 0.82, peakVelocity: 1.15, velocityLoss: 0, peakPowerWatts: 820, concentricDurationMs: 450, quality: 'Optimal' },
      { repNumber: 2, meanVelocity: 0.80, peakVelocity: 1.12, velocityLoss: 2.4, peakPowerWatts: 805, concentricDurationMs: 460, quality: 'Optimal' },
      { repNumber: 3, meanVelocity: 0.76, peakVelocity: 1.08, velocityLoss: 7.3, peakPowerWatts: 770, concentricDurationMs: 480, quality: 'Optimal' },
      { repNumber: 4, meanVelocity: 0.72, peakVelocity: 1.02, velocityLoss: 12.2, peakPowerWatts: 740, concentricDurationMs: 510, quality: 'Warning' },
      { repNumber: 5, meanVelocity: 0.68, peakVelocity: 0.96, velocityLoss: 17.1, peakPowerWatts: 700, concentricDurationMs: 540, quality: 'Warning' },
    ],
    meanVelocityAvg: 0.76,
    estimated1RM: 126,
    targetZone: 'Speed-Strength (0.75-1.0 m/s)',
    velocityLossCutoffPercent: 15,
    notes: 'Repetisi ke-5 dihentikan karena mencapai batas ambang velocity loss 15% untuk mencegah kelelahan neuromuskular.',
  },
  {
    id: 'vbt-02',
    athleteId: 'atl-06',
    date: '2026-11-05',
    exercise: 'Trap Bar Deadlift',
    loadKg: 110,
    reps: [
      { repNumber: 1, meanVelocity: 0.68, peakVelocity: 0.98, velocityLoss: 0, peakPowerWatts: 1120, concentricDurationMs: 510, quality: 'Optimal' },
      { repNumber: 2, meanVelocity: 0.66, peakVelocity: 0.95, velocityLoss: 2.9, peakPowerWatts: 1090, concentricDurationMs: 520, quality: 'Optimal' },
      { repNumber: 3, meanVelocity: 0.62, peakVelocity: 0.91, velocityLoss: 8.8, peakPowerWatts: 1040, concentricDurationMs: 550, quality: 'Optimal' },
      { repNumber: 4, meanVelocity: 0.58, peakVelocity: 0.85, velocityLoss: 14.7, peakPowerWatts: 980, concentricDurationMs: 580, quality: 'Warning' },
    ],
    meanVelocityAvg: 0.64,
    estimated1RM: 148,
    targetZone: 'Strength-Speed (0.5-0.75 m/s)',
    velocityLossCutoffPercent: 15,
    notes: 'Power output tinggi pada rep 1-3. Pemulihan inter-set 3 menit.',
  },
];
