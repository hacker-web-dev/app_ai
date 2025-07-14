
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoTgUy5XvoLLVupqkRZv_0tKxQrWdkSlk",
  authDomain: "appai-8d530.firebaseapp.com",
  projectId: "appai-8d530",
  storageBucket: "appai-8d530.firebasestorage.app",
  messagingSenderId: "826847247585",
  appId: "1:826847247585:web:c3ac21bda7f60a7e7f0ba0",
  measurementId: "G-L276R3W31C"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);