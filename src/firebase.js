// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjz-CXYxjsGqnpk9km8KSgU_viD6nbleU",
  authDomain: "recipe-app-f8fd3.firebaseapp.com",
  projectId: "recipe-app-f8fd3",
  storageBucket: "recipe-app-f8fd3.firebasestorage.app",
  messagingSenderId: "386263044558",
  appId: "1:386263044558:web:a9fbf6cc540f9028f75b9f",
  measurementId: "G-6B2E2NHR6V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const ANALYTICS = getAnalytics(app);

// Initialize Firestore (The database)
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
