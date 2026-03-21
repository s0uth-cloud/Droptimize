import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "/src/firebaseConfig";
import { responsiveFontSizes, responsiveDimensions } from "../theme/responsiveTheme.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [oobCode, setOobCode] = useState(null);

  useEffect(() => {
    document.title = "Droptimize - Reset Password";

    const code = searchParams.get("oobCode");
    if (!code) {
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, code)
      .then(() => {
        setOobCode(code);
        setVerifying(false);
      })
      .catch((err) => {
        console.error("Code verification error:", err.message);
        if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
          setError("This password reset link has expired. Please request a new one.");
        } else {
          setError("Invalid reset link. Please request a new password reset.");
        }
        setVerifying(false);
      });
  }, [searchParams]);

  const sendPasswordResetEmailWithRedirect = async (targetEmail) => {
    const functionUrl = import.meta.env.VITE_PASSWORD_RESET_FUNCTION_URL;
    if (!functionUrl) {
      throw new Error("VITE_PASSWORD_RESET_FUNCTION_URL is not configured.");
    }

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: targetEmail,
        webResetBaseUrl: `${window.location.origin}/reset-password`,
        source: "web",
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Failed to send reset email.");
    }
  };

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
      await sendPasswordResetEmailWithRedirect(trimmedEmail);
      setEmailSent(true);
      setEmail("");
    } catch (err) {
      console.error("Error sending reset email:", err);
      setEmailError(err.message || "Failed to send password reset email. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return "";
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, formData.password);
      setSuccess(true);
      setFormData({ password: "", confirmPassword: "" });

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Password reset error:", err.message);

      if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
        setError("This password reset link has expired. Please request a new one.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ px: 2 }}>
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
            <Typography
              variant="h6"
              align="center"
              sx={{
                fontFamily: "LEMON MILK",
                fontWeight: "bold",
                color: "#00b2e1",
                fontSize: responsiveFontSizes.h6,
              }}
            >
            Verifying reset link...
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (oobCode) {
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
                Enter your new password below
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {success && <Alert severity="success">Password reset successfully! Redirecting to login...</Alert>}

            {!success && !error && (
              <form onSubmit={handlePasswordSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="New Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    error={!!fieldErrors.password}
                    helperText={fieldErrors.password}
                    fullWidth
                    size="small"
                    disabled={loading}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: responsiveFontSizes.body1,
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: responsiveFontSizes.body1,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" disabled={loading}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!fieldErrors.confirmPassword}
                    helperText={fieldErrors.confirmPassword}
                    fullWidth
                    size="small"
                    disabled={loading}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: responsiveFontSizes.body1,
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: responsiveFontSizes.body1,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            edge="end"
                            disabled={loading}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
                      Password Requirements:
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: responsiveFontSizes.caption }}
                      color={formData.password.length >= 8 ? "green" : "textSecondary"}
                    >
                      - At least 8 characters
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: responsiveFontSizes.caption }}
                      color={/[A-Z]/.test(formData.password) ? "green" : "textSecondary"}
                    >
                      - One uppercase letter
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: responsiveFontSizes.caption }}
                      color={/[a-z]/.test(formData.password) ? "green" : "textSecondary"}
                    >
                      - One lowercase letter
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: responsiveFontSizes.caption }}
                      color={/[0-9]/.test(formData.password) ? "green" : "textSecondary"}
                    >
                      - One number
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
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
                    {loading ? "Resetting..." : "Reset Password"}
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
          </Stack>
        </Paper>
      </Box>
    );
  }

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
