// Firebase SDK configuration matching the ESP8266 firmware
import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  push,
  serverTimestamp 
} from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Clean out any stale local storage configs from previous configurations
try {
  localStorage.removeItem('iv_firebase_config');
  localStorage.removeItem('iv_custom_rtdb_url');
} catch (e) {}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app;
let database;
let auth;

try {
  if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    database = getDatabase(app);
    auth = getAuth(app);
  } else {
    console.warn("Firebase configuration is missing or incomplete. Please verify your .env file.");
  }
} catch (err) {
  console.warn("Firebase initialization note:", err.message);
}

export { app, database, auth };

// Realtime Database listeners
export function listenToFirebaseDevices(onData, onError) {
  if (!database) return () => {};
  try {
    const devicesRef = ref(database, 'devices');
    const unsubscribe = onValue(
      devicesRef, 
      (snapshot) => {
        const val = snapshot.val();
        onData(val);
      },
      (error) => {
        console.warn("RTDB Devices listener error:", error.message);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Firebase listener exception:", e);
    return () => {};
  }
}

export function listenToFirebaseAlerts(onData, onError) {
  if (!database) return () => {};
  try {
    const alertsRef = ref(database, 'alerts');
    const unsubscribe = onValue(
      alertsRef,
      (snapshot) => {
        const val = snapshot.val();
        onData(val);
      },
      (error) => {
        console.warn("RTDB Alerts listener error:", error.message);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn("Firebase alerts listener exception:", e);
    return () => {};
  }
}

// Write device update to Firebase
export async function pushDeviceUpdate(deviceId, data) {
  if (!database) return false;
  try {
    const deviceRef = ref(database, `devices/${deviceId}`);
    await update(deviceRef, {
      ...data
    });
    return true;
  } catch (err) {
    console.warn("Failed to push device update to Firebase:", err.message);
    return false;
  }
}

// Delete device from Firebase RTDB
export async function deleteFirebaseDevice(deviceId) {
  if (!database || !deviceId) return false;
  try {
    const deviceRef = ref(database, `devices/${deviceId}`);
    await set(deviceRef, null);
    return true;
  } catch (err) {
    console.warn("Failed to sync devices to Firebase:", err.message);
    return false;
  }
}

// Log alert to Firebase /alerts/
export async function pushAlert(alertData) {
  if (!database) return false;
  try {
    const timestamp = Date.now();
    const alertRef = ref(database, `alerts/${timestamp}`);
    await set(alertRef, {
      ...alertData,
      timestamp
    });
    return true;
  } catch (err) {
    console.warn("Failed to push alert to Firebase:", err.message);
    return false;
  }
}

// Update an alert in Firebase (e.g. acknowledge)
export async function updateFirebaseAlert(alertId, data) {
  if (!database || !alertId) return false;
  try {
    const alertRef = ref(database, `alerts/${alertId}`);
    await update(alertRef, data);
    return true;
  } catch (err) {
    console.warn("Failed to update Firebase alert:", err.message);
    return false;
  }
}

// Clamp command write (sends servo command back to ESP8266)
export async function setServoCommand(deviceId, command) {
  if (!database) return false;
  try {
    const cmdRef = ref(database, `devices/${deviceId}/servoCommand`);
    await set(cmdRef, command);
    return true;
  } catch (e) {
    console.warn("Set servo command failed:", e);
    return false;
  }
}

// Clear all alerts from Firebase /alerts/
export async function clearFirebaseAlerts() {
  if (!database) return false;
  try {
    const alertsRef = ref(database, 'alerts');
    await set(alertsRef, null);
    return true;
  } catch (err) {
    console.warn("Failed to clear Firebase alerts:", err.message);
    return false;
  }
}

