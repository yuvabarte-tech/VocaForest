import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Global suppression of benign IndexedDB closing/hidden errors from browser caching
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason || '');
    if (message.includes('Database is closing') || message.includes('closing/hidden')) {
      console.warn('Caught and suppressed benign Firebase IndexedDB closing/hidden event:', message);
      event.preventDefault();
    }
  });
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch {
  auth = getAuth(app);
}

const provider = new GoogleAuthProvider();
// Request Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.setCustomParameters({ prompt: 'consent' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (maxRetries = 2): Promise<{ user: User; accessToken: string } | null> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to get access token from Firebase Auth');
      }

      cachedAccessToken = credential.accessToken;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const errMsg = error?.message || String(error || '');
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Sign in was cancelled by the user.');
        throw error;
      } else if (
        (errMsg.includes('Database is closing') || errMsg.includes('closing/hidden')) &&
        attempt < maxRetries
      ) {
        attempt++;
        console.warn(`Database closing error encountered during sign in. Retrying attempt ${attempt}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      } else {
        console.error('Sign in error:', error);
        throw error;
      }
    } finally {
      isSigningIn = false;
    }
  }
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (err) {
    console.warn('Error signing out auth instance:', err);
  }
  cachedAccessToken = null;
};

