import React, { useState, useEffect, useRef } from 'react';
import { Athlete, JumpMeasurementRecord, VBTSessionRecord, VBTRepData, PerformanceGoal, GoalMetricType } from '../types/athlete';
import {
  calculateJumpFromFlightTime,
  calculateSayersPeakPower,
  getVBTZone,
  estimate1RMFromVBT,
  sportsAudio,
} from '../utils/jumpAndVBT';
import {
  Zap,
  Camera,
  Smartphone,
  Trophy,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Award,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface JumpAndVBTTrackerProps {
  athletes: Athlete[];
  jumpRecords: JumpMeasurementRecord[];
  vbtRecords: VBTSessionRecord[];
  goals?: PerformanceGoal[];
  onAddJumpRecord?: (record: JumpMeasurementRecord) => void;
  onAddVBTRecord?: (record: VBTSessionRecord) => Promise<'cloud' | 'local'> | 'cloud' | 'local';
  onUpdateGoalCurrentValue?: (athleteId: string, metricType: GoalMetricType, newValue: number) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
}

const createRecordId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

interface MotionVector {
  x: number;
  y: number;
  z: number;
}

interface VBTRepDetection {
  phase: 'waiting' | 'lifting';
  lastTimestamp: number | null;
  startTimestamp: number;
  velocity: number;
  peakVelocity: number;
  displacement: number;
  previousAcceleration: number;
  positiveAccelerationSamples: number;
  lowVelocityStartedAt: number | null;
  lowVelocityStartDisplacement: number | null;
}

const createVBTRepDetection = (timestamp: number, acceleration: number): VBTRepDetection => ({
  phase: 'waiting',
  lastTimestamp: timestamp,
  startTimestamp: timestamp,
  velocity: 0,
  peakVelocity: 0,
  displacement: 0,
  previousAcceleration: acceleration,
  positiveAccelerationSamples: 0,
  lowVelocityStartedAt: null,
  lowVelocityStartDisplacement: null,
});

const isMotionVector = (
  value: DeviceMotionEventAcceleration | null
): value is DeviceMotionEventAcceleration & MotionVector =>
  value !== null
  && [value.x, value.y, value.z].every((component) => component !== null && Number.isFinite(component));

const averageVector = (vectors: MotionVector[]): MotionVector =>
  vectors.reduce(
    (average, vector) => ({
      x: average.x + vector.x / vectors.length,
      y: average.y + vector.y / vectors.length,
      z: average.z + vector.z / vectors.length,
    }),
    { x: 0, y: 0, z: 0 }
  );

const VBT_GAUGE_CENTER_X = 130;
const VBT_GAUGE_CENTER_Y = 140;
const VBT_GAUGE_MAX_VELOCITY = 1.5;
const VBT_REP_SETTLE_MS = 60;
const VBT_REP_START_ACCELERATION = 0.7;
const VBT_REP_FAST_START_ACCELERATION = 2;

const describeVBTGaugeArc = (startVelocity: number, endVelocity: number, radius: number) => {
  const startAngle = Math.PI - (startVelocity / VBT_GAUGE_MAX_VELOCITY) * Math.PI;
  const endAngle = Math.PI - (endVelocity / VBT_GAUGE_MAX_VELOCITY) * Math.PI;
  const startX = VBT_GAUGE_CENTER_X + radius * Math.cos(startAngle);
  const startY = VBT_GAUGE_CENTER_Y - radius * Math.sin(startAngle);
  const endX = VBT_GAUGE_CENTER_X + radius * Math.cos(endAngle);
  const endY = VBT_GAUGE_CENTER_Y - radius * Math.sin(endAngle);

  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
};

export const JumpAndVBTTracker: React.FC<JumpAndVBTTrackerProps> = ({
  athletes,
  jumpRecords,
  vbtRecords,
  goals = [],
  onAddJumpRecord,
  onAddVBTRecord,
  onUpdateGoalCurrentValue,
  onSelectAthleteDetail,
}) => {
  // Main Module View: 'jump' (Vertical Jump / CMJ) or 'vbt' (Velocity Based Training)
  const [activeModule, setActiveModule] = useState<'jump' | 'vbt'>('jump');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athletes[0]?.id || '');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Jump Measurement State
  const [jumpMethod, setJumpMethod] = useState<'camera' | 'sensor'>('camera');
  const [jumpType, setJumpType] = useState<JumpMeasurementRecord['jumpType']>('CMJ (Countermovement Jump)');
  const jumpHistory = jumpRecords;

  // Jump Camera / Video Tracking State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [jumpPhase, setJumpPhase] = useState<'idle' | 'ready' | 'airborne' | 'landed'>('idle');
  const [measuredFlightTimeMs, setMeasuredFlightTimeMs] = useState<number>(0);
  const [measuredJumpHeightCm, setMeasuredJumpHeightCm] = useState<number>(0);
  const [measuredPeakPowerWatts, setMeasuredPeakPowerWatts] = useState<number>(0);
  const [measuredTakeoffVel, setMeasuredTakeoffVel] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Jump Sensor (DeviceMotion) State
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [currentAccelMag, setCurrentAccelMag] = useState<number>(1.0); // in G

  // Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const jumpPhaseRef = useRef(jumpPhase);
  const takeoffTimestampRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const vbtCalibrationRef = useRef<{
    gravitySamples: MotionVector[];
    linearSamples: MotionVector[];
    sampleTimestamps: number[];
  } | null>(null);
  const vbtGravityAxisRef = useRef<MotionVector | null>(null);
  const vbtGravityBaselineRef = useRef<MotionVector | null>(null);
  const vbtLinearBaselineRef = useRef<MotionVector | null>(null);
  const vbtRepDetectionRef = useRef<VBTRepDetection | null>(null);
  const vbtRepsRef = useRef<VBTRepData[]>([]);
  const vbtCalibrationTimeoutRef = useRef<number | null>(null);
  const vbtSampleTimestampsRef = useRef<number[]>([]);
  const vbtSampleRateRef = useRef(0);
  const vbtSampleEventsRef = useRef(0);

  // VBT State
  const [vbtExercise, setVbtExercise] = useState<string>('Back Squat');
  const [vbtLoadKg, setVbtLoadKg] = useState<number>(80);
  const [vbtCutoffPercent, setVbtCutoffPercent] = useState<number>(15);
  const [vbtProtocolNote, setVbtProtocolNote] = useState('Rentang gerak standar; konsentrik dengan intent maksimal.');
  const [vbtMountConfirmed, setVbtMountConfirmed] = useState(false);
  const [vbtAreaClear, setVbtAreaClear] = useState(false);
  const vbtHistory = vbtRecords;
  const [currentVBTSetReps, setCurrentVBTSetReps] = useState<VBTRepData[]>([]);
  const [liveConcentricVelocity, setLiveConcentricVelocity] = useState<number>(0.0);
  const [vbtRepInProgress, setVbtRepInProgress] = useState(false);
  const [vbtSensorActive, setVbtSensorActive] = useState(false);
  const [vbtCalibrating, setVbtCalibrating] = useState(false);
  const [vbtCalibrationSampleCount, setVbtCalibrationSampleCount] = useState(0);
  const [vbtReady, setVbtReady] = useState(false);
  const [vbtRecording, setVbtRecording] = useState(false);
  const [vbtSensorError, setVbtSensorError] = useState<string | null>(null);
  const [vbtSampleRateHz, setVbtSampleRateHz] = useState(0);
  const [vbtSaveStatus, setVbtSaveStatus] = useState<'idle' | 'saving' | 'local' | 'cloud' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentAthlete = athletes.find((a) => a.id === selectedAthleteId) || athletes[0];
  const lastVBTRep = currentVBTSetReps[currentVBTSetReps.length - 1];
  const speedometerVelocity = vbtRepInProgress
    ? liveConcentricVelocity
    : lastVBTRep?.meanVelocity ?? 0;
  const vbtGaugeRatio = Math.min(1, Math.max(0, speedometerVelocity / VBT_GAUGE_MAX_VELOCITY));
  const vbtNeedleAngle = 180 - vbtGaugeRatio * 180;
  const athleteRef = useRef(currentAthlete);
  const vbtTrendData = vbtHistory
    .filter((session) =>
      session.athleteId === selectedAthleteId
      && session.exercise === vbtExercise
      && session.measurementMethod === 'phone_accelerometer_estimate'
    )
    .sort((a, b) =>
      (a.recordedAt || a.date).localeCompare(b.recordedAt || b.date)
      || a.id.localeCompare(b.id)
    )
    .slice(-12)
    .map((session, index) => ({
      session: `${session.date.slice(5)}${session.recordedAt
        ? ` ${new Date(session.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
        : ''} #${index + 1}`,
      meanVelocityAvg: session.meanVelocityAvg,
    }));

  useEffect(() => {
    jumpPhaseRef.current = jumpPhase;
  }, [jumpPhase]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    athleteRef.current = currentAthlete;
  }, [currentAthlete]);

  // Handle Camera Startup & Teardown
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraActive, cameraFacing]);

  useEffect(() => {
    if (!sensorActive || activeModule !== 'jump' || jumpMethod !== 'sensor') return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.acceleration;
      const accelerationWithGravity = event.accelerationIncludingGravity;
      const hasLinearAcceleration = acceleration
        && [acceleration.x, acceleration.y, acceleration.z].every((value) => value !== null && Number.isFinite(value));
      const acc = hasLinearAcceleration
        ? acceleration
        : accelerationWithGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const magnitudeG = magnitude / 9.81;
      setCurrentAccelMag(+magnitudeG.toFixed(2));

      if (jumpPhaseRef.current === 'ready' && magnitudeG < 0.35) {
        const takeoffAt = performance.now();
        takeoffTimestampRef.current = takeoffAt;
        jumpPhaseRef.current = 'airborne';
        setJumpPhase('airborne');
        if (soundEnabledRef.current) sportsAudio.playTakeoffBeep();
      } else if (jumpPhaseRef.current === 'airborne' && magnitudeG > 2.4) {
        const takeoffAt = takeoffTimestampRef.current;
        if (takeoffAt !== null) {
          const flightMs = Math.round(performance.now() - takeoffAt);
          if (flightMs >= 200 && flightMs <= 1100) {
            processJumpResults(flightMs, 'Sensor Akselerometer HP');
          } else {
            setToastMessage('Durasi lompatan sensor tidak valid. Ulangi tes dengan posisi HP terpasang stabil.');
          }
          takeoffTimestampRef.current = null;
        }
        jumpPhaseRef.current = 'landed';
        setJumpPhase('landed');
        if (soundEnabledRef.current) sportsAudio.playLandingBeep();
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [activeModule, sensorActive, jumpMethod]);

  useEffect(() => {
    if (!vbtSensorActive || activeModule !== 'vbt') return;

    const handleVBTMotion = (event: DeviceMotionEvent) => {
      const gravity = event.accelerationIncludingGravity;
      const linearAcceleration = event.acceleration;
      if (!isMotionVector(gravity)) return;

      if (vbtCalibrating) {
        const calibration = vbtCalibrationRef.current;
        if (!calibration) return;

        calibration.sampleTimestamps.push(performance.now());
        calibration.gravitySamples.push(gravity);
        if (isMotionVector(linearAcceleration)) {
          calibration.linearSamples.push(linearAcceleration);
        }
        const calibrationElapsedMs =
          calibration.sampleTimestamps.at(-1)! - calibration.sampleTimestamps[0];
        if (calibration.gravitySamples.length % 10 === 0) {
          setVbtCalibrationSampleCount(calibration.gravitySamples.length);
        }
        if (calibration.gravitySamples.length < 40 || calibrationElapsedMs < 1500) return;

        const gravityBaseline = averageVector(calibration.gravitySamples);
        const gravityMagnitude = Math.hypot(gravityBaseline.x, gravityBaseline.y, gravityBaseline.z);
        const gravityVectorDeviation = Math.sqrt(
          calibration.gravitySamples.reduce((sum, sample) => {
            return sum
              + (sample.x - gravityBaseline.x) ** 2
              + (sample.y - gravityBaseline.y) ** 2
              + (sample.z - gravityBaseline.z) ** 2;
          }, 0) / calibration.gravitySamples.length
        );
        if (gravityMagnitude < 7 || gravityMagnitude > 12 || gravityVectorDeviation > 0.8) {
          vbtCalibrationRef.current = null;
          if (vbtCalibrationTimeoutRef.current !== null) {
            window.clearTimeout(vbtCalibrationTimeoutRef.current);
            vbtCalibrationTimeoutRef.current = null;
          }
          setVbtCalibrating(false);
          setVbtCalibrationSampleCount(0);
          setVbtSensorError('Kalibrasi tidak stabil. Tahan HP diam pada posisi awal setidaknya 2 detik lalu ulangi.');
          return;
        }

        vbtGravityBaselineRef.current = gravityBaseline;
        vbtGravityAxisRef.current = {
          x: gravityBaseline.x / gravityMagnitude,
          y: gravityBaseline.y / gravityMagnitude,
          z: gravityBaseline.z / gravityMagnitude,
        };
        vbtLinearBaselineRef.current = calibration.linearSamples.length >= 30
          ? averageVector(calibration.linearSamples)
          : null;
        const calibrationDurationMs = calibrationElapsedMs;
        const sampleRateHz = calibrationDurationMs > 0
          ? (calibration.sampleTimestamps.length - 1) / (calibrationDurationMs / 1000)
          : 0;
        const roundedSampleRate = Math.round(sampleRateHz);
        vbtSampleRateRef.current = roundedSampleRate;
        setVbtSampleRateHz(roundedSampleRate);
        vbtSampleTimestampsRef.current = [];
        vbtSampleEventsRef.current = 0;
        vbtCalibrationRef.current = null;
        if (vbtCalibrationTimeoutRef.current !== null) {
          window.clearTimeout(vbtCalibrationTimeoutRef.current);
          vbtCalibrationTimeoutRef.current = null;
        }
        setVbtCalibrating(false);
        setVbtCalibrationSampleCount(0);
        setVbtReady(true);
        setVbtSensorError(null);
        return;
      }

      if (!vbtRecording) return;

      const gravityBaseline = vbtGravityBaselineRef.current;
      const gravityAxis = vbtGravityAxisRef.current;
      if (!gravityBaseline || !gravityAxis) return;

      const now = performance.now();
      const sampleTimestamps = vbtSampleTimestampsRef.current;
      sampleTimestamps.push(now);
      if (sampleTimestamps.length > 30) sampleTimestamps.shift();
      vbtSampleEventsRef.current += 1;
      if (sampleTimestamps.length >= 10 && vbtSampleEventsRef.current % 10 === 0) {
        const windowDurationMs = sampleTimestamps.at(-1)! - sampleTimestamps[0];
        if (windowDurationMs > 0) {
          const sampleRateHz = Math.round((sampleTimestamps.length - 1) / (windowDurationMs / 1000));
          vbtSampleRateRef.current = sampleRateHz;
          setVbtSampleRateHz(sampleRateHz);
        }
      }

      const accelerationBaseline = isMotionVector(linearAcceleration)
        ? vbtLinearBaselineRef.current
        : gravityBaseline;
      const measuredAcceleration = isMotionVector(linearAcceleration)
        ? linearAcceleration
        : gravity;
      const baseline = accelerationBaseline ?? { x: 0, y: 0, z: 0 };
      const verticalAcceleration = (
        (measuredAcceleration.x - baseline.x) * gravityAxis.x
        + (measuredAcceleration.y - baseline.y) * gravityAxis.y
        + (measuredAcceleration.z - baseline.z) * gravityAxis.z
      );
      let detection = vbtRepDetectionRef.current;

      if (!detection) {
        detection = createVBTRepDetection(now, verticalAcceleration);
        vbtRepDetectionRef.current = detection;
      }

      if (detection.phase === 'waiting') {
        detection.positiveAccelerationSamples = verticalAcceleration > VBT_REP_START_ACCELERATION
          ? detection.positiveAccelerationSamples + 1
          : 0;
        const fastStart = verticalAcceleration > VBT_REP_FAST_START_ACCELERATION;
        if (detection.positiveAccelerationSamples < 2 && !fastStart) {
          detection.previousAcceleration = verticalAcceleration;
          detection.lastTimestamp = now;
          return;
        }

        const sampleIntervalMs = event.interval > 0 ? Math.min(event.interval, 100) : 1000 / 60;
        detection.phase = 'lifting';
        setVbtRepInProgress(true);
        detection.startTimestamp = now - sampleIntervalMs;
        detection.lastTimestamp = now - sampleIntervalMs;
        detection.velocity = 0;
        detection.peakVelocity = 0;
        detection.displacement = 0;
        detection.lowVelocityStartedAt = null;
        detection.lowVelocityStartDisplacement = null;
      }

      const elapsedMs = detection.lastTimestamp === null ? 0 : now - detection.lastTimestamp;
      if (elapsedMs <= 0 || elapsedMs > 150) {
        setVbtRepInProgress(false);
        vbtRepDetectionRef.current = createVBTRepDetection(now, verticalAcceleration);
        setVbtSensorError('Data sensor terputus sesaat. Rep direset agar hasil tidak dihitung dari sampel yang hilang.');
        return;
      }

      const dt = elapsedMs / 1000;
      const previousAcceleration = detection.previousAcceleration;
      const averageAcceleration = (previousAcceleration + verticalAcceleration) / 2;
      detection.velocity = Math.max(0, detection.velocity + averageAcceleration * dt);
      detection.peakVelocity = Math.max(detection.peakVelocity, detection.velocity);
      detection.displacement += detection.velocity * dt;
      detection.previousAcceleration = verticalAcceleration;
      detection.lastTimestamp = now;
      setLiveConcentricVelocity(+detection.velocity.toFixed(2));

      const durationMs = now - detection.startTimestamp;
      const isSettled = detection.velocity < 0.12 && verticalAcceleration < 0.5;
      if (isSettled) {
        if (detection.lowVelocityStartedAt === null) {
          detection.lowVelocityStartedAt = now;
          detection.lowVelocityStartDisplacement = detection.displacement;
        }
      } else {
        detection.lowVelocityStartedAt = null;
        detection.lowVelocityStartDisplacement = null;
      }

      if (durationMs >= 4000 && detection.lowVelocityStartedAt === null) {
        setVbtRepInProgress(false);
        vbtRepDetectionRef.current = createVBTRepDetection(now, verticalAcceleration);
        setLiveConcentricVelocity(0);
        setVbtSensorError('Gerakan melebihi 4 detik tanpa fase berhenti yang jelas. Rep dibuang; periksa posisi sensor dan ulangi.');
        return;
      }

      if (
        detection.lowVelocityStartedAt === null
        || now - detection.lowVelocityStartedAt < VBT_REP_SETTLE_MS
      ) return;

      const concentricDurationMs = detection.lowVelocityStartedAt - detection.startTimestamp;
      if (concentricDurationMs < 500) {
        setVbtRepInProgress(false);
        vbtRepDetectionRef.current = createVBTRepDetection(now, verticalAcceleration);
        setLiveConcentricVelocity(0);
        setVbtSensorError('Gerakan terlalu singkat untuk estimasi rep yang layak. Ulangi dengan gerakan penuh dan terkontrol.');
        return;
      }

      const concentricDisplacement = detection.lowVelocityStartDisplacement ?? detection.displacement;
      const meanVelocity = concentricDisplacement / (concentricDurationMs / 1000);
      const peakVelocity = detection.peakVelocity;
      vbtRepDetectionRef.current = createVBTRepDetection(now, 0);

      if (meanVelocity < 0.05 || peakVelocity < 0.1 || meanVelocity > 5 || peakVelocity > 10) {
        setVbtRepInProgress(false);
        setLiveConcentricVelocity(0);
        setVbtSensorError('Estimasi gerak tidak masuk batas yang masuk akal. Pastikan HP terpasang kuat dan ulangi setelah kalibrasi.');
        return;
      }

      const reps = vbtRepsRef.current;
      const fastestVelocity = Math.max(meanVelocity, ...reps.map((rep) => rep.meanVelocity));
      const velocityLoss = +(((fastestVelocity - meanVelocity) / fastestVelocity) * 100).toFixed(1);
      const isWarning = velocityLoss >= vbtCutoffPercent;
      const newRep: VBTRepData = {
        repNumber: reps.length + 1,
        meanVelocity: +meanVelocity.toFixed(2),
        peakVelocity: +peakVelocity.toFixed(2),
        velocityLoss,
        concentricDurationMs: Math.round(concentricDurationMs),
        quality: isWarning ? 'Warning' : 'Optimal',
      };

      vbtRepsRef.current = [...reps, newRep];
      setCurrentVBTSetReps(vbtRepsRef.current);
      setVbtRepInProgress(false);
      setLiveConcentricVelocity(newRep.meanVelocity);
      setVbtSensorError(vbtSampleRateRef.current > 0 && vbtSampleRateRef.current < 20
        ? 'Frekuensi sensor rendah; hasil kecepatan kemungkinan kurang stabil.'
        : null);
      if (soundEnabledRef.current) {
        if (isWarning) sportsAudio.playFatigueWarningBuzz();
      }
    };

    window.addEventListener('devicemotion', handleVBTMotion);
    return () => window.removeEventListener('devicemotion', handleVBTMotion);
  }, [activeModule, vbtCalibrating, vbtRecording, vbtSensorActive, vbtCutoffPercent]);

  useEffect(() => () => {
    if (vbtCalibrationTimeoutRef.current !== null) {
      window.clearTimeout(vbtCalibrationTimeoutRef.current);
    }
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser/ponsel.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Setup Accelerometer Motion Sensor for Phone
  const requestSensorPermission = async () => {
    if (typeof window === 'undefined') return;

    if (typeof DeviceMotionEvent === 'undefined') {
      setToastMessage('Browser ini tidak menyediakan sensor gerak. Gunakan kamera dengan penandaan manual.');
      return;
    }

    const motionEvent = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
    };
    if (typeof motionEvent.requestPermission === 'function') {
      try {
        const response = await motionEvent.requestPermission();
        if (response === 'granted') {
          setSensorActive(true);
        } else {
          setToastMessage('Izin sensor gerak HP ditolak.');
        }
      } catch (err) {
        console.warn('Motion permission error:', err);
        setToastMessage('Sensor gerak tidak dapat diakses. Pastikan izin sensor diberikan dan halaman dibuka melalui HTTPS.');
      }
    } else {
      setSensorActive(true);
    }
  };

  // Process Jump Results from Flight Time
  const processJumpResults = (flightMs: number, method: JumpMeasurementRecord['method']) => {
    setMeasuredFlightTimeMs(flightMs);
    const { heightCm, takeoffVelocity } = calculateJumpFromFlightTime(flightMs);
    const power = calculateSayersPeakPower(heightCm, athleteRef.current?.weight || 70);

    setMeasuredJumpHeightCm(heightCm);
    setMeasuredTakeoffVel(takeoffVelocity);
    setMeasuredPeakPowerWatts(power);
  };

  // Manual jump timing controls
  const handleStartJumpDetection = () => {
    jumpPhaseRef.current = 'ready';
    setJumpPhase('ready');
    setMeasuredFlightTimeMs(0);
    setMeasuredJumpHeightCm(0);
    setMeasuredTakeoffVel(0);
    setMeasuredPeakPowerWatts(0);
    takeoffTimestampRef.current = null;
    setToastMessage(null);
  };

  const handleManualTakeoff = () => {
    if (jumpPhaseRef.current !== 'ready') return;
    takeoffTimestampRef.current = performance.now();
    jumpPhaseRef.current = 'airborne';
    setJumpPhase('airborne');
    if (soundEnabled) sportsAudio.playTakeoffBeep();
  };

  const handleManualLanding = () => {
    const takeoffAt = takeoffTimestampRef.current;
    if (takeoffAt === null) return;
    const flightMs = Math.round(performance.now() - takeoffAt);
    takeoffTimestampRef.current = null;
    if (flightMs < 200 || flightMs > 1100) {
      jumpPhaseRef.current = 'idle';
      setJumpPhase('idle');
      setToastMessage('Waktu lompatan tidak valid. Ulangi tes dan tandai take-off/landing dengan tepat.');
      return;
    }
    jumpPhaseRef.current = 'landed';
    setJumpPhase('landed');
    processJumpResults(flightMs, jumpMethod === 'camera' ? 'Kamera (Flight Time)' : 'Sensor Akselerometer HP');
    if (soundEnabled) sportsAudio.playLandingBeep();
  };

  const resetJumpResult = () => {
    jumpPhaseRef.current = 'idle';
    takeoffTimestampRef.current = null;
    setJumpPhase('idle');
    setMeasuredFlightTimeMs(0);
    setMeasuredJumpHeightCm(0);
    setMeasuredTakeoffVel(0);
    setMeasuredPeakPowerWatts(0);
    setToastMessage(null);
  };

  const handleJumpMethodChange = (method: 'camera' | 'sensor') => {
    if (method !== jumpMethod) resetJumpResult();
    setJumpMethod(method);
  };

  const handleJumpTypeChange = (nextJumpType: JumpMeasurementRecord['jumpType']) => {
    if (nextJumpType !== jumpType) resetJumpResult();
    setJumpType(nextJumpType);
  };

  const handleSaveJumpRecord = () => {
    if (!currentAthlete || !measuredJumpHeightCm || !measuredFlightTimeMs) return;

    const newRecord: JumpMeasurementRecord = {
      id: createRecordId('jmp'),
      athleteId: currentAthlete.id,
      date: new Date().toISOString().slice(0, 10),
      jumpType,
      method: jumpMethod === 'camera' ? 'Kamera (Flight Time)' : 'Sensor Akselerometer HP',
      jumpHeightCm: measuredJumpHeightCm,
      flightTimeMs: measuredFlightTimeMs,
      takeoffVelocity: measuredTakeoffVel,
      peakPowerWatts: measuredPeakPowerWatts,
      notes: `Pengujian ${jumpType} metode ${jumpMethod}. Pendaratan simetris.`,
    };

    if (onAddJumpRecord) onAddJumpRecord(newRecord);
    if (onUpdateGoalCurrentValue && measuredJumpHeightCm > 0) {
      onUpdateGoalCurrentValue(currentAthlete.id, 'jump_height', measuredJumpHeightCm);
    }
    setToastMessage(`Hasil ${jumpType} ${measuredJumpHeightCm} cm berhasil disimpan ke profil ${currentAthlete.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const requestVBTSensorPermission = async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setVbtSensorError('Browser ini tidak menyediakan sensor gerak. Coba browser modern di ponsel.');
      return;
    }

    const motionEvent = DeviceMotionEvent as typeof DeviceMotionEvent & {
      requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
    };
    if (typeof motionEvent.requestPermission === 'function') {
      try {
        const permission = await motionEvent.requestPermission();
        if (permission !== 'granted') {
          setVbtSensorError('Izin sensor ditolak. Izinkan akses Motion & Orientation di pengaturan browser.');
          return;
        }
      } catch (error) {
        console.error('VBT motion permission error:', error);
        setVbtSensorError('Tidak dapat meminta izin sensor gerak. Pastikan halaman dibuka melalui HTTPS.');
        return;
      }
    }

    setVbtSensorError(null);
    setVbtSensorActive(true);
  };

  const startVBTCalibration = () => {
    if (!vbtMountConfirmed || !vbtAreaClear || vbtLoadKg < 1 || vbtLoadKg > 300) return;
    vbtCalibrationRef.current = { gravitySamples: [], linearSamples: [], sampleTimestamps: [] };
    vbtGravityAxisRef.current = null;
    vbtGravityBaselineRef.current = null;
    vbtLinearBaselineRef.current = null;
    setVbtReady(false);
    setVbtSampleRateHz(0);
    vbtSampleRateRef.current = 0;
    setVbtCalibrating(true);
    setVbtSensorError(null);

    if (vbtCalibrationTimeoutRef.current !== null) {
      window.clearTimeout(vbtCalibrationTimeoutRef.current);
    }
    setVbtCalibrationSampleCount(0);
    vbtCalibrationTimeoutRef.current = window.setTimeout(() => {
      const calibrationPending = vbtCalibrationRef.current !== null;
      vbtCalibrationRef.current = null;
      vbtCalibrationTimeoutRef.current = null;
      if (!calibrationPending) return;
      setVbtCalibrating(false);
      setVbtCalibrationSampleCount(0);
      setVbtSensorError('Kalibrasi belum selesai. Pastikan sensor aktif dan tahan HP diam pada posisi awal, lalu coba lagi.');
    }, 8000);
  };

  const stopVBTSensor = () => {
    if (vbtCalibrationTimeoutRef.current !== null) {
      window.clearTimeout(vbtCalibrationTimeoutRef.current);
      vbtCalibrationTimeoutRef.current = null;
    }
    vbtCalibrationRef.current = null;
    vbtGravityAxisRef.current = null;
    vbtGravityBaselineRef.current = null;
    vbtLinearBaselineRef.current = null;
    vbtRepDetectionRef.current = null;
    setVbtSensorActive(false);
    setVbtCalibrating(false);
    setVbtCalibrationSampleCount(0);
    setVbtReady(false);
    setVbtRecording(false);
    setVbtRepInProgress(false);
    setVbtSampleRateHz(0);
    vbtSampleRateRef.current = 0;
  };

  const startVBTRecording = () => {
    if (!vbtReady || !vbtMountConfirmed || !vbtAreaClear || vbtLoadKg < 1 || vbtLoadKg > 300) return;
    vbtRepsRef.current = [];
    vbtRepDetectionRef.current = null;
    vbtSampleTimestampsRef.current = [];
    vbtSampleEventsRef.current = 0;
    setCurrentVBTSetReps([]);
    setLiveConcentricVelocity(0);
    setVbtRepInProgress(false);
    setVbtSensorError(null);
    setVbtRecording(true);
  };

  const resetVBTSet = () => {
    vbtRepsRef.current = [];
    vbtRepDetectionRef.current = null;
    setCurrentVBTSetReps([]);
    setLiveConcentricVelocity(0);
    setVbtRepInProgress(false);
    setVbtSensorError(null);
  };

  const handleFinishVBTSet = async () => {
    if (!currentAthlete || currentVBTSetReps.length === 0) return;
    setVbtRecording(false);
    setVbtRepInProgress(false);

    const avgVel = +(
      currentVBTSetReps.reduce((acc, curr) => acc + curr.meanVelocity, 0) / currentVBTSetReps.length
    ).toFixed(2);

    const est1RM = estimate1RMFromVBT(vbtLoadKg, avgVel);
    const zoneInfo = getVBTZone(avgVel);

    const recordedAt = new Date().toISOString();
    const sessionRecord: VBTSessionRecord = {
      id: createRecordId('vbt'),
      athleteId: currentAthlete.id,
      date: recordedAt.slice(0, 10),
      recordedAt,
      exercise: vbtExercise,
      loadKg: vbtLoadKg,
      reps: currentVBTSetReps,
      meanVelocityAvg: avgVel,
      estimated1RM: est1RM,
      targetZone: zoneInfo.zone,
      velocityLossCutoffPercent: vbtCutoffPercent,
      measurementMethod: 'phone_accelerometer_estimate',
      measurementConfidence: 'unvalidated_estimate',
      sensorSampleRateHz: vbtSampleRateHz,
      phoneMount: 'HP terpasang kuat pada barbel, sumbu sensor dikalibrasi searah lintasan gerak',
      testProtocol: `${vbtExercise}; ${vbtLoadKg} kg; ${vbtProtocolNote}; pemasangan HP aman dikonfirmasi; area angkat aman; sensor dikalibrasi saat diam`,
      notes: `Estimasi akselerometer HP yang belum divalidasi antarperangkat; laju sampel sekitar ${vbtSampleRateHz} Hz. ${currentVBTSetReps.length} repetisi; rata-rata ${avgVel} m/s (${zoneInfo.zone}).`,
    };

    setVbtSaveStatus('saving');
    let saveDestination: 'cloud' | 'local' = 'local';
    let saveFailed = false;
    if (onAddVBTRecord) {
      try {
        saveDestination = await onAddVBTRecord(sessionRecord);
      } catch {
        saveDestination = 'local';
        saveFailed = true;
        setToastMessage('Set tersimpan lokal, tetapi cloud gagal. Periksa koneksi atau masuk kembali.');
      }
    }
    setVbtSaveStatus(saveFailed ? 'error' : saveDestination);
    if (onUpdateGoalCurrentValue && avgVel > 0) {
      onUpdateGoalCurrentValue(currentAthlete.id, 'vbt_velocity', avgVel);
    }
    vbtRepsRef.current = [];
    vbtRepDetectionRef.current = null;
    setCurrentVBTSetReps([]);
    setLiveConcentricVelocity(0);
    setVbtRepInProgress(false);
    if (saveFailed) {
      setVbtSaveStatus('error');
    } else if (saveDestination === 'local') {
      setToastMessage(`Set tersimpan lokal. Estimasi 1RM: ${est1RM} kg; verifikasi sebelum digunakan untuk keputusan latihan.`);
    } else {
      setToastMessage(`Set VBT tersinkron. Estimasi 1RM: ${est1RM} kg; verifikasi sebelum digunakan untuk keputusan latihan.`);
    }
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleSelectAthlete = (athleteId: string) => {
    if (currentVBTSetReps.length > 0) {
      setToastMessage('Selesaikan atau reset set VBT sebelum mengganti atlet.');
      return;
    }

    setSelectedAthleteId(athleteId);
    jumpPhaseRef.current = 'idle';
    takeoffTimestampRef.current = null;
    resetJumpResult();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 ml-4 font-mono text-[11px]"
          >
            Tutup
          </button>
        </div>
      )}
      
      {/* Top Header & Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            Pengujian Biomekanik: VJ/CMJ & Velocity-Based Training (VBT)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengukuran lompatan dan estimasi kecepatan barbel menggunakan akselerometer HP.
          </p>
        </div>

        {/* Global Toolbar: Athlete Picker & Audio Toggle */}
        <div className="flex items-center gap-3">
          <select
            value={selectedAthleteId}
            onChange={(e) => handleSelectAthlete(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.sport})
              </option>
            ))}
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Module Segmented Controls */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md">
        <button
          onClick={() => setActiveModule('jump')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeModule === 'jump'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          1. Vertical Jump / CMJ
        </button>
        <button
          onClick={() => setActiveModule('vbt')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeModule === 'vbt'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          2. Velocity-Based Training (VBT)
        </button>
      </div>

      {/* Active Performance Goal Banner for Selected Athlete */}
      {(() => {
        const activeGoal = activeModule === 'jump' 
          ? goals.find(g => g.athleteId === currentAthlete.id && g.metricType === 'jump_height')
          : goals.find(g => g.athleteId === currentAthlete.id && g.metricType === 'vbt_velocity');

        if (!activeGoal) return null;

        const range = activeGoal.targetValue - activeGoal.baselineValue;
        const progressPct = range > 0 
          ? Math.round(((activeGoal.currentValue - activeGoal.baselineValue) / range) * 100) 
          : 100;
        const isAchieved = activeGoal.currentValue >= activeGoal.targetValue;
        const gap = +(activeGoal.targetValue - activeGoal.currentValue).toFixed(2);

        return (
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  Target Sasaran Pelatih
                </span>
                <span className="text-xs text-slate-400 font-medium">{currentAthlete.name}</span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeGoal.title}</span>
                {activeGoal.exerciseName && <span className="text-xs text-emerald-400 font-mono">({activeGoal.exerciseName})</span>}
              </h4>
              <p className="text-xs text-slate-300">
                Baseline: <span className="font-mono">{activeGoal.baselineValue} {activeGoal.unit}</span> &bull; 
                Target: <span className="font-mono font-bold text-emerald-400">{activeGoal.targetValue} {activeGoal.unit}</span> &bull; 
                Terkini: <span className="font-mono font-bold text-white">{activeGoal.currentValue} {activeGoal.unit}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 min-w-[240px]">
              <div className="w-full sm:w-44 space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Progres Capaian</span>
                  <span className={`font-bold ${isAchieved ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                    className={`h-full rounded-full transition-all ${isAchieved ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  />
                </div>
                <div className="text-[10px] text-right font-mono text-slate-400">
                  {gap <= 0 ? 'Target Terpenuhi!' : `Sisa gap: ${gap} ${activeGoal.unit}`}
                </div>
              </div>

              {isAchieved && (
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Target Selesai</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODULE 1: VERTICAL JUMP & CMJ */}
      {activeModule === 'jump' && (
        <div className="space-y-6">
          
          {/* Method Selector: Kamera vs Sensor HP */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Pilih Metode Deteksi:</span>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => handleJumpMethodChange('camera')}
                  className={`px-3 py-1.5 font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    jumpMethod === 'camera'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kamera HP (Flight-Time)</span>
                </button>
                <button
                  onClick={() => {
                    handleJumpMethodChange('sensor');
                    requestSensorPermission();
                  }}
                  className={`px-3 py-1.5 font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    jumpMethod === 'sensor'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Sensor Akselerometer HP</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Jenis Tes:</span>
              <select
                value={jumpType}
                onChange={(e) => handleJumpTypeChange(e.target.value as JumpMeasurementRecord['jumpType'])}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="CMJ (Countermovement Jump)">CMJ (Countermovement Jump)</option>
                <option value="SJ (Squat Jump)">SJ (Squat Jump)</option>
                <option value="DJ (Drop Jump)">DJ (Drop Jump)</option>
              </select>
            </div>
          </div>

          {/* Main Workspace Grid: Viewport/Detector & Live Metrics (12 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Interactive Video Viewport or Sensor Gauge (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              
              {jumpMethod === 'camera' ? (
                /* CAMERA FLIGHT-TIME INTERFACE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Pratinjau Kamera & Penandaan Manual Waktu Terbang
                    </span>
                    <button
                      onClick={() => setCameraFacing(cameraFacing === 'user' ? 'environment' : 'user')}
                      className="text-xs text-emerald-600 hover:underline cursor-pointer"
                    >
                      Balik Kamera ({cameraFacing === 'user' ? 'Depan' : 'Belakang'})
                    </button>
                  </div>

                  {/* Camera Screen HUD */}
                  <div className="relative w-full h-80 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {cameraActive && cameraError && (
                      <div role="alert" className="absolute inset-x-3 bottom-3 rounded-lg bg-rose-950/90 p-3 text-xs text-rose-100">
                        Kamera tidak dapat diakses: {cameraError}
                      </div>
                    )}

                    {/* Camera Offline Placeholder */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                        <Camera className="w-10 h-10 text-emerald-500 opacity-80" />
                        <div>
                          <h4 className="text-sm font-bold">Kamera Belum Aktif</h4>
                          <p role={cameraError ? 'alert' : undefined} className="text-xs text-slate-400 mt-1 max-w-xs">
                            {cameraError
                              ? `Kamera tidak dapat diakses: ${cameraError}`
                              : 'Kamera hanya menampilkan video. Tandai take-off dan landing secara manual, atau gunakan sensor gerak HP.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setCameraActive(true)}
                          className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          Nyalakan Kamera
                        </button>
                      </div>
                    )}

                    {/* HUD Alignment Overlay Lines */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                        {/* Upper Boundary: Head Height */}
                        <div className="border-b border-dashed border-emerald-400/60 pb-1 flex justify-between text-[10px] text-emerald-400 font-mono">
                          <span>BATAS KEPALA</span>
                          <span>LEVEL MATA</span>
                        </div>

                        {/* Center Target Box */}
                        <div className="w-48 h-56 mx-auto border-2 border-emerald-500/40 rounded-xl flex items-center justify-center">
                          <span className="text-[10px] font-mono text-emerald-400/80 bg-black/40 px-2 py-0.5 rounded">
                            AREA LOMPAT ATLET
                          </span>
                        </div>

                        {/* Floor Takeoff & Landing Line */}
                        <div className="border-t-2 border-emerald-500 pt-1 flex justify-between text-[10px] text-emerald-400 font-mono font-bold bg-black/30 px-2">
                          <span>GARIS LANTAI / TAKEOFF & LANDING</span>
                          <span className="animate-pulse">● KAMERA AKTIF</span>
                        </div>
                      </div>
                    )}

                    {/* Current State Indicator */}
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-mono px-2.5 py-1 rounded border border-slate-700">
                      STATUS:{' '}
                      <span className={`font-bold ${
                        jumpPhase === 'airborne' ? 'text-amber-400' : jumpPhase === 'landed' ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {jumpPhase === 'idle' && 'SIAP DIUJI'}
                        {jumpPhase === 'ready' && 'MENUNGGU TAKEOFF...'}
                        {jumpPhase === 'airborne' && 'SEDANG DI UDARA (AIRBORNE)'}
                        {jumpPhase === 'landed' && 'LANDING TERCATAT!'}
                      </span>
                    </div>
                  </div>

                  {/* Manual Takeoff / Landing Controls */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <button
                      onClick={handleStartJumpDetection}
                      className="py-2.5 px-3 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-center"
                    >
                      1. Mulai Uji
                    </button>
                    <button
                      onClick={handleManualTakeoff}
                      disabled={jumpPhase !== 'ready'}
                      className="py-2.5 px-3 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white transition-colors cursor-pointer text-center"
                    >
                      2. Tandai Take-Off
                    </button>
                    <button
                      onClick={handleManualLanding}
                      disabled={jumpPhase !== 'airborne'}
                      className="col-span-2 sm:col-span-1 py-2.5 px-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer text-center"
                    >
                      3. Tandai Landing
                    </button>
                  </div>

                  {cameraActive && (
                    <button
                      onClick={() => setCameraActive(false)}
                      className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      Matikan Kamera
                    </button>
                  )}
                </div>
              ) : (
                /* SENSOR ACCELEROMETER INTERFACE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Sensor Akselerometer HP (IMU Motion Tracking)
                    </span>
                    <button
                      onClick={requestSensorPermission}
                      className="text-xs text-emerald-600 hover:underline cursor-pointer"
                    >
                      Kalibrasi Sensor
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {currentAccelMag}G
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">AKSELERASI</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      Pasang ponsel dengan aman di pinggang atlet. Izinkan sensor, lalu mulai deteksi sebelum melompat. Hasil tetap perlu diverifikasi karena akurasi bergantung pada perangkat dan pemasangan.
                    </p>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={requestSensorPermission}
                        className="px-4 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                      >
                        {sensorActive ? 'Sensor Aktif' : 'Aktifkan Sensor'}
                      </button>
                      <button
                        onClick={handleStartJumpDetection}
                        disabled={!sensorActive}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      >
                        Mulai Deteksi Sensor
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right: Real-time Jump Physics Results Card (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Hasil Kalkulasi Biomekanik
                </h3>
                <span className="text-xs font-mono text-slate-400">Formula Bosco</span>
              </div>

              {/* Primary Output Display */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Tinggi Lompatan (Jump Height)
                </span>
                <div className="text-4xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {measuredJumpHeightCm > 0 ? measuredJumpHeightCm : '--'} <span className="text-lg font-normal">cm</span>
                </div>
                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                  {measuredJumpHeightCm >= 65
                    ? 'Kategori: Sangat Baik (Elite Athlete)'
                    : measuredJumpHeightCm >= 55
                    ? 'Kategori: Baik (Kompetitif)'
                    : measuredJumpHeightCm > 0
                    ? 'Kategori: Cukup (Perlu Penguatan Daya Ledak)'
                    : 'Lakukan lompatan untuk melihat hasil'}
                </div>
              </div>

              {/* Secondary Biomechanical Physics Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Waktu Terbang (t)</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {measuredFlightTimeMs > 0 ? measuredFlightTimeMs : '--'} <span className="text-xs font-normal">ms</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Airborne Duration</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Take-Off Velocity</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {measuredTakeoffVel > 0 ? measuredTakeoffVel : '--'} <span className="text-xs font-normal">m/s</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">v0 = √(2gh)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Peak Mechanical Power</div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {measuredPeakPowerWatts > 0 ? measuredPeakPowerWatts.toLocaleString() : '--'} <span className="text-xs font-normal">W</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Formula Sayers (Watts)</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Target Atlet</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {currentAthlete.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{currentAthlete.weight} kg · {currentAthlete.sport}</div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveJumpRecord}
                disabled={measuredJumpHeightCm <= 0}
                className="w-full py-2.5 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-40 rounded-lg transition-colors cursor-pointer text-center"
              >
                Simpan Hasil Lompatan ke Database Atlet
              </button>
            </div>

          </div>

          {/* Jump Test History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Riwayat Pengujian Vertical Jump & CMJ Terkini
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Atlet</th>
                    <th className="py-2.5 px-3">Jenis Lompatan</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-right">Tinggi (cm)</th>
                    <th className="py-2.5 px-3 text-right">Flight Time</th>
                    <th className="py-2.5 px-3 text-right">Daya (Watts)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jumpHistory.map((j) => {
                    const athlete = athletes.find((a) => a.id === j.athleteId);
                    return (
                      <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-mono">
                        <td className="py-2.5 px-3 text-slate-500">{j.date}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                          {athlete?.name || 'Atlet'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">{j.jumpType}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{j.method}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{j.jumpHeightCm} cm</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{j.flightTimeMs} ms</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{j.peakPowerWatts} W</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODULE 2: VELOCITY BASED TRAINING (VBT) */}
      {activeModule === 'vbt' && (
        <div className="space-y-6">
          
          {/* VBT Configuration Strip */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Latihan Barbel
              </label>
              <select
                value={vbtExercise}
                onChange={(e) => setVbtExercise(e.target.value)}
                disabled={vbtRecording}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="Back Squat">Back Squat</option>
                <option value="Trap Bar Deadlift">Trap Bar Deadlift</option>
                <option value="Bench Press">Bench Press</option>
                <option value="Clean & Jerk">Clean & Jerk</option>
                <option value="Push Press">Push Press</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Beban Barbel (kg)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                step="0.5"
                value={vbtLoadKg}
                onChange={(e) => setVbtLoadKg(e.target.value === '' ? 0 : Number(e.target.value))}
                disabled={vbtRecording}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ambang Batas Kelelahan (Velocity Loss Cutoff: {vbtCutoffPercent}%)
              </label>
              <select
                value={vbtCutoffPercent}
                onChange={(e) => setVbtCutoffPercent(parseInt(e.target.value))}
                disabled={vbtRecording}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="10">10% - Daya Ledak Murni (Neuromuskular Segar)</option>
                <option value="15">15% - Kekuatan Cepat (Speed-Strength)</option>
                <option value="20">20% - Hipertrofi / Kekuatan Dinamis</option>
                <option value="30">30% - Ketahanan Beban Tinggi</option>
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <label htmlFor="vbt-protocol-note" className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Standar rentang gerak / tempo (catatan sesi)
            </label>
            <input
              id="vbt-protocol-note"
              type="text"
              maxLength={120}
              value={vbtProtocolNote}
              onChange={(event) => setVbtProtocolNote(event.target.value)}
              disabled={vbtRecording}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <h3 className="font-bold">Protokol keselamatan dan konsistensi pengukuran</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Pasang HP kokoh pada barbel dengan holder/strap; jangan pegang HP saat mengangkat.</li>
              <li>Gunakan gerakan, rentang gerak, posisi sensor, dan beban yang sama saat membandingkan sesi.</li>
              <li>Letakkan barbel diam sebelum kalibrasi. Berhenti jika holder longgar, nyeri, atau gerak tidak aman.</li>
              <li>Nilai adalah estimasi eksperimental akselerometer, belum divalidasi antarperangkat; jangan gunakan sendirian untuk resep beban atau keputusan klinis.</li>
            </ol>
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={vbtMountConfirmed}
                  onChange={(event) => setVbtMountConfirmed(event.target.checked)}
                  disabled={vbtRecording}
                  className="mt-0.5"
                />
                <span>HP terpasang kencang pada barbel dan tidak dipegang atau digerakkan dengan tangan.</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={vbtAreaClear}
                  onChange={(event) => setVbtAreaClear(event.target.checked)}
                  disabled={vbtRecording}
                  className="mt-0.5"
                />
                <span>Area dan teknik angkatan aman; beban diisi dengan benar.</span>
              </label>
            </div>
          </div>

          {/* VBT Live Rep Monitor & Rep Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Real-time Velocity Gauge & Rep Trigger (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs text-center">
              <div>
                <div className="mb-1 flex items-center justify-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    vbtRecording ? 'animate-pulse bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`} />
                  <span className={`text-[9px] font-bold uppercase tracking-[0.16em] ${
                    vbtRecording ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                  }`}>
                    {vbtRecording ? 'Live · estimasi sensor' : 'Monitor velocity'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kecepatan Angkatan Konsentrik
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estimasi sesaat saat barbel bergerak. Rata-rata velocity masuk ke grafik setelah repetisi selesai.
                </p>
              </div>

              {/* Large Velocity Speedometer Gauge */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 pb-4 pt-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {vbtRepInProgress
                    ? `Rep #${currentVBTSetReps.length + 1} · Live`
                    : lastVBTRep
                      ? `Rep #${lastVBTRep.repNumber} · Rata-rata selesai`
                      : 'Menunggu rep pertama'}
                </div>
                <svg
                  viewBox="0 0 260 172"
                  role="img"
                  aria-label={`Speedometer kecepatan ${speedometerVelocity.toFixed(2)} meter per detik`}
                  aria-live="polite"
                  className="mx-auto block w-full max-w-[320px] overflow-visible"
                >
                  <path
                    d={describeVBTGaugeArc(0, VBT_GAUGE_MAX_VELOCITY, 98)}
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  {[
                    { start: 0, end: 0.5, color: '#f87171' },
                    { start: 0.5, end: 0.75, color: '#fbbf24' },
                    { start: 0.75, end: 1, color: '#34d399' },
                    { start: 1, end: VBT_GAUGE_MAX_VELOCITY, color: '#38bdf8' },
                  ].map((zone) => (
                    <path
                      key={zone.start}
                      d={describeVBTGaugeArc(zone.start, zone.end, 98)}
                      fill="none"
                      stroke={zone.color}
                      strokeWidth="11"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  ))}

                  {Array.from({ length: 16 }, (_, index) => {
                    const velocity = (index / 15) * VBT_GAUGE_MAX_VELOCITY;
                    const angle = Math.PI - (index / 15) * Math.PI;
                    const majorTick = index % 5 === 0;
                    const innerRadius = majorTick ? 81 : 87;
                    const outerRadius = 93;
                    const x1 = VBT_GAUGE_CENTER_X + innerRadius * Math.cos(angle);
                    const y1 = VBT_GAUGE_CENTER_Y - innerRadius * Math.sin(angle);
                    const x2 = VBT_GAUGE_CENTER_X + outerRadius * Math.cos(angle);
                    const y2 = VBT_GAUGE_CENTER_Y - outerRadius * Math.sin(angle);
                    const labelX = VBT_GAUGE_CENTER_X + 70 * Math.cos(angle);
                    const labelY = VBT_GAUGE_CENTER_Y - 70 * Math.sin(angle) + 4;

                    return (
                      <g key={index}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={majorTick ? '#94a3b8' : '#64748b'}
                          strokeWidth={majorTick ? 2 : 1}
                        />
                        {majorTick && (
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            className="fill-slate-500 font-mono text-[9px] dark:fill-slate-400"
                          >
                            {velocity.toFixed(1)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  <g transform={`rotate(${vbtNeedleAngle + 90} ${VBT_GAUGE_CENTER_X} ${VBT_GAUGE_CENTER_Y})`}>
                    <path
                      d={`M ${VBT_GAUGE_CENTER_X} ${VBT_GAUGE_CENTER_Y + 7} L ${VBT_GAUGE_CENTER_X - 3} ${VBT_GAUGE_CENTER_Y} L ${VBT_GAUGE_CENTER_X} ${VBT_GAUGE_CENTER_Y - 84} L ${VBT_GAUGE_CENTER_X + 3} ${VBT_GAUGE_CENTER_Y} Z`}
                      fill="#f8fafc"
                      stroke="#10b981"
                      strokeWidth="1.5"
                    />
                  </g>
                  <circle cx={VBT_GAUGE_CENTER_X} cy={VBT_GAUGE_CENTER_Y} r="6" fill="#10b981" />
                  <circle cx={VBT_GAUGE_CENTER_X} cy={VBT_GAUGE_CENTER_Y} r="2.5" fill="#f8fafc" />
                  <circle
                    cx={VBT_GAUGE_CENTER_X}
                    cy="111"
                    r="37"
                    className="fill-white stroke-slate-200 dark:fill-slate-900 dark:stroke-slate-700"
                    strokeWidth="2"
                  />
                  <text
                    x={VBT_GAUGE_CENTER_X}
                    y="112"
                    textAnchor="middle"
                    className="fill-emerald-600 font-mono text-[27px] font-extrabold dark:fill-emerald-400"
                  >
                    {speedometerVelocity.toFixed(2)}
                  </text>
                  <text
                    x={VBT_GAUGE_CENTER_X}
                    y="129"
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px] dark:fill-slate-400"
                  >
                    MEAN VELOCITY · m/s
                  </text>
                </svg>

                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {vbtRecording && !vbtRepInProgress && lastVBTRep
                    ? 'Menunggu rep berikutnya'
                    : speedometerVelocity > 0
                      ? getVBTZone(speedometerVelocity).zone
                      : 'Menunggu repetisi pertama...'}
                </div>
                {speedometerVelocity > 0 && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    Zona intensitas indikatif: {getVBTZone(speedometerVelocity).intensityPct1RM}
                  </div>
                )}
              </div>

              {lastVBTRep && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">
                    Hasil tercatat di set · Rep #{lastVBTRep.repNumber}
                  </div>
                  <div className="mt-1 text-slate-700 dark:text-slate-300">
                    Rata-rata {lastVBTRep.meanVelocity.toFixed(2)} m/s
                    {lastVBTRep.peakVelocity !== undefined && ` · Puncak ${lastVBTRep.peakVelocity.toFixed(2)} m/s`}
                    {lastVBTRep.concentricDurationMs !== undefined
                      && ` · Waktu ${(lastVBTRep.concentricDurationMs / 1000).toFixed(2)} dtk`}
                  </div>
                </div>
              )}

              {/* Rep Trigger Controls */}
              <div className="space-y-2 pt-2">
                <div className={`rounded-lg border p-3 text-left text-xs ${
                  vbtSensorError
                    ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  <div className="font-bold">
                    Status sensor: {vbtSensorError ? 'Perlu diperiksa' : vbtRecording ? 'Merekam repetisi' : vbtCalibrating ? 'Kalibrasi' : vbtReady ? 'Siap' : vbtSensorActive ? 'Aktif' : 'Belum aktif'}
                  </div>
                  {vbtSampleRateHz > 0 && (
                    <div className={`mt-1 font-mono ${vbtSampleRateHz < 20 ? 'text-rose-700 dark:text-rose-300' : ''}`}>
                      Frekuensi data sensor: {vbtSampleRateHz} Hz {vbtSampleRateHz < 20 ? '(rendah)' : '(akurasi tetap belum tervalidasi)'}
                    </div>
                  )}
                  {vbtReady && vbtSampleRateHz > 0 && vbtSampleRateHz < 20 && (
                    <p role="alert" className="mt-1 font-semibold text-rose-700 dark:text-rose-300">
                      Kualitas sampel rendah. Pengukuran ini sebaiknya tidak dipakai untuk membandingkan performa.
                    </p>
                  )}
                  <p className="mt-1">
                    Kalibrasi menetapkan orientasi gravitasi dan titik nol gerak relatif saat HP diam; sensor HP
                    tidak dapat mengukur ketinggian absolut. Pasang HP dengan aman dan searah pada barbel, jangan
                    gerakkan dengan tangan. Estimasi akselerometer belum tervalidasi.
                  </p>
                  {vbtCalibrating && (
                    <p className="mt-1 font-semibold">
                      Mengkalibrasi posisi awal: {vbtCalibrationSampleCount} sampel (minimal 40) selama setidaknya
                      1,5 detik. Tahan HP tetap diam.
                    </p>
                  )}
                  {vbtSensorError && <p role="alert" className="mt-1 font-semibold">{vbtSensorError}</p>}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    onClick={vbtSensorActive ? stopVBTSensor : requestVBTSensorPermission}
                    disabled={vbtRecording}
                    className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 disabled:opacity-40 dark:bg-slate-700 dark:text-white"
                  >
                    {vbtSensorActive ? 'Matikan Sensor' : '1. Aktifkan Sensor'}
                  </button>
                  <button
                    onClick={startVBTCalibration}
                    disabled={!vbtSensorActive || vbtCalibrating || vbtRecording || !vbtMountConfirmed || !vbtAreaClear || vbtLoadKg < 1 || vbtLoadKg > 300}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    {vbtCalibrating ? 'Tahan HP Diam...' : '2. Kalibrasi Titik Awal'}
                  </button>
                  <button
                    onClick={startVBTRecording}
                    disabled={!vbtReady || vbtRecording || !vbtMountConfirmed || !vbtAreaClear || vbtLoadKg < 1 || vbtLoadKg > 300}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                  >
                    3. Mulai Rekam Set
                  </button>
                </div>
                <button
                  onClick={handleFinishVBTSet}
                  disabled={!vbtRecording || currentVBTSetReps.length === 0}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
                >
                  Selesaikan Set & Simpan ({currentVBTSetReps.length} reps)
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={resetVBTSet}
                    disabled={currentVBTSetReps.length === 0 || vbtRecording}
                    className="py-2 px-3 text-xs text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    Reset Set
                  </button>
                </div>
                {vbtSaveStatus !== 'idle' && (
                  <p className={`text-left text-[11px] font-semibold ${
                    vbtSaveStatus === 'error'
                      ? 'text-rose-600'
                      : vbtSaveStatus === 'saving'
                        ? 'text-amber-600'
                        : vbtSaveStatus === 'cloud'
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                  }`}>
                    Penyimpanan: {vbtSaveStatus === 'saving' ? 'menyimpan...' : vbtSaveStatus === 'cloud' ? 'tersinkron ke cloud' : vbtSaveStatus === 'error' ? 'gagal ke cloud; tersimpan lokal' : 'lokal di perangkat'}
                  </p>
                )}
              </div>

              <div className="text-[11px] text-slate-500 text-left pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tips VBT:</span> Hentikan set segera jika terdengar suara peringatan kelelahan (Velocity Loss &gt; {vbtCutoffPercent}%) untuk menjaga kualitas impuls saraf.
              </div>
            </div>

            {/* Right: Live Rep-by-Rep Bar Chart in Current Set (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Grafik Kecepatan Antar-Repetisi Set Berjalan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Beban: {vbtLoadKg} kg · Atlet: {currentAthlete.name}
                  </p>
                </div>

                {currentVBTSetReps.length > 0 && (
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400">Estimasi kasar 1RM:</span>{' '}
                    <span className="font-bold text-emerald-600">
                      {estimate1RMFromVBT(
                        vbtLoadKg,
                        currentVBTSetReps.reduce((acc, c) => acc + c.meanVelocity, 0) / currentVBTSetReps.length
                      )}{' '}
                      kg
                    </span>
                  </div>
                )}
              </div>

              {/* Rep Bars */}
              {currentVBTSetReps.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    {!vbtReady
                      ? 'Aktifkan sensor dan kalibrasi HP saat diam untuk memulai.'
                      : vbtRecording
                        ? 'Lakukan angkatan konsentrik dengan HP terpasang kuat; repetisi akan direkam otomatis.'
                        : 'Mulai rekam set agar repetisi dan kecepatan terbaca otomatis.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {currentVBTSetReps.map((rep) => {
                    const isOverCutoff = rep.velocityLoss >= vbtCutoffPercent;
                    // Scale velocity: 0 to 1.2 m/s -> 0% to 100%
                    const barWidth = Math.min(100, (rep.meanVelocity / 1.2) * 100);

                    return (
                      <div key={rep.repNumber} className="space-y-1 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Rep #{rep.repNumber}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {rep.peakPowerWatts !== undefined && (
                              <span className="text-slate-400 text-[11px]">Daya puncak: {rep.peakPowerWatts}W</span>
                            )}
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              Rata-rata {rep.meanVelocity.toFixed(2)} m/s
                            </span>
                            {rep.concentricDurationMs !== undefined && (
                              <span className="text-slate-500 text-[11px]">
                                { (rep.concentricDurationMs / 1000).toFixed(2)} dtk
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isOverCutoff
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}>
                              Loss: -{rep.velocityLoss}%
                            </span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${barWidth}%` }}
                            className={`h-full rounded-full transition-all ${
                              isOverCutoff ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VBT Zone Reference Table */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                <div className="p-1.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300">
                  <div className="font-bold">&gt; 1.0 m/s</div>
                  <div>Kecepatan Murni</div>
                </div>
                <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  <div className="font-bold">0.75 - 1.0 m/s</div>
                  <div>Speed-Strength</div>
                </div>
                <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  <div className="font-bold">0.50 - 0.75 m/s</div>
                  <div>Strength-Speed</div>
                </div>
                <div className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  <div className="font-bold">&lt; 0.50 m/s</div>
                  <div>Kekuatan Maksimal</div>
                </div>
              </div>

            </div>

          </div>

          {/* VBT History Log */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Log Riwayat Sesi Velocity-Based Training
            </h3>
            <p className="text-xs text-slate-500">
              Tren hanya menampilkan sesi estimasi sensor HP untuk atlet dan gerakan yang dipilih. Bandingkan dengan protokol yang sama.
            </p>
            {vbtTrendData.length >= 2 ? (
              <div className="h-56 w-full" aria-label="Grafik tren mean velocity estimasi sensor HP">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vbtTrendData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                    <XAxis dataKey="session" tick={{ fontSize: 10 }} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10 }}
                      width={44}
                      label={{ value: 'm/s', angle: -90, position: 'insideLeft', fontSize: 10 }}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} m/s`, 'Estimasi mean velocity']} />
                    <Line
                      type="monotone"
                      dataKey="meanVelocityAvg"
                      name="Estimasi mean velocity"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700">
                Minimal dua sesi sensor HP pada gerakan yang sama diperlukan untuk menampilkan tren.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Atlet</th>
                    <th className="py-2.5 px-3">Gerakan</th>
                    <th className="py-2.5 px-3 text-right">Beban</th>
                    <th className="py-2.5 px-3 text-center">Repetisi</th>
                    <th className="py-2.5 px-3 text-right">Kecepatan Rata2</th>
                    <th className="py-2.5 px-3 text-right">Estimasi 1RM*</th>
                    <th className="py-2.5 px-3">Zona indikatif</th>
                    <th className="py-2.5 px-3">Kualitas data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vbtHistory.map((v) => {
                    const athlete = athletes.find((a) => a.id === v.athleteId);
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-mono">
                        <td className="py-2.5 px-3 text-slate-500">{v.date}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">
                          {athlete?.name || 'Atlet'}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">{v.exercise}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">{v.loadKg} kg</td>
                        <td className="py-2.5 px-3 text-center">{v.reps.length} reps</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{v.meanVelocityAvg} m/s</td>
                        <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-bold">{v.estimated1RM} kg</td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">{v.targetZone}</td>
                        <td className="py-2.5 px-3 font-sans text-[11px] text-amber-700 dark:text-amber-300">
                          {v.measurementMethod === 'phone_accelerometer_estimate'
                            ? `Estimasi belum tervalidasi${v.sensorSampleRateHz ? ` · ${v.sensorSampleRateHz} Hz` : ''}`
                            : 'Data contoh/lama (bukan hasil sensor HP)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">
              *Estimasi 1RM dan zona dihitung dari kecepatan sensor HP yang belum tervalidasi. Jangan jadikan satu-satunya dasar penentuan beban.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
