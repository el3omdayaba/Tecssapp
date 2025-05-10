// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyChJ60aVSQGo-Jkl3oZM0XDiMSh1rLHyYI",
  authDomain: "tecssapp-56a5e.firebaseapp.com",
  projectId: "tecssapp-56a5e",
  storageBucket: "tecssapp-56a5e.firebasestorage.app",
  messagingSenderId: "878521005734",
  appId: "1:878521005734:web:397812bbc76cf08e1ee667"
};

// ✅ Initialize app once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app); // ✅ Add this line

export { app, db }; // ✅ Export both app and db
