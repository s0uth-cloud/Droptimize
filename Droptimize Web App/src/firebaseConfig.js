import {  initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDN1bjGNNKjGter73XQkk9x-taDt1od4Xg",
  authDomain: "droptimize-27544.firebaseapp.com",
  projectId: "droptimize-27544",
  storageBucket: "droptimize-27544.firebasestorage.app",
  messagingSenderId: "488908981770",
  appId: "1:488908981770:web:ab6a4b220ff5c0fed181f3",
  measurementId: "G-KRY0EK9PB8"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export default app;