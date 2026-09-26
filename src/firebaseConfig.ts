import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import defaultAppletConfig from '../firebase-applet-config.json';

export interface AppFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const firebaseConfig: AppFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || defaultAppletConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || defaultAppletConfig.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || defaultAppletConfig.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || defaultAppletConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || defaultAppletConfig.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || defaultAppletConfig.appId,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || defaultAppletConfig.firestoreDatabaseId
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth: Auth = getAuth(app);

export default firebaseConfig;
