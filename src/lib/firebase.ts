import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfigData) : getApp();

// Initialize Firestore instance using databaseId if provided
export const db: Firestore = (firebaseConfigData as any).firestoreDatabaseId
  ? getFirestore(firebaseApp, (firebaseConfigData as any).firestoreDatabaseId)
  : getFirestore(firebaseApp);
