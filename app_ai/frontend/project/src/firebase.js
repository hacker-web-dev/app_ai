
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5aCHCM6qBDk_gHqz5VEEgoCn9HDAfuls",
  authDomain: "priceai-ba31f.firebaseapp.com",
  projectId: "priceai-ba31f",
  storageBucket: "priceai-ba31f.firebasestorage.app",
  messagingSenderId: "700426153729",
  appId: "1:700426153729:web:03074f6cae546521043500",
  measurementId: "G-M75QPKLKTK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);