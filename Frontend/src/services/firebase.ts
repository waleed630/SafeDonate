import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (messaging) return messaging;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

export async function isPushSupported(): Promise<boolean> {
  return isSupported();
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function getPushToken(): Promise<string | null> {
  const supported = await isSupported();
  if (!supported || !vapidKey) return null;
  const msg = getFirebaseMessaging();
  if (!msg) return null;
  try {
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      serviceWorkerRegistration =
        (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready);
    }
    const token = await getToken(msg, {
      vapidKey,
      ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
    });
    return token;
  } catch {
    return null;
  }
}

export async function registerPushAndGetToken(): Promise<string | null> {
  const granted = await requestPushPermission();
  if (!granted) return null;
  return getPushToken();
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      vapidKey
  );
}
