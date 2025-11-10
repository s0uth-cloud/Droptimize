import { useState, useEffect } from "react";
import { Box, Paper, Stack, Typography, TextField, Button, InputAdornment, IconButton, Link } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import SignUpSuccessMessage from "/src/components/SignUpSuccessMessage.jsx";
import { registerUser } from "../firebaseConfig";
import { responsiveFontSizes, responsiveDimensions } from "../theme/responsiveTheme.js";

export default function SignUpForm() {
  useEffect(() => {
    document.title = "Droptimize - Sign Up";
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trimStart() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, password, confirmPassword } = formData;
    const errors = {};

    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email)) errors.email = "Invalid email format";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError("");
    setLoading(true);


      const result = await registerUser(formData);
      if (result.success) {
        
        setSuccess(true);
      } else {
        if (result.error.code === "auth/email-already-in-use") {
        setFieldErrors({ email: "This email is already registered" });
        } else {
          setError(result.error?.message || "Something went wrong.");
        }
      }
      setLoading(false);
  };

  if (success) {
    return <SignUpSuccessMessage />;
  }

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
          boxShadow: 3
        }}
      >
        <Stack spacing={{ xs: 1.5, md: 2, xxl: 2.5 }} alignItems="center">
          <Box
            component="img"
            src="/logo.svg"
            alt="Droptimize Logo"
            sx={{
              maxWidth: { xs: 250, md: 280, lg: 300, xl: 300, xxl: 350 },
              mb: { xs: 1, md: 2 }
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
            Sign Up
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{ fontSize: responsiveFontSizes.body2 }}>
              {error}
            </Typography>
          )}

          <TextField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={!!fieldErrors.firstName}
            helperText={fieldErrors.firstName}
            fullWidth
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
          <TextField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={!!fieldErrors.lastName}
            helperText={fieldErrors.lastName}
            fullWidth
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
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            fullWidth
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
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            fullWidth
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: responsiveFontSizes.body1,
              },
              '& .MuiInputLabel-root': {
                fontSize: responsiveFontSizes.body1,
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
          />
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!fieldErrors.confirmPassword}
            helperText={fieldErrors.confirmPassword}
            fullWidth
            size="small"
            sx={{
              '& .MuiInputBase-root': {
                fontSize: responsiveFontSizes.body1,
              },
              '& .MuiInputLabel-root': {
                fontSize: responsiveFontSizes.body1,
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm((p) => !p)} edge="end">
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
          />

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
              mt: { xs: 1.5, md: 2 },
              "&:hover": {
                background: "#0064b5",
              },
            }}
          >
            {loading ? "Registering..." : "Register"}
          </Button>

          <Typography variant="body2" align="center" sx={{ fontSize: responsiveFontSizes.body2 }}>
            Already have an account?{" "}
            <Link
              href="/login"
              underline="hover"
              sx={{ color: "#00b2e1", fontWeight: 600 }}
            >
              Log in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
