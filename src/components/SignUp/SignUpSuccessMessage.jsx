import { Box, Paper, Typography, CircularProgress, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";

export default function SignUpSuccessMessage() {
  const navigate = useNavigate();
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Force refresh to get latest email verification status
        await user.getIdTokenResult(true);
        setEmailVerified(user.emailVerified);
      }
      setCheckingVerification(false);
    });

    // Check verification status every 2 seconds
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setEmailVerified(auth.currentUser.emailVerified);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Auto-redirect when email is verified
  useEffect(() => {
    if (emailVerified) {
      const timer = setTimeout(() => {
        navigate("/account-setup", { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [emailVerified, navigate]);

  if (emailVerified) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: "#29bf12", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
            Email Verified!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your email has been verified successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to account setup...
          </Typography>
          <Box mt={2}>
            <CircularProgress size={24} color="primary" />
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ p: 4, textAlign: "center", borderRadius: 2, maxWidth: 400 }}>
        <CheckCircleIcon sx={{ fontSize: 60, color: "#00b2e1", mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
          Registration Successful!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          A verification email has been sent to your inbox.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please click the link in the email to verify your account. This page will automatically redirect once verified.
        </Typography>
        {checkingVerification && (
          <Box>
            <CircularProgress size={24} color="primary" />
            <Typography variant="body2" sx={{ mt: 2 }}>Checking verification status...</Typography>
          </Box>
        )}
        {!checkingVerification && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>Waiting for email verification...</Typography>
            <Button
              variant="text"
              color="primary"
              onClick={() => navigate("/login")}
              sx={{ fontSize: "0.875rem" }}
            >
              Back to Login
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
