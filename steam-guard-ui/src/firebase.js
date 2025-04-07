import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAeUzI3CMhsqE_55UfJJ7wB5pIWSkm2WoI",
  authDomain: "guard-checker-d5d91.firebaseapp.com",
  projectId: "guard-checker-d5d91",
  storageBucket: "guard-checker-d5d91.firebasestorage.app",
  messagingSenderId: "64528458070",
  appId: "1:64528458070:web:aa305476f2072ae493f6f7",
  measurementId: "G-N5FZFNQD3Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app); 