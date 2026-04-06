/**
 * Route guard to protect admin pages and enforce account setup
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * ProtectedRoute component that checks:
 * 1. User is authenticated
 * 2. User has completed account setup (has branchId)
 * 3. User is an admin
 * 
 * Redirects to appropriate page based on auth state:
 * - Not authenticated → /login
 * - Authenticated but account setup incomplete → /account-setup
 * - Authenticated and setup complete → Allow access
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not logged in
        navigate("/login", { replace: true });
        setLoading(false);
        return;
      }

      try {
        // Check if user has completed Firestore profile
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // User document doesn't exist, needs account setup
          navigate("/account-setup", { replace: true });
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        // Check if account setup is complete (has branchId)
        if (!userData.branchId) {
          navigate("/account-setup", { replace: true });
          setLoading(false);
          return;
        }

        // Check if user is admin
        if (userData.role !== "admin") {
          navigate("/login", { replace: true });
          setLoading(false);
          return;
        }

        // All checks passed
        setAuthorized(true);
      } catch (error) {
        console.error("Error checking authorization:", error);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!authorized) {
    return null; // Will redirect via useEffect
  }

  return children;
}
