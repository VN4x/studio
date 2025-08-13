import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "xvsdvzdxvzxvzxvzxvxz5E",
  authDomain: "montage1-24d2f.firebaseapp.com",
  projectId: "montage1-24d2f",
  storageBucket: "montage1-24d2f.appspot.com",
  messagingSenderId: "113198569544",
  appId: "YOUR_APP_ID_FROM_FIREBASE_CONSOLE"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
