import React, { useEffect, useState, useRef } from "react";
import { AppBar, Toolbar, Box, Button, Typography, Stack, Slide, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { responsiveFontSizes, responsiveDimensions, responsiveSpacing } from "../../theme/responsiveTheme.js";

export default function LandingPageHeader() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setVisible(true), 150);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [lastScrollY]);

  return (
    <Slide appear={false} direction="down" in={visible}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          color: "#000",
          px: { xs: 2, sm: 3, md: 4, xl: 5, xxl: 6 },
        }}
      >
        <Toolbar disableGutters sx={{ justifyContent: { xs: "center", md: "space-between" }, minHeight: { xs: 56, md: 64, xl: 70, xxl: 80 } }}>
          {/* Logo */}
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <Box component="img" src="/logo.svg" alt="Droptimize Logo" sx={{ width: responsiveDimensions.logoWidth }} />
          </Box>

          {/* Navigation */}
          <Stack direction="row" spacing={responsiveSpacing.gapSmall} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            {["Home", "Features", "About", "Contact"].map((item) => (
              <Typography
                key={item}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "Lexend, sans-serif",
                  color: "#00b2e1",
                  fontSize: responsiveFontSizes.body1,
                  px: { xs: 1.5, lg: 2, xxl: 2.5 },
                  py: 0.5,
                  borderRadius: 1,
                  "&:hover": { color: "#fff", backgroundColor: "#00b2e1" },
                }}
                onClick={() => {
                  if (item === "Home") navigate("/");
                  else {
                    const el = document.getElementById(item.toLowerCase());
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {item}
              </Typography>
            ))}
          </Stack>

          {/* Static Auth Buttons - Hidden on Mobile */}
          {!isMobile && (
            <Stack direction="row" spacing={responsiveSpacing.gapSmall} alignItems="center">
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  backgroundColor: "#00b2e1",
                  fontWeight: 600,
                  fontFamily: "Lexend, sans-serif",
                  textTransform: "none",
                  fontSize: responsiveFontSizes.button,
                  px: responsiveDimensions.buttonPx,
                  py: { xs: 0.8, md: 1, xl: 1.2, xxl: 1.5 },
                  "&:hover": { backgroundColor: "#0064b5" },
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/signup")}
                sx={{
                  backgroundColor: "#00b2e1",
                  fontWeight: 600,
                  fontFamily: "Lexend, sans-serif",
                  textTransform: "none",
                  fontSize: responsiveFontSizes.button,
                  px: responsiveDimensions.buttonPx,
                  py: { xs: 0.8, md: 1, xl: 1.2, xxl: 1.5 },
                  "&:hover": { backgroundColor: "#0064b5" },
                }}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
    </Slide>
  );
}
