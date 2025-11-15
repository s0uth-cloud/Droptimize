import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import LandingPageHeader from "../components/LandingPage/LandingPageHeader.jsx";
import FeatureCard from "../components/LandingPage/FeatureCard.jsx";
import { responsiveFontSizes, responsiveSpacing, responsiveDimensions } from "../theme/responsiveTheme.js";
import DownloadIcon from "@mui/icons-material/Download";

export default function LandingPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    document.title = "Welcome to Droptimize";
  }, []);

  const showGroup = (group) => setActiveGroup(group);
  const goBack = () => setActiveGroup(null);
  const handleGetStarted = () => navigate("/signup");
  const handleDownloadApp = () => {
    const apkUrl = "/apks/app-arm64-v8a-release.apk";
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'Droptimize.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Header */}
      <LandingPageHeader />

      {/* Main Content */}
      <Box component="main" sx={{ pt: { xs: "80px", md: "90px", xl: "100px", xxl: "120px" }, display: "flex", flexDirection: "column", textAlign: "center" }}>
        {/* Welcome Section */}
        <Box sx={{ display: "flex", justifyContent: "space-evenly", alignItems: "center", flexWrap: "wrap", py: responsiveSpacing.sectionPy, px: responsiveSpacing.sectionPx, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ maxWidth: responsiveDimensions.contentMaxWidth, textAlign: { xs: "center", md: "center" } }}>
            <Typography variant="h4" sx={{ fontFamily: "LEMON MILK", fontWeight: 700, color: "#00b2e1", mb: 1, fontSize: responsiveFontSizes.h4 }}>
              Welcome to
            </Typography>
            <Box component="img" src="/logo.svg" alt="Droptimize Logo" sx={{ width: "100%", maxWidth: { xs: 250, md: 350, lg: 400, xl: 400, xxl: 480 }, mb: 2 }} />
            <Typography sx={{ fontFamily: "Lexend", fontSize: responsiveFontSizes.body1, mb: 2, color: "#000" }}>
              Smart Courier Management for Batch Deliveries
            </Typography>
            
            {isMobile ? (
              <Button
                variant="contained"
                onClick={handleDownloadApp}
                startIcon={<DownloadIcon />}
                sx={{
                  backgroundColor: "#00b2e1",
                  fontFamily: "LEMON MILK",
                  fontWeight: 700,
                  px: responsiveDimensions.buttonPx,
                  py: responsiveDimensions.buttonPy,
                  borderRadius: 1,
                  color: "#fff",
                  fontSize: responsiveFontSizes.button,
                  "&:hover": { backgroundColor: "#0095c4" },
                }}
              >
                Download App
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleGetStarted}
                sx={{
                  backgroundColor: "#00b2e1",
                  fontFamily: "LEMON MILK",
                  fontWeight: 700,
                  px: responsiveDimensions.buttonPx,
                  py: responsiveDimensions.buttonPy,
                  borderRadius: 1,
                  color: "#fff",
                  fontSize: responsiveFontSizes.button,
                  "&:hover": { backgroundColor: "#0095c4" },
                }}
              >
                Get Started
              </Button>
            )}
          </Box>

          <Box component="img" src="/hero-image.png" alt="Hero" sx={{ width: "100%", maxWidth: responsiveDimensions.heroMaxWidth, display: { xs: "none", sm: "block" } }} />
        </Box>

        {/* Features Section */}
        <Box
          id="features"
          sx={{
            py: responsiveSpacing.sectionPy,
            backgroundImage: "linear-gradient(#00b2e1, #0064b5)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            px: responsiveSpacing.sectionPx,
          }}
        >
          <Typography sx={{ fontFamily: "Lexend", fontWeight: 700, mb: 2, maxWidth: { xs: "100%", md: 700, lg: 900, xl: 900, xxl: 1100 }, textAlign: "center", fontSize: responsiveFontSizes.body1 }}>
            Droptimize is built to streamline batch delivery operations with intelligent routing, driver monitoring, and performance tracking—all in one platform.
          </Typography>

          <Typography variant="h5" sx={{ fontFamily: "Lexend", fontWeight: 700, mb: 4, fontSize: responsiveFontSizes.h5 }}>
            Features
          </Typography>

          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={responsiveSpacing.gapMedium} sx={{ width: "100%" }}>
            {activeGroup === null && (
              <>
                <Box onClick={() => showGroup("admin")} sx={{ cursor: "pointer", width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                  <FeatureCard title="For Admins" description="Manage your dropshipping business with ease." icon="/admin-icon.png" />
                </Box>
                <Box onClick={() => showGroup("courier")} sx={{ cursor: "pointer", width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                  <FeatureCard title="For Couriers" description="Track your couriers' locations in real-time." icon="/courier-icon.png" />
                </Box>
              </>
            )}

            {activeGroup === "admin" && (
              <>
                <Box sx={{ width: "100%", mb: 2, textAlign: { xs: "center", md: "left" } }}>
                  <Button
                    variant="outlined"
                    onClick={goBack}
                    sx={{
                      color: "#fff",
                      borderColor: "#fff",
                      "&:hover": { backgroundColor: "#fff", color: "#00b2e1" },
                      fontFamily: "Lexend",
                      fontWeight: 700,
                    }}
                  >
                    ← Back
                  </Button>
                </Box>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={responsiveSpacing.gapMedium} sx={{ width: "100%" }}>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Driver Management" description="Add, assign, and supervise couriers performing batch deliveries." icon="/admin_features/driver-management.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Workload Estimation" description="Forecast batch load per driver for balanced task assignment." icon="/admin_features/workload-estimation.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Courier Location Tracking" description="Monitor courier movement during delivery tasks." icon="/admin_features/courier-location-tracking.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Overspeeding Logging" description="View trends and reports of overspeeding behavior per route and driver." icon="/admin_features/overspeeding-logging.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Driver Warning" description="Send alerts or disciplinary messages based on violations or performance flags." icon="/admin_features/driver-warning.png" />
                  </Box>
                </Stack>
              </>
            )}

            {activeGroup === "courier" && (
              <>
                <Box sx={{ width: "100%", mb: 2, textAlign: { xs: "center", md: "left" } }}>
                  <Button
                    variant="outlined"
                    onClick={goBack}
                    sx={{
                      color: "#fff",
                      borderColor: "#fff",
                      "&:hover": { backgroundColor: "#fff", color: "#00b2e1" },
                      fontFamily: "Lexend",
                      fontWeight: 700,
                    }}
                  >
                    ← Back
                  </Button>
                </Box>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={responsiveSpacing.gapMedium} sx={{ width: "100%" }}>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Delivery Task List" description="Organize multiple deliveries into structured, trackable batches per driver." icon="/courier_features/delivery-task-list.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Route Optimization" description="Suggests the most efficient multi-stop routes for grouped deliveries." icon="/courier_features/route-optimization.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Speed Monitoring" description="Continuously monitors vehicle speed to promote safe and compliant driving." icon="/courier_features/speed-monitoring.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Speed Limit Alerts" description="Sends alerts to drivers who exceed posted speed limits during deliveries." icon="/courier_features/speed-limit-alerts.png" />
                  </Box>
                  <Box sx={{ width: { xs: "90%", sm: "auto" }, display: "flex", justifyContent: "center" }}>
                    <FeatureCard title="Driving History" description="Keeps a log of delivery routes and speeds for every batch run, while also tracking overspeeding cases." icon="/courier_features/driving-history.png" />
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        </Box>

        {/* About Section */}
        <Box id="about" sx={{ py: responsiveSpacing.sectionPy, px: responsiveSpacing.sectionPx, display: "flex", flexDirection: "column", alignItems: "center", bgcolor: "#fff" }}>
          <Typography variant="h5" sx={{ fontFamily: "Lexend", fontWeight: 700, mb: 2, fontSize: responsiveFontSizes.h5 }}>About Us</Typography>
          <Typography sx={{ maxWidth: { xs: "100%", md: 700, lg: 900, xl: 900, xxl: 1100 }, textAlign: "center", fontSize: responsiveFontSizes.body1, fontFamily: "Lexend", color: "#333" }}>
            Droptimize is a courier management system tailored for services with batch delivery operations. We're redefining how logistics teams handle bulk deliveries—empowering dispatchers with real-time visibility, optimized routing, and behavior-based driver alerts. From speeding analytics to intelligent task assignment, Droptimize gives courier businesses full control and confidence in every delivery run.
          </Typography>
        </Box>

        {/* Contact Section */}
        <Box id="contact" sx={{ py: responsiveSpacing.sectionPy, px: responsiveSpacing.sectionPx, display: "flex", flexDirection: "column", alignItems: "center", bgcolor: "#f3f4f6" }}>
          <Typography variant="h5" sx={{ fontFamily: "Lexend", fontWeight: 700, mb: 2, fontSize: responsiveFontSizes.h5 }}>Contact Us</Typography>
          <Typography sx={{ textAlign: "center", fontFamily: "Lexend", fontSize: responsiveFontSizes.body1, color: "#333", px: { xs: 2, md: 0 } }}>
            Have questions or need support?{" "}
            <Button href="/contact" variant="text" sx={{ textTransform: "none", fontFamily: "Lexend", fontSize: responsiveFontSizes.body1, color: "#00b2e1" }}>
              Get in touch with us!
            </Button>
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 2, textAlign: "center", bgcolor: "#fff" }}>
        <Typography sx={{ fontFamily: "Lexend", fontSize: responsiveFontSizes.caption, color: "#555" }}>
          &copy; {new Date().getFullYear()} Droptimize. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
