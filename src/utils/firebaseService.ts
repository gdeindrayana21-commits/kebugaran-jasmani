import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, 
  query, orderBy, getDocs, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AssessmentRecord, ScoreBenchmarksConfig } from '../types';
import { getSavedRecords, saveRecords, getSavedBenchmarks, saveBenchmarks } from './storage';
import { getDefaultBenchmarksConfig } from './scoreCalculator';

const RECORDS_COLLECTION = 'assessment_records';
const BENCHMARKS_COLLECTION = 'benchmarks_config';
const BENCHMARKS_DOC_ID = 'sma1_tejakula_default';

/**
 * Real-time listener for all student assessment records
 * Subscribes using onSnapshot to automatically stream updates when any student or teacher edits data.
 */
export function subscribeToRecords(
  onUpdate: (records: AssessmentRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const recordsCol = collection(db, RECORDS_COLLECTION);
    const q = query(recordsCol);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudRecords: AssessmentRecord[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              timestamp: data.timestamp || new Date().toISOString(),
              student: data.student,
              tests: data.tests,
              totalScore: data.totalScore || 0,
              finalScore: data.finalScore || 0,
              predicate: data.predicate || 'KURANG',
              notes: data.notes || '',
            } as AssessmentRecord;
          });

          // Sort by timestamp descending
          cloudRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          // Backup to local storage for offline resilience
          saveRecords(cloudRecords);
          onUpdate(cloudRecords);
        } else {
          // If Firestore is completely empty on initial setup, seed local cache to cloud
          const local = getSavedRecords();
          if (local.length > 0) {
            onUpdate(local);
            // Upload initial sample records to cloud in background
            local.forEach((rec) => {
              saveRecordToFirestore(rec).catch(() => {});
            });
          } else {
            onUpdate([]);
          }
        }
      },
      (err) => {
        console.warn('Firestore real-time listener fallback to local cache:', err);
        const local = getSavedRecords();
        onUpdate(local);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Firestore subscription, using local cache:', err);
    const local = getSavedRecords();
    onUpdate(local);
    return () => {};
  }
}

/**
 * Save / Update an assessment record in real-time Firestore database
 */
export async function saveRecordToFirestore(record: AssessmentRecord): Promise<void> {
  // Ensure record has a clean ID
  const docId = record.id || `rec-${Date.now()}`;
  const recordWithId = { ...record, id: docId };

  try {
    const docRef = doc(db, RECORDS_COLLECTION, docId);
    await setDoc(docRef, {
      ...recordWithId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Also update local cache immediately for zero-latency response
    const current = getSavedRecords();
    const idx = current.findIndex((r) => r.id === docId);
    let updated: AssessmentRecord[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = recordWithId;
    } else {
      updated = [recordWithId, ...current];
    }
    saveRecords(updated);
  } catch (err) {
    console.error('Firestore save failed, persisting locally:', err);
    // Offline resilience: save locally
    const current = getSavedRecords();
    const idx = current.findIndex((r) => r.id === docId);
    let updated: AssessmentRecord[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = recordWithId;
    } else {
      updated = [recordWithId, ...current];
    }
    saveRecords(updated);
    throw err;
  }
}

/**
 * Delete an assessment record from Firestore
 */
export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  try {
    const docRef = doc(db, RECORDS_COLLECTION, recordId);
    await deleteDoc(docRef);

    // Update local cache
    const current = getSavedRecords();
    const filtered = current.filter((r) => r.id !== recordId);
    saveRecords(filtered);
  } catch (err) {
    console.error('Firestore delete failed, removing locally:', err);
    const current = getSavedRecords();
    const filtered = current.filter((r) => r.id !== recordId);
    saveRecords(filtered);
    throw err;
  }
}

/**
 * Real-time listener for scoring benchmarks configuration
 */
export function subscribeToBenchmarks(
  onUpdate: (benchmarks: ScoreBenchmarksConfig) => void
): () => void {
  try {
    const docRef = doc(db, BENCHMARKS_COLLECTION, BENCHMARKS_DOC_ID);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.config) {
            saveBenchmarks(data.config);
            onUpdate(data.config);
            return;
          }
        }
        // Fallback to local
        const local = getSavedBenchmarks();
        onUpdate(local);
      },
      (err) => {
        console.warn('Benchmarks snapshot error:', err);
        const local = getSavedBenchmarks();
        onUpdate(local);
      }
    );
    return unsubscribe;
  } catch {
    const local = getSavedBenchmarks();
    onUpdate(local);
    return () => {};
  }
}

/**
 * Save custom score benchmarks to Firestore
 */
export async function saveBenchmarksToFirestore(config: ScoreBenchmarksConfig): Promise<void> {
  try {
    const docRef = doc(db, BENCHMARKS_COLLECTION, BENCHMARKS_DOC_ID);
    await setDoc(docRef, {
      config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    saveBenchmarks(config);
  } catch (err) {
    console.error('Failed to sync benchmarks to Firestore, saving locally:', err);
    saveBenchmarks(config);
  }
}
