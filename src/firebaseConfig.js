// Firebase imports
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Registers a new admin user by creating a Firebase Auth account and initializing their Firestore profile with basic information.
 * Sends an email verification to the provided email address and updates the user's display name with the full name from the form data.
 * Returns an object with success status and the created user object, or an error message if registration fails.
 */
export const registerUser = async (formData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const user = userCredential.user;
    const fullName = `${formData.firstName} ${formData.lastName}`;
    await sendEmailVerification(userCredential.user);
    await updateProfile(user, { displayName: fullName });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      createdAt: serverTimestamp(),
    });

    return { success: true, user };
  } catch (error) {
    console.error("Error registering user:", error.message);
    return { success: false, error: error };
  }
};

/**
 * Authenticates a user with email and password, validates their admin role from Firestore, and stores their information in localStorage.
 * Checks if a user profile exists in Firestore and verifies the role is "admin" before allowing access, signing out non-admin users immediately.
 * Returns an object with success status and user data, or an error message if authentication fails or access is denied.
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: new Error("No user profile found.") };
    }

    const role = userDoc.data().role;
    if (role !== "admin") {
      auth.signOut();
      return { success: false, error: new Error("Access denied. Only admins can log in.") };
    }

    localStorage.setItem("user", JSON.stringify(user));
    return { success: true, user };

  } catch (error) {
    console.error("Login error:", error.message);
    return { success: false, error };
  }
};

/**
 * Checks the current authentication state by listening to Firebase Auth state changes once and retrieving the user's Firestore profile.
 * Returns a promise that resolves with authentication status, email verification status, and merged user data from both Auth and Firestore.
 * Used during app initialization to restore admin sessions and verify authentication before allowing access to protected routes.
 */
export const checkAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); 
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        resolve({
          authenticated: true,
          emailVerified: user.emailVerified,
          user: { ...user, ...userDoc.data() },
        });
      } else {
        resolve({ authenticated: false });
      }
    });
  });
};