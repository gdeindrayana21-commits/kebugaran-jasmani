import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, initializeFirestore, Firestore, 
  persistentLocalCache, persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Initialize Firestore instance using databaseId and persistent offline cache
let dbInstance: Firestore;
const databaseId = (firebaseConfigData as any).firestoreDatabaseId;

try {
  dbInstance = initializeFirestore(
    firebaseApp, 
    {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    }, 
    databaseId
  );
} catch {
  dbInstance = databaseId
    ? getFirestore(firebaseApp, databaseId)
    : getFirestore(firebaseApp);
}

export const db: Firestore = dbInstance;
