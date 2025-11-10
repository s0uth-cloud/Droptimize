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
  Checkbox,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { checkAuth, auth , loginUser } from "../firebaseConfig";
import { responsiveFontSizes, responsiveDimensions } from "../theme/responsiveTheme.js";

export default function LogInForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Droptimize - Log In";
    checkAuth().then(({ authenticated }) => {
      if (authenticated) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trimStart() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPassword = formData.password.trim();

    const newErrors = {};
    if (!trimmedEmail) newErrors.email = "Email is required";
    if (!trimmedPassword) newErrors.password = "Password is required";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail && !emailPattern.test(trimmedEmail)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setFieldErrors({});
    setError("");
    setLoading(true);

    try {
      const { success, error } = await loginUser(trimmedEmail, trimmedPassword);

      if (success) {
        navigate("/dashboard");
      } else {
        console.log("Login error code:", error.code); 
        const code = error.code || "";
        if (code.includes("auth/user-not-found")) {
          setFieldErrors({ email: "No account found with this email" });
        } else if (code.includes("auth/wrong-password")) {
          setFieldErrors({ password: "Incorrect password" });
        } else {
          setError("Login failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(formData.email.trim().toLowerCase());
    setResetError("");
    setResetSuccess(false);
    setForgotPasswordOpen(true);
  };

  const closeForgotPassword = () => {
    setForgotPasswordOpen(false);
    setResetError("");
    setResetSuccess(false);
  };

const handleResetPassword = async () => {
  if (!resetEmail) {
    setResetError("Please enter your email.");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(resetEmail.trim())) {
    setResetError("Invalid email format.");
    return;
  }

  setResetError("");
  setResetLoading(true);

  try {
    const email = resetEmail.trim();

    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    console.log("Forgot password - signInMethods:", signInMethods);

    if (signInMethods.length === 0) {
      setResetError("No account found with this email.");
      setResetLoading(false);
      return;
    }

    await sendPasswordResetEmail(auth, email);
    setResetSuccess(true);
  } catch (err) {
    setResetError(err.message || "Failed to send reset email.");
  } finally {
    setResetLoading(false);
  }
};


  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ px: 2 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 3, md: 4, xl: 4, xxl: 5 },
          width: "100%",
          maxWidth: responsiveDimensions.formWidth,
          borderRadius: "1rem",
          boxShadow: 3,
        }}
      >
        <Stack spacing={{ xs: 1.5, md: 2, xxl: 2.5 }} alignItems="center">
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
            variant="h5"
            align="center"
            sx={{
              fontFamily: "LEMON MILK",
              fontWeight: "bold",
              color: "#00b2e1",
              fontSize: responsiveFontSizes.h5,
            }}
          >
            Log In
          </Typography>

          {error && (
            <Typography variant="body2" color="error" align="center" sx={{ fontSize: responsiveFontSizes.body2 }}>
              {error}
            </Typography>
          )}

          <TextField
            label="Email"
            name="email"
            type="email"
            variant="outlined"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email || ""}
            size="small"
            sx={{
              mb: 2,
              '& .MuiInputBase-root': {
                fontSize: responsiveFontSizes.body1,
              },
              '& .MuiInputLabel-root': {
                fontSize: responsiveFontSizes.body1,
              },
            }}
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || ""}
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: responsiveFontSizes.body1,
              },
              '& .MuiInputLabel-root': {
                fontSize: responsiveFontSizes.body1,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
            <Box display="flex" alignItems="center">
              <Checkbox
                color="primary"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{
                  p: 0,
                  mr: 1,
                  font: "inherit",
                }}
                id="rememberMe"
              />
              <Typography variant="body2" sx={{ fontSize: responsiveFontSizes.body2 }}>Remember me</Typography>
            </Box>

            <Link
              type="button" 
              component="button"
                onClick={(e) => {
                  e.preventDefault(); 
                  openForgotPassword();
                }}
              underline="hover"
              sx={{
                fontSize: responsiveFontSizes.body2,
                color: "#00b2e1",
                fontWeight: 600,
                cursor: "pointer",
                background: "none",
                border: "none",
                p: 0,
              }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              height: responsiveDimensions.buttonHeight,
              borderRadius: "10px",
              background: "#00b2e1",
              fontFamily: "LEMON MILK",
              fontSize: responsiveFontSizes.button,
              padding: `${responsiveDimensions.buttonPy.xs}rem ${responsiveDimensions.buttonPx.xs}rem`,
              margin: "1rem 0",
              "&:hover": {
                background: "#0064b5",
              },
              textTransform: "none",
            }}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <Typography variant="body2" align="center" sx={{ fontSize: responsiveFontSizes.body2 }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              underline="hover"
              sx={{
                color: "#00b2e1",
                fontWeight: 600,
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Stack>

        {/* Forgot Password Modal */}
        <Dialog
          open={forgotPasswordOpen}
          onClose={closeForgotPassword}
          PaperProps={{
            sx: {
              p: 1,
              borderRadius: "1rem",
              width: { xs: 320, md: 380, lg: 400, xl: 400, xxl: 450 },
              maxWidth: "90%",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "LEMON MILK",
              fontWeight: "bold",
              color: "#00b2e1",
              fontSize: responsiveFontSizes.h5,
              textAlign: "center",
            }}
          >
            Reset Password
          </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
        {resetSuccess ? (
        <Typography
        sx={{
        mt: 1,
        textAlign: "center",
        fontSize: responsiveFontSizes.body1,
        color: "#29bf12",
        }}
        >
        Password reset email sent! Please check your inbox. </Typography>
        ) : (
        <TextField
        autoFocus
        margin="dense"
        label="Email Address"
        type="email"
        fullWidth
        variant="outlined"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value.trimStart().toLowerCase())}
        error={!!resetError}
        helperText={resetError}
        disabled={resetLoading}
        size="small"
        sx={{
          '& .MuiInputBase-root': {
            fontSize: responsiveFontSizes.body1,
          },
          '& .MuiInputLabel-root': {
            fontSize: responsiveFontSizes.body1,
          },
        }}
        />
        )} </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between", mt: 1, mb: 1 }}>
        <Button
        onClick={closeForgotPassword}
        disabled={resetLoading}
        sx={{
        fontFamily: "LEMON MILK",
        fontWeight: 600,
        textTransform: "none",
        color: "#00b2e1",
        fontSize: responsiveFontSizes.button,
        }}
        >
        Cancel </Button>

        {!resetSuccess && (
          <Button
            onClick={handleResetPassword}
            disabled={resetLoading}
            variant="contained"
            sx={{
              background: "#00b2e1",
              color: "#fff",
              fontFamily: "LEMON MILK",
              fontWeight: "bold",
              borderRadius: "10px",
              fontSize: responsiveFontSizes.button,
              padding: { xs: "0.6rem 1.2rem", md: "0.75rem 1.5rem", xxl: "0.9rem 1.8rem" },
              textTransform: "none",
              "&:hover": {
                background: "#0064b5",
              },
            }}
          >
            {resetLoading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Send Reset Email"}
          </Button>
        )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
