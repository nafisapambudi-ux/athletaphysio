import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Athlete,
  TrainingSessionLog,
  WellnessLog,
  FitnessTestRecord,
  BodyPainPoint,
  JumpMeasurementRecord,
  VBTSessionRecord,
  PerformanceGoal,
} from '../types/athlete';
import { initialAthletes, initialTrainingSessions, initialWellnessLogs, initialFitnessTests, initialPainPoints, initialPerformanceGoals } from '../data/initialData';
import { initialJumpRecords, initialVBTRecords } from '../utils/jumpAndVBT';

const getOwnerId = (): string => {
  const ownerId = auth.currentUser?.uid;
  if (!ownerId) throw new Error('Sign in is required to access cloud athlete records.');
  return ownerId;
};

const getOwnedCollection = (collectionName: string) =>
  query(collection(db, collectionName), where('ownerId', '==', getOwnerId()));

const reportSubscriptionError = (
  error: unknown,
  collectionName: string,
  onError?: (error: unknown) => void
) => {
  try {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  } catch (reportedError) {
    if (!onError) throw reportedError;
    onError(reportedError);
  }
};

// ==========================================
// 1. ATHLETES COLLECTION
// ==========================================
const ATHLETES_COL = 'athletes';

export const subscribeAthletes = (onData: (athletes: Athlete[]) => void, onError?: (err: unknown) => void) => {
  const colRef = getOwnedCollection(ATHLETES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const data: Athlete[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Athlete, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, ATHLETES_COL, onError);
    }
  );
};

export const saveAthleteToFirestore = async (athlete: Athlete): Promise<void> => {
  const docRef = doc(db, ATHLETES_COL, athlete.id);
  const payload = {
    ...athlete,
    ownerId: getOwnerId(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATHLETES_COL}/${athlete.id}`);
  }
};

export const deleteAthleteFromFirestore = async (athleteId: string): Promise<void> => {
  const docRef = doc(db, ATHLETES_COL, athleteId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ATHLETES_COL}/${athleteId}`);
  }
};

// ==========================================
// 2. TRAINING SESSIONS COLLECTION
// ==========================================
const SESSIONS_COL = 'trainingSessions';

export const subscribeTrainingSessions = (
  onData: (sessions: TrainingSessionLog[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(SESSIONS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: TrainingSessionLog[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<TrainingSessionLog, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, SESSIONS_COL, onError);
    }
  );
};

export const saveTrainingSessionToFirestore = async (session: TrainingSessionLog): Promise<void> => {
  const docRef = doc(db, SESSIONS_COL, session.id);
  const payload = {
    ...session,
    ownerId: getOwnerId(),
    savedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SESSIONS_COL}/${session.id}`);
  }
};

// ==========================================
// 3. WELLNESS LOGS COLLECTION
// ==========================================
const WELLNESS_COL = 'wellnessLogs';

export const subscribeWellnessLogs = (
  onData: (logs: WellnessLog[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(WELLNESS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: WellnessLog[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<WellnessLog, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, WELLNESS_COL, onError);
    }
  );
};

export const saveWellnessLogToFirestore = async (log: WellnessLog): Promise<void> => {
  const docRef = doc(db, WELLNESS_COL, log.id);
  const payload = {
    ...log,
    ownerId: getOwnerId(),
    savedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${WELLNESS_COL}/${log.id}`);
  }
};

// ==========================================
// 4. FITNESS TESTS COLLECTION
// ==========================================
const FITNESS_COL = 'fitnessTests';

export const subscribeFitnessTests = (
  onData: (tests: FitnessTestRecord[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(FITNESS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: FitnessTestRecord[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<FitnessTestRecord, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, FITNESS_COL, onError);
    }
  );
};

export const saveFitnessTestToFirestore = async (test: FitnessTestRecord): Promise<void> => {
  const docRef = doc(db, FITNESS_COL, test.id);
  const payload = {
    ...test,
    ownerId: getOwnerId(),
    savedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${FITNESS_COL}/${test.id}`);
  }
};

// ==========================================
// 5. PAIN POINTS COLLECTION
// ==========================================
const PAIN_COL = 'painPoints';

export const subscribePainPoints = (
  onData: (points: BodyPainPoint[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(PAIN_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: BodyPainPoint[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<BodyPainPoint, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, PAIN_COL, onError);
    }
  );
};

export const savePainPointToFirestore = async (point: BodyPainPoint): Promise<void> => {
  const docRef = doc(db, PAIN_COL, point.id);
  const payload = {
    ...point,
    ownerId: getOwnerId(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PAIN_COL}/${point.id}`);
  }
};

// ==========================================
// 6. JUMP MEASUREMENTS COLLECTION (VJ/CMJ)
// ==========================================
const JUMPS_COL = 'jumpMeasurements';

export const subscribeJumpRecords = (
  onData: (records: JumpMeasurementRecord[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(JUMPS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: JumpMeasurementRecord[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<JumpMeasurementRecord, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, JUMPS_COL, onError);
    }
  );
};

export const saveJumpRecordToFirestore = async (record: JumpMeasurementRecord): Promise<void> => {
  const docRef = doc(db, JUMPS_COL, record.id);
  const payload = {
    ...record,
    ownerId: getOwnerId(),
    savedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${JUMPS_COL}/${record.id}`);
  }
};

// ==========================================
// 7. VBT SESSIONS COLLECTION
// ==========================================
const VBT_COL = 'vbtSessions';

export const subscribeVBTRecords = (
  onData: (records: VBTSessionRecord[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(VBT_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: VBTSessionRecord[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<VBTSessionRecord, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, VBT_COL, onError);
    }
  );
};

export const saveVBTRecordToFirestore = async (record: VBTSessionRecord): Promise<void> => {
  const docRef = doc(db, VBT_COL, record.id);
  const payload = {
    ...record,
    ownerId: getOwnerId(),
    savedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${VBT_COL}/${record.id}`);
  }
};

// ==========================================
// 8. PERFORMANCE GOALS COLLECTION
// ==========================================
const GOALS_COL = 'performanceGoals';

export const subscribePerformanceGoals = (
  onData: (goals: PerformanceGoal[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = getOwnedCollection(GOALS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const data: PerformanceGoal[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PerformanceGoal, 'id'>),
      }));
      onData(data);
    },
    (error) => {
      reportSubscriptionError(error, GOALS_COL, onError);
    }
  );
};

export const savePerformanceGoalToFirestore = async (goal: PerformanceGoal): Promise<void> => {
  const docRef = doc(db, GOALS_COL, goal.id);
  const payload = {
    ...goal,
    ownerId: getOwnerId(),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${GOALS_COL}/${goal.id}`);
  }
};

export const deletePerformanceGoalFromFirestore = async (goalId: string): Promise<void> => {
  const docRef = doc(db, GOALS_COL, goalId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GOALS_COL}/${goalId}`);
  }
};

// ==========================================
// SEEDING SERVICE: PRE-POPULATE FIRESTORE
// ==========================================
export const seedFirestoreIfEmpty = async (): Promise<boolean> => {
  try {
    const athletesSnap = await getDocs(getOwnedCollection(ATHLETES_COL));
    if (athletesSnap.empty) {
      console.log('Seeding initial athletes into Firestore...');
      const owner = getOwnerId();
      
      // Batch seed athletes
      for (const a of initialAthletes) {
        await setDoc(doc(db, ATHLETES_COL, a.id), { ...a, ownerId: owner });
      }

      // Seed training sessions
      for (const s of initialTrainingSessions) {
        await setDoc(doc(db, SESSIONS_COL, s.id), { ...s, ownerId: owner });
      }

      // Seed wellness logs
      for (const w of initialWellnessLogs) {
        await setDoc(doc(db, WELLNESS_COL, w.id), { ...w, ownerId: owner });
      }

      // Seed fitness tests
      for (const f of initialFitnessTests) {
        await setDoc(doc(db, FITNESS_COL, f.id), { ...f, ownerId: owner });
      }

      // Seed pain points
      for (const p of initialPainPoints) {
        await setDoc(doc(db, PAIN_COL, p.id), { ...p, ownerId: owner });
      }

      // Seed jumps
      for (const j of initialJumpRecords) {
        await setDoc(doc(db, JUMPS_COL, j.id), { ...j, ownerId: owner });
      }

      // Seed VBT
      for (const v of initialVBTRecords) {
        await setDoc(doc(db, VBT_COL, v.id), { ...v, ownerId: owner });
      }

      // Seed Goals
      for (const g of initialPerformanceGoals) {
        await setDoc(doc(db, GOALS_COL, g.id), { ...g, ownerId: owner });
      }

      console.log('Firestore seed completed successfully.');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error during initial seed check:', err);
    throw err;
  }
};
