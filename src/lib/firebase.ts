import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Set local persistence
try {
  setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.warn('Could not set auth persistence:', e);
}

// Google Sign-In helper
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    // Propagate error with friendly Indonesian message
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela login Google ditutup sebelum proses selesai.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Jendela popup diblokir oleh browser. Harap izinkan popup di browser Anda.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(
        `Domain aplikasi ini (${window.location.hostname}) belum didaftarkan di Firebase Console > Authentication > Settings > Authorized Domains.`
      );
    } else {
      throw new Error(error.message || 'Gagal login dengan Google. Silakan coba kembali.');
    }
  }
}

// Sign-out helper
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { User };

// Error logging helper compliant with FirestoreErrorInfo standard
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Info:', errInfo);
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited, using local cache.');
    } else {
      console.info('Firebase initialized for project:', firebaseConfig.projectId);
    }
    return false;
  }
}
