import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "/src/firebaseConfig";
import { responsiveFontSizes, responsiveDimensions } from "../theme/responsiveTheme.js";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const isResetLinkVisit = mode === "resetPassword" && !!oobCode;

  useEffect(() => {
    document.title = "Droptimize - Reset Password";
  }, []);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      setEmailError("Invalid email format");
      return;
    }

    setEmailError("");
    setEmailLoading(true);

    try {
      const continueUrl =
        import.meta.env.VITE_PASSWORD_RESET_CONTINUE_URL ||
        `${window.location.origin}/reset-password`;

      await sendPasswordResetEmail(auth, trimmedEmail, {
        url: continueUrl,
        handleCodeInApp: false,
      });
      setEmailSent(true);
      setEmail("");
    } catch (err) {
      console.error("Error sending reset email:", err);
      setEmailError(err.message || "Failed to send password reset email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleOpenApp = () => {
    const appDeepLink = `droptimize://reset-password?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`;
    window.location.href = appDeepLink;
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ px: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 4, md: 5, lg: 5, xl: 6, xxl: 7 },
          width: "100%",
          maxWidth: responsiveDimensions.formWidth,
          borderRadius: "1rem",
          boxShadow: 3,
        }}
      >
        <Stack spacing={{ xs: 2, md: 2.5, lg: 3, xxl: 3.5 }} alignItems="center">
          <Box
            component="img"
            src="/logo.svg"
            alt="Droptimize Logo"
            sx={{
              maxWidth: { xs: 250, md: 280, lg: 300, xl: 300, xxl: 350 },
              mb: { xs: 1, md: 2 },
            }}
          />
          <Box textAlign="center">
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontFamily: "LEMON MILK",
                fontWeight: "bold",
                color: "#00b2e1",
                fontSize: responsiveFontSizes.h5,
              }}
            >
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: responsiveFontSizes.body2 }}>
              Enter your email to receive a password reset link
            </Typography>
          </Box>

          {emailError && (
            <Alert severity="error" onClose={() => setEmailError("")}>
              {emailError}
            </Alert>
          )}

          {isResetLinkVisit && (
            <Alert severity="info" sx={{ width: "100%" }}>
              Open this link in the Droptimize mobile app.
              <Button
                onClick={handleOpenApp}
                variant="contained"
                fullWidth
                sx={{
                  mt: 1.5,
                  background: "#00b2e1",
                  color: "#fff",
                  fontFamily: "LEMON MILK",
                  "&:hover": {
                    background: "#0064b5",
                  },
                  textTransform: "none",
                }}
              >
                Open in App
              </Button>
            </Alert>
          )}

          {emailSent && (
            <Alert severity="success">
              Password reset email has been sent! Please check your inbox and click the link to reset your password.
              <Typography variant="caption" display="block" mt={1}>
                The link will expire in 1 hour for security reasons.
              </Typography>
            </Alert>
          )}

          {!emailSent && (
            <form onSubmit={handleEmailSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  error={!!emailError}
                  helperText={emailError}
                  fullWidth
                  size="small"
                  disabled={emailLoading}
                  placeholder="Enter your registered email"
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: responsiveFontSizes.body1,
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: responsiveFontSizes.body1,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={emailLoading}
                  sx={{
                    height: responsiveDimensions.buttonHeight,
                    borderRadius: "10px",
                    background: "#00b2e1",
                    color: "#fff",
                    fontFamily: "LEMON MILK",
                    fontSize: responsiveFontSizes.button,
                    padding: `${responsiveDimensions.buttonPy.xs}rem ${responsiveDimensions.buttonPx.xs}rem`,
                    "&:hover": {
                      background: "#0064b5",
                    },
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                >
                  {emailLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Typography variant="body2" align="center" sx={{ fontSize: responsiveFontSizes.body2 }}>
                  Remember your password?{" "}
                  <Box
                    component="span"
                    onClick={() => navigate("/login")}
                    sx={{
                      color: "#00b2e1",
                      cursor: "pointer",
                      fontWeight: 600,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Go back to login
                  </Box>
                </Typography>
              </Stack>
            </form>
          )}

          {emailSent && (
            <Button
              onClick={() => setEmailSent(false)}
              variant="text"
              fullWidth
              sx={{
                color: "#00b2e1",
                fontSize: responsiveFontSizes.body2,
                textTransform: "none",
              }}
            >
              Didn't receive the email? Try another address
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
