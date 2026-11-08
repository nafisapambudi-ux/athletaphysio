import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AthleteOverview } from './components/AthleteOverview';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { JumpAndVBTTracker } from './components/JumpAndVBTTracker';
import { PerformanceGoalsTracker } from './components/PerformanceGoalsTracker';
import { AthleteRoster } from './components/AthleteRoster';
import { WorkloadACWRSection } from './components/WorkloadACWRSection';
import { DailyWellnessTracker } from './components/DailyWellnessTracker';
import { FitnessBatterySection } from './components/FitnessBatterySection';
import { InjuryPainTracker } from './components/InjuryPainTracker';
import { AthleteDetailModal } from './components/AthleteDetailModal';
import { AISportsAdvisorModal } from './components/AISportsAdvisorModal';
import { QuickLogModal } from './components/QuickLogModal';
import { AddAthleteModal } from './components/AddAthleteModal';
import {
  initialAthletes,
  initialTrainingSessions,
  initialWellnessLogs,
  initialFitnessTests,
  initialPainPoints,
  initialPerformanceGoals,
} from './data/initialData';
import {
  Athlete,
  TrainingSessionLog,
  WellnessLog,
  FitnessTestRecord,
  BodyPainPoint,
  JumpMeasurementRecord,
  VBTSessionRecord,
  PerformanceGoal,
  GoalMetricType,
} from './types/athlete';
import { exportAthletesToCSV, evaluateAthleteAlerts } from './utils/sportsScience';
import { auth, signInWithGoogle, logOutUser, testFirestoreConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  subscribeAthletes,
  saveAthleteToFirestore,
  deleteAthleteFromFirestore,
  subscribeTrainingSessions,
  saveTrainingSessionToFirestore,
  subscribeWellnessLogs,
  saveWellnessLogToFirestore,
  subscribeFitnessTests,
  saveFitnessTestToFirestore,
  subscribePainPoints,
  savePainPointToFirestore,
  saveJumpRecordToFirestore,
  saveVBTRecordToFirestore,
  subscribePerformanceGoals,
  savePerformanceGoalToFirestore,
  deletePerformanceGoalFromFirestore,
  seedFirestoreIfEmpty,
} from './services/firestoreService';

export default function App() {
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth & Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Persistent storage state with fallbacks to initial data
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const saved = localStorage.getItem('athletaphysio_athletes');
    return saved ? JSON.parse(saved) : initialAthletes;
  });

  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionLog[]>(() => {
    const saved = localStorage.getItem('athletaphysio_sessions');
    return saved ? JSON.parse(saved) : initialTrainingSessions;
  });

  const [wellnessLogs, setWellnessLogs] = useState<WellnessLog[]>(() => {
    const saved = localStorage.getItem('athletaphysio_wellness');
    return saved ? JSON.parse(saved) : initialWellnessLogs;
  });

  const [fitnessTests, setFitnessTests] = useState<FitnessTestRecord[]>(() => {
    const saved = localStorage.getItem('athletaphysio_tests');
    return saved ? JSON.parse(saved) : initialFitnessTests;
  });

  const [painPoints, setPainPoints] = useState<BodyPainPoint[]>(() => {
    const saved = localStorage.getItem('athletaphysio_pains');
    return saved ? JSON.parse(saved) : initialPainPoints;
  });

  const [performanceGoals, setPerformanceGoals] = useState<PerformanceGoal[]>(() => {
    const saved = localStorage.getItem('athletaphysio_goals');
    return saved ? JSON.parse(saved) : initialPerformanceGoals;
  });

  // Local storage mirror for offline resilience
  useEffect(() => {
    localStorage.setItem('athletaphysio_athletes', JSON.stringify(athletes));
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_sessions', JSON.stringify(trainingSessions));
  }, [trainingSessions]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_wellness', JSON.stringify(wellnessLogs));
  }, [wellnessLogs]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_tests', JSON.stringify(fitnessTests));
  }, [fitnessTests]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_pains', JSON.stringify(painPoints));
  }, [painPoints]);

  useEffect(() => {
    localStorage.setItem('athletaphysio_goals', JSON.stringify(performanceGoals));
  }, [performanceGoals]);

  // Firebase Auth Listener
  useEffect(() => {
    if (demoMode) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, [demoMode]);

  // Initialize Firestore Connection & Real-Time Sync
  useEffect(() => {
    if (demoMode) return;

    let unsubs: (() => void)[] = [];

    const initFirestore = async () => {
      try {
        setIsCloudSyncing(true);
        await testFirestoreConnection();
        await seedFirestoreIfEmpty();

        // Subscribe to Athletes
        const unsubAthletes = subscribeAthletes((cloudAthletes) => {
          if (cloudAthletes && cloudAthletes.length > 0) {
            setAthletes(cloudAthletes);
          }
        });
        unsubs.push(unsubAthletes);

        // Subscribe to Training Sessions
        const unsubSessions = subscribeTrainingSessions((cloudSessions) => {
          if (cloudSessions && cloudSessions.length > 0) {
            setTrainingSessions(cloudSessions);
          }
        });
        unsubs.push(unsubSessions);

        // Subscribe to Wellness Logs
        const unsubWellness = subscribeWellnessLogs((cloudWellness) => {
          if (cloudWellness && cloudWellness.length > 0) {
            setWellnessLogs(cloudWellness);
          }
        });
        unsubs.push(unsubWellness);

        // Subscribe to Fitness Tests
        const unsubFitness = subscribeFitnessTests((cloudTests) => {
          if (cloudTests && cloudTests.length > 0) {
            setFitnessTests(cloudTests);
          }
        });
        unsubs.push(unsubFitness);

        // Subscribe to Pain Points
        const unsubPain = subscribePainPoints((cloudPains) => {
          if (cloudPains && cloudPains.length > 0) {
            setPainPoints(cloudPains);
          }
        });
        unsubs.push(unsubPain);

        // Subscribe to Performance Goals
        const unsubGoals = subscribePerformanceGoals((cloudGoals) => {
          if (cloudGoals && cloudGoals.length > 0) {
            setPerformanceGoals(cloudGoals);
          }
        });
        unsubs.push(unsubGoals);
      } catch (err) {
        console.warn('Firestore initialization or offline fallback:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    };

    initFirestore();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [demoMode]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modal states
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickLogAthleteId, setQuickLogAthleteId] = useState<string | undefined>(undefined);
  const [addAthleteOpen, setAddAthleteOpen] = useState(false);
  const [detailAthlete, setDetailAthlete] = useState<Athlete | null>(null);
  const [aiAdvisorAthlete, setAiAdvisorAthlete] = useState<Athlete | null>(null);

  // Handlers with dual State & Firestore persistence
  const handleAddSession = async (newSession: Omit<TrainingSessionLog, 'id'>) => {
    const session: TrainingSessionLog = {
      ...newSession,
      id: `trn-${Date.now().toString().slice(-4)}`,
    };
    setTrainingSessions((prev) => [session, ...prev]);

    // Dynamically update athlete's acuteLoad and ACWR
    let updatedAthlete: Athlete | undefined;
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id === newSession.athleteId) {
          const updatedAcute = a.acuteLoad + session.sRPE * 0.3;
          const updatedChronic = a.chronicLoad + session.sRPE * 0.08;
          const updatedACWR = updatedChronic > 0 ? updatedAcute / updatedChronic : a.acwr;
          updatedAthlete = {
            ...a,
            acuteLoad: Math.round(updatedAcute),
            chronicLoad: Math.round(updatedChronic),
            acwr: parseFloat(updatedACWR.toFixed(2)),
          };
          return updatedAthlete;
        }
        return a;
      })
    );

    if (demoMode) return;

    // Save to Firestore
    try {
      setIsCloudSyncing(true);
      await saveTrainingSessionToFirestore(session);
      if (updatedAthlete) {
        await saveAthleteToFirestore(updatedAthlete);
      }
    } catch (e) {
      console.error('Failed to sync session to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleAddWellness = async (newWellness: Omit<WellnessLog, 'id'>) => {
    const log: WellnessLog = {
      ...newWellness,
      id: `wel-${Date.now().toString().slice(-4)}`,
    };
    setWellnessLogs((prev) => [log, ...prev]);

    // Update athlete's readiness and resting HR
    let updatedAthlete: Athlete | undefined;
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id === newWellness.athleteId) {
          updatedAthlete = {
            ...a,
            readinessScore: newWellness.readinessScore,
            restingHeartRate: newWellness.restingHR || a.restingHeartRate,
          };
          return updatedAthlete;
        }
        return a;
      })
    );

    if (demoMode) return;

    // Save to Firestore
    try {
      setIsCloudSyncing(true);
      await saveWellnessLogToFirestore(log);
      if (updatedAthlete) {
        await saveAthleteToFirestore(updatedAthlete);
      }
    } catch (e) {
      console.error('Failed to sync wellness log to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleAddFitnessTest = async (newTest: Omit<FitnessTestRecord, 'id'>) => {
    const test: FitnessTestRecord = {
      ...newTest,
      id: `fit-${Date.now().toString().slice(-4)}`,
    };
    setFitnessTests((prev) => [test, ...prev]);

    if (demoMode) return;

    // Save to Firestore
    try {
      setIsCloudSyncing(true);
      await saveFitnessTestToFirestore(test);
    } catch (e) {
      console.error('Failed to sync fitness test to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleAddJumpRecord = async (jumpRecord: JumpMeasurementRecord) => {
    const testRecord: FitnessTestRecord = {
      id: `fit-${Date.now().toString().slice(-4)}`,
      athleteId: jumpRecord.athleteId,
      date: jumpRecord.date,
      testName: `Vertical Jump (${jumpRecord.jumpType})`,
      category: 'Daya Ledak',
      value: jumpRecord.jumpHeightCm,
      unit: 'cm',
      normGrade: jumpRecord.jumpHeightCm >= 65 ? 'Sangat Baik' : jumpRecord.jumpHeightCm >= 55 ? 'Baik' : 'Cukup',
      percentile: Math.min(99, Math.round(jumpRecord.jumpHeightCm * 1.3)),
      notes: `Metode ${jumpRecord.method}. Daya: ${jumpRecord.peakPowerWatts}W, Kecepatan Takeoff: ${jumpRecord.takeoffVelocity}m/s.`,
    };
    setFitnessTests((prev) => [testRecord, ...prev]);

    // Automatically check and update any matching jump_height goal for this athlete
    const matchingGoal = performanceGoals.find(
      (g) => g.athleteId === jumpRecord.athleteId && g.metricType === 'jump_height'
    );
    if (matchingGoal) {
      const isAchieved = jumpRecord.jumpHeightCm >= matchingGoal.targetValue;
      const updatedGoal: PerformanceGoal = {
        ...matchingGoal,
        currentValue: jumpRecord.jumpHeightCm,
        status: isAchieved ? 'Achieved' : 'In Progress',
        lastUpdated: jumpRecord.date,
      };
      setPerformanceGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
      if (!demoMode) {
        savePerformanceGoalToFirestore(updatedGoal).catch((e) =>
          console.warn('Auto-sync goal jump height to Firestore:', e)
        );
      }
    }

    if (demoMode) return;

    // Save to Firestore
    try {
      setIsCloudSyncing(true);
      await saveJumpRecordToFirestore(jumpRecord);
      await saveFitnessTestToFirestore(testRecord);
    } catch (e) {
      console.error('Failed to sync jump record to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Performance Goal Handlers
  const handleAddGoal = async (newGoal: Omit<PerformanceGoal, 'id' | 'createdAt'>) => {
    const goal: PerformanceGoal = {
      ...newGoal,
      id: `goal-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPerformanceGoals((prev) => [goal, ...prev]);

    if (demoMode) return;

    try {
      setIsCloudSyncing(true);
      await savePerformanceGoalToFirestore(goal);
    } catch (e) {
      console.error('Failed to sync goal to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleUpdateGoal = async (updatedGoal: PerformanceGoal) => {
    setPerformanceGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );

    if (demoMode) return;

    try {
      setIsCloudSyncing(true);
      await savePerformanceGoalToFirestore(updatedGoal);
    } catch (e) {
      console.error('Failed to update goal in Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    setPerformanceGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (demoMode) return;

    try {
      setIsCloudSyncing(true);
      await deletePerformanceGoalFromFirestore(goalId);
    } catch (e) {
      console.error('Failed to delete goal from Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleUpdateGoalCurrentValue = async (
    athleteId: string,
    metricType: GoalMetricType,
    newValue: number
  ) => {
    const targetGoal = performanceGoals.find(
      (g) => g.athleteId === athleteId && g.metricType === metricType
    );
    if (!targetGoal) return;

    const isAchieved = targetGoal.higherIsBetter
      ? newValue >= targetGoal.targetValue
      : newValue <= targetGoal.targetValue;

    const updatedGoal: PerformanceGoal = {
      ...targetGoal,
      currentValue: newValue,
      status: isAchieved ? 'Achieved' : 'In Progress',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setPerformanceGoals((prev) =>
      prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    );

    if (demoMode) return;

    try {
      await savePerformanceGoalToFirestore(updatedGoal);
    } catch (e) {
      console.error('Failed to auto-update goal value in Firestore:', e);
    }
  };

  const handleAddPainPoint = async (newPain: Omit<BodyPainPoint, 'id'>) => {
    const pain: BodyPainPoint = {
      ...newPain,
      id: `pn-${Date.now().toString().slice(-4)}`,
    };
    setPainPoints((prev) => [pain, ...prev]);

    let updatedAthlete: Athlete | undefined;
    if (newPain.painLevel >= 5) {
      setAthletes((prev) =>
        prev.map((a) => {
          if (a.id === newPain.athleteId && a.status === 'Fit') {
            updatedAthlete = { ...a, status: 'Observasi' };
            return updatedAthlete;
          }
          return a;
        })
      );
    }

    if (demoMode) return;

    // Save to Firestore
    try {
      setIsCloudSyncing(true);
      await savePainPointToFirestore(pain);
      if (updatedAthlete) {
        await saveAthleteToFirestore(updatedAthlete);
      }
    } catch (e) {
      console.error('Failed to sync pain point to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleUpdatePainStatus = async (id: string, status: BodyPainPoint['status']) => {
    let updatedPoint: BodyPainPoint | undefined;
    setPainPoints((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedPoint = { ...p, status };
          return updatedPoint;
        }
        return p;
      })
    );

    if (updatedPoint) {
      if (demoMode) return;

      try {
        await savePainPointToFirestore(updatedPoint);
      } catch (e) {
        console.error('Failed to update pain point status in Firestore:', e);
      }
    }
  };

  const handleAddAthlete = async (newAthlete: Athlete) => {
    setAthletes((prev) => [newAthlete, ...prev]);

    if (demoMode) return;

    try {
      setIsCloudSyncing(true);
      await saveAthleteToFirestore(newAthlete);
    } catch (e) {
      console.error('Failed to sync new athlete to Firestore:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset data lokal kembali ke data simulasi atlet awal?')) {
      localStorage.removeItem('athletaphysio_athletes');
      localStorage.removeItem('athletaphysio_sessions');
      localStorage.removeItem('athletaphysio_wellness');
      localStorage.removeItem('athletaphysio_tests');
      localStorage.removeItem('athletaphysio_pains');
      localStorage.removeItem('athletaphysio_goals');
      setAthletes(initialAthletes);
      setTrainingSessions(initialTrainingSessions);
      setWellnessLogs(initialWellnessLogs);
      setFitnessTests(initialFitnessTests);
      setPainPoints(initialPainPoints);
      setPerformanceGoals(initialPerformanceGoals);
    }
  };

  const openLogForAthlete = (athleteId?: string) => {
    setQuickLogAthleteId(athleteId);
    setQuickLogOpen(true);
  };

  // Evaluate real-time early warning risk alerts (ACWR outside 0.8-1.3 or Pain > 5 in last 24h)
  const athleteAlerts = evaluateAthleteAlerts(athletes, painPoints);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Strict Top Bar Contract with Firestore DB & Firebase Auth */}
      <Header
        demoMode={demoMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickLog={() => openLogForAthlete()}
        onExportCSV={() => exportAthletesToCSV(athletes)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isCloudSyncing={isCloudSyncing}
        alerts={athleteAlerts}
        onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
        onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {demoMode && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            Mode demo publik: data hanya tersimpan di browser perangkat ini dan tidak disinkronkan ke cloud.
          </div>
        )}
        {activeTab === 'overview' && (
          <AthleteOverview
            athletes={athletes}
            trainingSessions={trainingSessions}
            wellnessLogs={wellnessLogs}
            fitnessTests={fitnessTests}
            painPoints={painPoints}
            onNavigateTab={setActiveTab}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
            onOpenQuickLog={() => openLogForAthlete()}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            athletes={athletes}
            trainingSessions={trainingSessions}
            wellnessLogs={wellnessLogs}
            fitnessTests={fitnessTests}
            painPoints={painPoints}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
          />
        )}

        {activeTab === 'jump_vbt' && (
          <JumpAndVBTTracker
            athletes={athletes}
            goals={performanceGoals}
            onAddJumpRecord={handleAddJumpRecord}
            onUpdateGoalCurrentValue={handleUpdateGoalCurrentValue}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
          />
        )}

        {activeTab === 'goals' && (
          <PerformanceGoalsTracker
            athletes={athletes}
            goals={performanceGoals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
          />
        )}

        {activeTab === 'roster' && (
          <AthleteRoster
            athletes={athletes}
            alerts={athleteAlerts}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
            onOpenAddAthlete={() => setAddAthleteOpen(true)}
            onOpenLogSession={(athleteId) => openLogForAthlete(athleteId)}
          />
        )}

        {activeTab === 'acwr' && (
          <WorkloadACWRSection
            athletes={athletes}
            trainingSessions={trainingSessions}
            onOpenLogSession={(athleteId) => openLogForAthlete(athleteId)}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
          />
        )}

        {activeTab === 'wellness' && (
          <DailyWellnessTracker
            athletes={athletes}
            wellnessLogs={wellnessLogs}
            onAddWellnessLog={handleAddWellness}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
          />
        )}

        {activeTab === 'fitness' && (
          <FitnessBatterySection
            athletes={athletes}
            fitnessTests={fitnessTests}
            onAddFitnessTest={handleAddFitnessTest}
            onSelectAthleteDetail={(athlete) => setDetailAthlete(athlete)}
          />
        )}

        {activeTab === 'injuries' && (
          <InjuryPainTracker
            athletes={athletes}
            painPoints={painPoints}
            onAddPainPoint={handleAddPainPoint}
            onUpdatePainStatus={handleUpdatePainStatus}
            onSelectAthleteForAI={(athlete) => setAiAdvisorAthlete(athlete)}
          />
        )}
      </main>

      {/* Athlete Detail Modal */}
      {detailAthlete && (
        <AthleteDetailModal
          athlete={detailAthlete}
          onClose={() => setDetailAthlete(null)}
          trainingSessions={trainingSessions}
          wellnessLogs={wellnessLogs}
          fitnessTests={fitnessTests}
          painPoints={painPoints}
          goals={performanceGoals}
          onSelectAthleteForAI={(athlete) => {
            setDetailAthlete(null);
            setAiAdvisorAthlete(athlete);
          }}
          onOpenLogSession={(athleteId) => {
            setDetailAthlete(null);
            openLogForAthlete(athleteId);
          }}
        />
      )}

      {/* AI Sports Science Advisor Modal */}
      {aiAdvisorAthlete && (
        <AISportsAdvisorModal
          athlete={aiAdvisorAthlete}
          onClose={() => setAiAdvisorAthlete(null)}
          trainingSessions={trainingSessions}
          wellnessLogs={wellnessLogs}
          fitnessTests={fitnessTests}
          painPoints={painPoints}
        />
      )}

      {/* Quick Log Modal */}
      {quickLogOpen && (
        <QuickLogModal
          athletes={athletes}
          initialAthleteId={quickLogAthleteId}
          onClose={() => {
            setQuickLogOpen(false);
            setQuickLogAthleteId(undefined);
          }}
          onAddSession={handleAddSession}
          onAddWellness={handleAddWellness}
          onAddFitnessTest={handleAddFitnessTest}
        />
      )}

      {/* Add Athlete Modal */}
      {addAthleteOpen && (
        <AddAthleteModal
          onClose={() => setAddAthleteOpen(false)}
          onAddAthlete={handleAddAthlete}
        />
      )}

      {/* Quiet Sports Science Footer (anti-slop §1.B) */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              AthletaPhysio
            </span>
            <span aria-hidden="true">·</span>
            <span>Sistem Pemantauan Kondisi Fisik Atlet Berbasis Sports Science</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Google Cloud Firestore Connected
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline cursor-pointer"
            >
              Reset Data Contoh
            </button>
            <span aria-hidden="true">·</span>
            <span>Fakultas Ilmu Keolahragaan & Kesehatan</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
