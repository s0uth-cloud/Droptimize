// Firebase imports
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
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
const PROFILE_FUNCTION_URL =
  import.meta.env.VITE_PROFILE_FUNCTION_URL ||
  "https://asia-southeast1-droptimize-4b6fc.cloudfunctions.net/upsertUserProfile";

/**
 * Registers a new admin user by creating a Firebase Auth account and initializing their Firestore profile with basic information.
 * Sends an email verification to the provided email address and updates the user's display name with the full name from the form data.
 * Returns an object with success status and the created user object, or an error message if registration fails.
 */
export const registerUser = async (formData) => {
  let createdUser = null;

  try {
    const normalizedEmail = formData.email.trim().toLowerCase();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      formData.password
    );
    const user = userCredential.user;
    createdUser = user;
    const fullName = `${formData.firstName} ${formData.lastName}`;
    await updateProfile(user, { displayName: fullName });

    const idToken = await user.getIdToken();
    const profileRes = await fetch(PROFILE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: "admin",
      }),
    });

    if (!profileRes.ok) {
      const payload = await profileRes.json().catch(() => ({}));
      const message =
        payload?.message || "Failed to create user profile. Please try again.";
      const profileError = new Error(message);
      profileError.code = payload?.error || "auth/profile-write-denied";
      throw profileError;
    }

    await sendEmailVerification(userCredential.user);

    return { success: true, user };
  } catch (error) {
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (cleanupError) {
        console.error("Register cleanup error:", cleanupError.message);
      }
    }

    if (
      error?.code === "permission-denied" ||
      error?.code === "profile-write-failed" ||
      error?.code === "auth/profile-write-denied"
    ) {
      return {
        success: false,
        error: {
          code: "auth/profile-write-denied",
          message:
            "Account creation was blocked by database permissions. Please contact support.",
        },
      };
    }

    console.error("Error registering user:", error.message);
    return { success: false, error: error };
  }
};

/**
 * Authenticates a user with email and password, validates their admin role from Firestore, and stores their information in localStorage.
 * Checks if a user profile exists in Firestore and verifies the role is "admin" before allowing access, signing out non-admin users immediately.
 * Returns an object with success status and user data, or an error message if authentication fails or access is denied.
 */
export const loginUser = async (email, password, rememberMe = false) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await signOut(auth);
      return {
        success: false,
        error: {
          code: "auth/no-user-profile",
          message:
            "No account profile found. Please register again or contact support.",
        },
      };
    }

    const role = userDoc.data().role;
    if (role !== "admin") {
      await signOut(auth);
      return {
        success: false,
        error: {
          code: "auth/forbidden-role",
          message: "Access denied. Only admins can log in.",
        },
      };
    }

    if (!user.emailVerified) {
      await signOut(auth);
      return {
        success: false,
        error: {
          code: "auth/email-not-verified",
          message: "Please verify your email before logging in. Check your inbox for the verification link.",
        },
      };
    }

    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("rememberMe", "true");
      sessionStorage.removeItem("user");
    } else {
      sessionStorage.setItem("user", JSON.stringify(user));
      localStorage.removeItem("user");
      localStorage.removeItem("rememberMe");
    }

    return { success: true, user };

  } catch (error) {
    console.error("Login error:", error.code);
    
    // Map Firebase error codes to safe user-facing messages
    const SAFE_ERROR_MESSAGES = {
      "auth/user-not-found": "Invalid email or password",
      "auth/wrong-password": "Invalid email or password",
      "auth/invalid-email": "Please enter a valid email address",
      "auth/too-many-requests": "Too many failed login attempts. Please try again later.",
      "permission-denied": "Access denied for this account. Please contact support.",
    };
    
    const safeMessage = SAFE_ERROR_MESSAGES[error?.code] || "An error occurred. Please try again.";
    return {
      success: false,
      error: {
        code: error?.code || "auth/unknown-error",
        message: safeMessage,
      },
    };
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