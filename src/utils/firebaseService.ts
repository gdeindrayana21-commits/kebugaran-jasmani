import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, 
  query, orderBy, getDocs, getDoc, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AssessmentRecord, ScoreBenchmarksConfig } from '../types';
import { 
  getSavedRecords, saveRecords, getSavedBenchmarks, saveBenchmarks, 
  mergeAssessmentRecords, getPendingSyncRecords, addPendingSyncRecord, 
  removePendingSyncRecord, savePendingSyncRecords 
} from './storage';
import { getDefaultBenchmarksConfig } from './scoreCalculator';

const RECORDS_COLLECTION = 'assessment_records';
const BENCHMARKS_COLLECTION = 'benchmarks_config';
const BENCHMARKS_DOC_ID = 'sma1_tejakula_default';

/**
 * Flush any locally stored records that could not be saved to Firestore due to offline network
 */
export async function flushPendingSyncQueue(): Promise<number> {
  const pending = getPendingSyncRecords();
  if (pending.length === 0) return 0;

  let syncedCount = 0;
  for (const record of pending) {
    try {
      const docRef = doc(db, RECORDS_COLLECTION, record.id);
      await setDoc(docRef, {
        ...record,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      removePendingSyncRecord(record.id);
      syncedCount++;
    } catch (err) {
      console.warn(`Retry syncing pending record ${record.id} failed, will retry next time:`, err);
    }
  }
  return syncedCount;
}

// Auto-sync when device comes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network back online: flushing pending assessment records to Firestore...');
    flushPendingSyncQueue().catch(() => {});
  });
}

/**
 * Real-time listener for all student assessment records
 * Subscribes using onSnapshot to automatically stream updates when any student or teacher edits data.
 * Merges cloud records with local records to ensure zero data loss on spotty connections.
 */
export function subscribeToRecords(
  onUpdate: (records: AssessmentRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const recordsCol = collection(db, RECORDS_COLLECTION);
    const q = query(recordsCol);

    // Initial check on local records
    const initialLocal = getSavedRecords();
    if (initialLocal.length > 0) {
      onUpdate(initialLocal);
    }

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

          // Smart merge with local records so unsynced or newly saved local records are never erased
          const local = getSavedRecords();
          const merged = mergeAssessmentRecords(cloudRecords, local);

          // Save merged to local storage
          saveRecords(merged);
          onUpdate(merged);

          // Check if any local records need to be pushed up to Firestore (offline sync)
          flushPendingSyncQueue().catch(() => {});
        } else {
          // If Firestore is completely empty on initial setup, seed local cache to cloud
          const local = getSavedRecords();
          if (local.length > 0) {
            onUpdate(local);
            // Upload initial records to cloud in background
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
 * Immediately updates local state & pending queue first, then commits to Firestore.
 */
export async function saveRecordToFirestore(record: AssessmentRecord): Promise<void> {
  // Ensure record has a clean ID
  const docId = record.id || `rec-${Date.now()}`;
  const recordWithId = { ...record, id: docId };

  // 1. Immediately update local cache for zero-latency UI and local safety
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

  // 2. Add to pending sync queue in case network drops or browser unloads
  addPendingSyncRecord(recordWithId);

  // 3. Write to Firestore
  try {
    const docRef = doc(db, RECORDS_COLLECTION, docId);
    await setDoc(docRef, {
      ...recordWithId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Successfully saved to cloud, remove from pending sync queue
    removePendingSyncRecord(docId);
  } catch (err) {
    console.warn('Firestore write delayed/offline, record preserved locally in sync queue:', err);
    // Keep in pending sync queue for auto-retry
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
 * Delete ALL assessment records from Firestore and local cache
 */
export async function deleteAllRecordsFromFirestore(): Promise<number> {
  // 1. Clear local records and pending sync queue immediately
  saveRecords([]);
  localStorage.removeItem('pjok_pending_sync_queue');

  // 2. Fetch and delete all documents in assessment_records collection via batch
  try {
    const colRef = collection(db, RECORDS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return 0;
    }

    const docs = snap.docs;
    const batchSize = 400;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return docs.length;
  } catch (err) {
    console.error('Failed to delete all records from Firestore:', err);
    throw err;
  }
}

/**
 * Delete assessment records by specific Class from Firestore and local cache
 */
export async function deleteRecordsByClassFromFirestore(studentClass: string): Promise<number> {
  // 1. Update local cache
  const current = getSavedRecords();
  const kept = current.filter((r) => r.student.studentClass !== studentClass);
  saveRecords(kept);

  // 2. Query and delete from Firestore
  try {
    const colRef = collection(db, RECORDS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) return 0;

    const toDeleteDocs = snap.docs.filter((d) => {
      const data = d.data();
      return data && data.student && data.student.studentClass === studentClass;
    });

    if (toDeleteDocs.length === 0) return 0;

    const batchSize = 400;
    for (let i = 0; i < toDeleteDocs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = toDeleteDocs.slice(i, i + batchSize);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return toDeleteDocs.length;
  } catch (err) {
    console.error(`Failed to delete records for class ${studentClass} from Firestore:`, err);
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
