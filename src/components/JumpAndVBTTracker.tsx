import React, { useState, useEffect, useRef } from 'react';
import { Athlete, JumpMeasurementRecord, VBTSessionRecord, VBTRepData, PerformanceGoal, GoalMetricType } from '../types/athlete';
import {
  calculateJumpFromFlightTime,
  calculateSayersPeakPower,
  getVBTZone,
  estimate1RMFromVBT,
  sportsAudio,
  initialJumpRecords,
  initialVBTRecords,
} from '../utils/jumpAndVBT';
import {
  Zap,
  Camera,
  Smartphone,
  Play,
  Square,
  RefreshCw,
  Trophy,
  Volume2,
  VolumeX,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Award,
  Target,
  ArrowRight,
} from 'lucide-react';

interface JumpAndVBTTrackerProps {
  athletes: Athlete[];
  goals?: PerformanceGoal[];
  onAddJumpRecord?: (record: JumpMeasurementRecord) => void;
  onAddVBTRecord?: (record: VBTSessionRecord) => void;
  onUpdateGoalCurrentValue?: (athleteId: string, metricType: GoalMetricType, newValue: number) => void;
  onSelectAthleteDetail: (athlete: Athlete) => void;
}

export const JumpAndVBTTracker: React.FC<JumpAndVBTTrackerProps> = ({
  athletes,
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
  const [jumpHistory, setJumpHistory] = useState<JumpMeasurementRecord[]>(() => {
    const saved = localStorage.getItem('athletaphysio_jump_records');
    return saved ? JSON.parse(saved) : initialJumpRecords;
  });

  // Jump Camera / Video Tracking State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [jumpPhase, setJumpPhase] = useState<'idle' | 'ready' | 'airborne' | 'landed'>('idle');
  const [takeoffTimestamp, setTakeoffTimestamp] = useState<number | null>(null);
  const [measuredFlightTimeMs, setMeasuredFlightTimeMs] = useState<number>(0);
  const [measuredJumpHeightCm, setMeasuredJumpHeightCm] = useState<number>(0);
  const [measuredPeakPowerWatts, setMeasuredPeakPowerWatts] = useState<number>(0);
  const [measuredTakeoffVel, setMeasuredTakeoffVel] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Jump Sensor (DeviceMotion) State
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [currentAccelZ, setCurrentAccelZ] = useState<number>(9.81);
  const [currentAccelMag, setCurrentAccelMag] = useState<number>(1.0); // in G
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // VBT State
  const [vbtExercise, setVbtExercise] = useState<string>('Back Squat');
  const [vbtLoadKg, setVbtLoadKg] = useState<number>(80);
  const [vbtCutoffPercent, setVbtCutoffPercent] = useState<number>(15);
  const [vbtHistory, setVbtHistory] = useState<VBTSessionRecord[]>(() => {
    const saved = localStorage.getItem('athletaphysio_vbt_records');
    return saved ? JSON.parse(saved) : initialVBTRecords;
  });
  const [currentVBTSetReps, setCurrentVBTSetReps] = useState<VBTRepData[]>([]);
  const [isVBTTracking, setIsVBTTracking] = useState<boolean>(false);
  const [liveConcentricVelocity, setLiveConcentricVelocity] = useState<number>(0.0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentAthlete = athletes.find((a) => a.id === selectedAthleteId) || athletes[0];

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('athletaphysio_jump_records', JSON.stringify(jumpHistory));
  }, [jumpHistory]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_vbt_records', JSON.stringify(vbtHistory));
  }, [vbtHistory]);

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
        videoRef.current.play();
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

    // Check iOS 13+ permission model
    if (
      typeof (DeviceMotionEvent as any) !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          activateSensorListener();
        } else {
          setToastMessage('Izin sensor gerak HP ditolak.');
        }
      } catch (err) {
        console.warn('Motion permission error:', err);
        activateSensorListener();
      }
    } else {
      activateSensorListener();
    }
  };

  const activateSensorListener = () => {
    setSensorActive(true);
    setSensorAvailable(true);

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;

      const z = acc.z ?? 9.81;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const mag = Math.sqrt(x * x + y * y + z * z) / 9.81; // in G

      setCurrentAccelZ(+z.toFixed(2));
      setCurrentAccelMag(+mag.toFixed(2));

      // Automated jump phase state machine
      if (jumpPhase === 'ready' && mag < 0.35) {
        // Freefall detected (Takeoff!)
        setJumpPhase('airborne');
        setTakeoffTimestamp(performance.now());
        if (soundEnabled) sportsAudio.playTakeoffBeep();
      } else if (jumpPhase === 'airborne' && mag > 2.4) {
        // Impact spike detected (Landing!)
        if (takeoffTimestamp) {
          const flightMs = Math.round(performance.now() - takeoffTimestamp);
          if (flightMs >= 200 && flightMs <= 1100) {
            processJumpResults(flightMs, 'Sensor Akselerometer HP');
          }
        }
        setJumpPhase('landed');
        if (soundEnabled) sportsAudio.playLandingBeep();
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  };

  // Process Jump Results from Flight Time
  const processJumpResults = (flightMs: number, method: JumpMeasurementRecord['method']) => {
    setMeasuredFlightTimeMs(flightMs);
    const { heightCm, takeoffVelocity } = calculateJumpFromFlightTime(flightMs);
    const power = calculateSayersPeakPower(heightCm, currentAthlete.weight || 70);

    setMeasuredJumpHeightCm(heightCm);
    setMeasuredTakeoffVel(takeoffVelocity);
    setMeasuredPeakPowerWatts(power);
  };

  // Manual & Simulation Jump Triggers
  const handleStartJumpDetection = () => {
    setJumpPhase('ready');
    setMeasuredFlightTimeMs(0);
    setMeasuredJumpHeightCm(0);
    setTakeoffTimestamp(null);
  };

  const handleManualTakeoff = () => {
    setJumpPhase('airborne');
    setTakeoffTimestamp(performance.now());
    if (soundEnabled) sportsAudio.playTakeoffBeep();
  };

  const handleManualLanding = () => {
    if (!takeoffTimestamp) return;
    const flightMs = Math.round(performance.now() - takeoffTimestamp);
    setJumpPhase('landed');
    processJumpResults(flightMs, jumpMethod === 'camera' ? 'Kamera (Flight Time)' : 'Sensor Akselerometer HP');
    if (soundEnabled) sportsAudio.playLandingBeep();
  };

  const handleSimulateRealisticJump = () => {
    handleStartJumpDetection();
    setTimeout(() => {
      handleManualTakeoff();
      // Realistic CMJ flight time for elite/sub-elite athletes: 720ms - 780ms (~63cm - 75cm)
      const flightDuration = Math.round(710 + Math.random() * 80);
      setTimeout(() => {
        handleManualLanding();
      }, flightDuration);
    }, 800);
  };

  const handleSaveJumpRecord = () => {
    if (!measuredJumpHeightCm || !measuredFlightTimeMs) return;

    const newRecord: JumpMeasurementRecord = {
      id: `jmp-${Date.now().toString().slice(-4)}`,
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

    setJumpHistory((prev) => [newRecord, ...prev]);
    if (onAddJumpRecord) onAddJumpRecord(newRecord);
    if (onUpdateGoalCurrentValue && measuredJumpHeightCm > 0) {
      onUpdateGoalCurrentValue(currentAthlete.id, 'jump_height', measuredJumpHeightCm);
    }
    setToastMessage(`Hasil ${jumpType} ${measuredJumpHeightCm} cm berhasil disimpan ke profil ${currentAthlete.name}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // VBT Rep Simulator & Tracker
  const handleAddVBTRep = (manualVelocity?: number) => {
    const repNum = currentVBTSetReps.length + 1;
    // Base velocity around 0.82 m/s, naturally declining by ~0.04 m/s per rep
    const vel = manualVelocity !== undefined
      ? manualVelocity
      : +(Math.max(0.38, 0.84 - (repNum - 1) * 0.042 + (Math.random() * 0.03 - 0.015))).toFixed(2);

    const peakVel = +(vel * 1.35).toFixed(2);
    const power = Math.round(vbtLoadKg * 9.81 * vel);

    // Calculate velocity loss relative to best rep in set
    const fastestSoFar = currentVBTSetReps.length === 0
      ? vel
      : Math.max(...currentVBTSetReps.map((r) => r.meanVelocity), vel);

    const loss = fastestSoFar > 0 ? +(((fastestSoFar - vel) / fastestSoFar) * 100).toFixed(1) : 0;
    const isWarning = loss >= vbtCutoffPercent;

    const newRep: VBTRepData = {
      repNumber: repNum,
      meanVelocity: vel,
      peakVelocity: peakVel,
      velocityLoss: loss,
      peakPowerWatts: power,
      concentricDurationMs: Math.round(350 + (1.2 - vel) * 300),
      quality: isWarning ? 'Warning' : 'Optimal',
    };

    setCurrentVBTSetReps((prev) => [...prev, newRep]);
    setLiveConcentricVelocity(vel);

    if (soundEnabled) {
      if (isWarning) {
        sportsAudio.playFatigueWarningBuzz();
      } else {
        sportsAudio.playRepSuccessBeep();
      }
    }
  };

  const handleFinishVBTSet = () => {
    if (currentVBTSetReps.length === 0) return;

    const avgVel = +(
      currentVBTSetReps.reduce((acc, curr) => acc + curr.meanVelocity, 0) / currentVBTSetReps.length
    ).toFixed(2);

    const est1RM = estimate1RMFromVBT(vbtLoadKg, avgVel);
    const zoneInfo = getVBTZone(avgVel);

    const sessionRecord: VBTSessionRecord = {
      id: `vbt-${Date.now().toString().slice(-4)}`,
      athleteId: currentAthlete.id,
      date: new Date().toISOString().slice(0, 10),
      exercise: vbtExercise,
      loadKg: vbtLoadKg,
      reps: currentVBTSetReps,
      meanVelocityAvg: avgVel,
      estimated1RM: est1RM,
      targetZone: zoneInfo.zone,
      velocityLossCutoffPercent: vbtCutoffPercent,
      notes: `Set ${currentVBTSetReps.length} repetisi selesai. Rata-rata kecepatan ${avgVel} m/s (${zoneInfo.zone}).`,
    };

    setVbtHistory((prev) => [sessionRecord, ...prev]);
    if (onAddVBTRecord) onAddVBTRecord(sessionRecord);
    if (onUpdateGoalCurrentValue && avgVel > 0) {
      onUpdateGoalCurrentValue(currentAthlete.id, 'vbt_velocity', avgVel);
    }
    setCurrentVBTSetReps([]);
    setLiveConcentricVelocity(0);
    setToastMessage(`Set VBT ${vbtExercise} (${vbtLoadKg}kg) selesai! Estimasi 1RM: ${est1RM}kg.`);
    setTimeout(() => setToastMessage(null), 4000);
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
            Pengukuran daya ledak lompatan Countermovement Jump (CMJ) & pemantauan kecepatan barbel menggunakan kamera HP dan sensor akselerometer.
          </p>
        </div>

        {/* Global Toolbar: Athlete Picker & Audio Toggle */}
        <div className="flex items-center gap-3">
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
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
                  onClick={() => setJumpMethod('camera')}
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
                    setJumpMethod('sensor');
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
                onChange={(e) => setJumpType(e.target.value as any)}
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
                      Kamera Deteksi Waktu Terbang (Flight-Time Tracking)
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

                    {/* Camera Offline Placeholder */}
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                        <Camera className="w-10 h-10 text-emerald-500 opacity-80" />
                        <div>
                          <h4 className="text-sm font-bold">Kamera Belum Aktif</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Aktifkan kamera ponsel atau web untuk deteksi frame take-off dan landing secara optik.
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

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={handleSimulateRealisticJump}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Simulasi Otomatis Gerak Lompatan Atlet (740ms)</span>
                    </button>

                    {cameraActive && (
                      <button
                        onClick={() => setCameraActive(false)}
                        className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Matikan Kamera
                      </button>
                    )}
                  </div>
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
                      Letakkan ponsel di sabuk pinggang atlet. Sensor akan mendeteksi fase countermovement, fase bebas gravitasi (0G saat takeoff), dan lonjakan landing.
                    </p>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleStartJumpDetection}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                      >
                        Mulai Deteksi Sensor
                      </button>
                      <button
                        onClick={handleSimulateRealisticJump}
                        className="px-3.5 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                      >
                        Simulasi Sensor Lompat
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
                min="20"
                max="300"
                value={vbtLoadKg}
                onChange={(e) => setVbtLoadKg(parseInt(e.target.value) || 20)}
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
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
              >
                <option value="10">10% - Daya Ledak Murni (Neuromuskular Segar)</option>
                <option value="15">15% - Kekuatan Cepat (Speed-Strength)</option>
                <option value="20">20% - Hipertrofi / Kekuatan Dinamis</option>
                <option value="30">30% - Ketahanan Beban Tinggi</option>
              </select>
            </div>
          </div>

          {/* VBT Live Rep Monitor & Rep Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Real-time Velocity Gauge & Rep Trigger (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs text-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kecepatan Angkatan Konsentrik (Mean Velocity)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diukur menggunakan sensor barbel / kamera gerak optik.
                </p>
              </div>

              {/* Large Velocity Speedometer Gauge */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-4xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {liveConcentricVelocity > 0 ? liveConcentricVelocity.toFixed(2) : '0.00'}{' '}
                  <span className="text-base font-normal">m/s</span>
                </div>

                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {liveConcentricVelocity > 0
                    ? getVBTZone(liveConcentricVelocity).zone
                    : 'Menunggu Repetisi Pertama...'}
                </div>

                {liveConcentricVelocity > 0 && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Intensitas Efektif: {getVBTZone(liveConcentricVelocity).intensityPct1RM}
                  </div>
                )}
              </div>

              {/* Rep Trigger Controls */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleAddVBTRep()}
                  className="w-full py-3 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Catat 1 Repetisi Angkatan (Barbell Rep)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleFinishVBTSet}
                    disabled={currentVBTSetReps.length === 0}
                    className="flex-1 py-2 px-3 text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    Selesaikan Set ({currentVBTSetReps.length} Reps)
                  </button>
                  <button
                    onClick={() => setCurrentVBTSetReps([])}
                    disabled={currentVBTSetReps.length === 0}
                    className="py-2 px-3 text-xs text-slate-500 hover:text-rose-600 rounded-lg cursor-pointer"
                  >
                    Reset Set
                  </button>
                </div>
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
                    <span className="text-slate-400">Est. 1RM:</span>{' '}
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
                    Belum ada repetisi. Klik "+ Catat 1 Repetisi Angkatan" untuk memulai set VBT.
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
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Rep #{rep.repNumber}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-[11px]">Daya: {rep.peakPowerWatts}W</span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              {rep.meanVelocity.toFixed(2)} m/s
                            </span>
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
                    <th className="py-2.5 px-3 text-right">Estimasi 1RM</th>
                    <th className="py-2.5 px-3">Zona Target</th>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
