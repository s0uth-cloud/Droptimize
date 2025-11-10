import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import MapIcon from "@mui/icons-material/Map";
import QRCode from "react-qr-code";
import SidebarFooterAccount from "./SidebarFooterAccount.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "/src/firebaseConfig";
import { responsiveFontSizes, responsiveDimensions, responsiveSpacing } from "../../theme/responsiveTheme.js";

export default function NavBar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [branchId, setBranchId] = useState("");
  const [branch, setBranch] = useState(null);
  const location = useLocation();
  useEffect(() => {
    const fetchBranch = async () => {
      if (user?.uid) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.branchId) {
              setBranchId(userData.branchId);
              setBranch(userData);

              localStorage.setItem(
                "branch",
                JSON.stringify({ id: user.uid, ...userData })
              );
            } else {
              console.warn("User has no branchId field:", user.uid);
            }
          } else {
            console.warn("No such user:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching branch:", error);
        }
      }
    };

    fetchBranch();
  }, [user]);

  const navLinks = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Drivers", path: "/dashboard/drivers", icon: <LocalShippingIcon /> },
    { label: "Parcels", path: "/dashboard/parcels", icon: <InventoryIcon /> },
    { label: "Map", path: "/dashboard/map", icon: <MapIcon /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: responsiveDimensions.drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: responsiveDimensions.drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          color: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: responsiveSpacing.gapMedium,
          pb: responsiveSpacing.gapMedium,
          fontFamily: "Lexend, sans-serif",
        },
      }}
    >
      {/* Logo Section */}
      <Box sx={{ mb: responsiveSpacing.gapLarge, display: "flex", justifyContent: "center" }}>
        <Box
          component="img"
          src="/logo.svg"
          alt="Droptimize Logo"
          sx={{
            width: { xs: 120, md: 130, lg: 150, xl: 150, xxl: 180 },
            height: "auto",
          }}
        />
      </Box>

      <Divider sx={{ width: "80%", mb: responsiveSpacing.gapMedium, borderColor: "rgba(255,255,255,0.3)" }} />

      {/* Navigation List */}
      <List sx={{ width: "100%", flexGrow: 1 }}>
        {navLinks.map((item) => (
          <ListItemButton
            key={item.label}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              color: "#00b2e1",
              "&.Mui-selected": {
                backgroundColor: "#0064b5",
              },
              "&:hover": {
                backgroundColor: "#f0f0f0",
              },
              pl: responsiveSpacing.gapLarge,
              py: { xs: 1.2, md: 1.5, xxl: 2 },
              transition: "background-color 0.2s ease-in-out",
            }}
          >
            <ListItemIcon sx={{ color: "#00b2e1", minWidth: { xs: 35, md: 40, xxl: 50 } }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontFamily: "Lexend, sans-serif",
                fontWeight: 700,
                fontSize: responsiveFontSizes.nav,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ width: "80%", mb: responsiveSpacing.gapMedium, borderColor: "rgba(255,255,255,0.3)" }} />

      {/* QR Code Section */}
      {branchId && (
        <Box
          sx={{
            textAlign: "center",
            mb: responsiveSpacing.gapMedium,
            px: responsiveSpacing.gapMedium,
            backgroundColor: "#00b2e1",
            py: responsiveSpacing.gapMedium,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "Lexend, sans-serif",
              fontWeight: 700,
              fontSize: responsiveFontSizes.body2,
              mb: 1,
              color: "#fff",
              letterSpacing: "0.05em",
            }}
          >
            Scan To Join
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 2,
              p: { xs: 1.2, md: 1.5, xxl: 2 },
              width: responsiveDimensions.qrCodeContainer,
              height: responsiveDimensions.qrCodeContainer,
              mx: "auto",
            }}
          >
            <QRCode
              value={branchId}
              size={100}
              style={{ height: "auto", width: "100%" }}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{
              mt: 1,
              color: "#fff",
              display: "block",
              fontFamily: "Lexend, sans-serif",
              fontSize: responsiveFontSizes.caption,
            }}
          >
            {branch?.branchName || "Branch ID: " + branchId}
          </Typography>
        </Box>
      )}

      {/* Footer Account Section */}
      <SidebarFooterAccount />
    </Drawer>
  );
}
