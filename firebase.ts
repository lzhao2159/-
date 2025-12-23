
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const firebaseConfigStr = process.env.FIREBASE_CONFIG;

try {
  if (firebaseConfigStr && firebaseConfigStr !== '{}') {
    const config = JSON.parse(firebaseConfigStr);
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export const isFirebaseEnabled = (): boolean => {
  return auth !== null && db !== null;
};

export { auth, db };
