import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import LandingPage from "./pages/LandingPage.jsx";
import SignUpForm from "./pages/SignUp.jsx";
import LogInForm from "./pages/LogIn.jsx";
import DashboardLayout from "./pages/layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Drivers from "./pages/Drivers.jsx";
import Parcels from "./pages/Parcels.jsx";
import MapView from "./pages/MapView.jsx";
import Profile from "./pages/Profile.jsx";
import AccountSetup from "./pages/AccountSeutp.jsx";
import ResetPasswordForm from "./pages/ResetPassword.jsx";

// Create responsive MUI theme
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },
  typography: {
    fontFamily: "'Lexend', sans-serif",
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/login" element={<LogInForm />} />
            <Route path="/account-setup" element={<AccountSetup />} />
            <Route path="/reset-password" element={<ResetPasswordForm/>} />

            {/* Dashboard layout with nested routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="parcels" element={<Parcels />} />
              <Route path="map" element={<MapView />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
