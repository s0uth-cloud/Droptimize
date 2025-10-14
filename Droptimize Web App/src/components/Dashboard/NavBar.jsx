import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, List, ListItem, ListItemButton, ListItemIcon, Typography, CircularProgress } from "@mui/material";
import SidebarFooterAccount from "./SidebarFooterAccount.jsx";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig.js";
import QRCode from "react-qr-code";

export default function NavBar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [branchId, setBranchId] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch branch data on component mount
  useEffect(() => {
    const fetchBranch = async () => {
      if (!user?.uid) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setError("User data not found.");
          return;
        }

        const userData = userSnap.data();
        if (!userData.branchId) {
          setError("User has no branch assigned.");
          return;
        }

        const branchIdClean = userData.branchId.trim();
        const branchRef = doc(db, "branches", branchIdClean);
        const branchSnap = await getDoc(branchRef);

        if (!branchSnap.exists()) {
          setError("Branch data not found.");
          return;
        }

        const branchData = branchSnap.data();
        setBranchId(branchIdClean);
        setBranch(branchData);

        localStorage.setItem("branch", JSON.stringify({ id: branchIdClean, ...branchData }));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch branch.");
      } finally {
        setLoading(false);
      }
    };

    fetchBranch();
  }, [user]);

  const navItems = [
    { text: "Dashboard", to: "/dashboard", icon: "/icons/dashboard.svg" },
    { text: "Drivers", to: "/dashboard/drivers", icon: "/icons/drivers.svg" },
    { text: "Parcels", to: "/dashboard/parcels", icon: "/icons/parcels.svg" },
    { text: "Map", to: "/dashboard/map", icon: "/icons/map.svg" },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100%",
        width: 250,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: 2,
        bgcolor: "#ffffff",
        boxShadow: "3px 0 5px rgba(0,0,0,0.1)",
        zIndex: 1000,
        fontFamily: "'Lexend', sans-serif",
      }}
    >
      {/* Navbar */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: "100%" }}>
        {/* Logo */}
        <RouterLink to="/">
          <Box component="img" src="/logo.svg" alt="Droptimize Logo" sx={{ width: 200 }} />
        </RouterLink>

        {/* Navigation List */}
        <List sx={{ width: "100%", p: 0, m: 0 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ width: "100%", "&:hover": { bgcolor: "#f3f4f6", cursor: "pointer" } }}>
              <ListItemButton component={RouterLink} to={item.to} sx={{ gap: 1.5, p: 2 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Box component="img" src={item.icon} alt={`${item.text} Icon`} sx={{ width: 24, height: 24 }} />
                </ListItemIcon>

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    background: "linear-gradient(to right, #00b2e1, #0064b5)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {item.text}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}

          {/* QR Code */}
          <ListItem sx={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: 150 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}>
              Scan the QR Code to join
            </Typography>
            {loading && <CircularProgress />}
            {!loading && error && <Typography color="error">{error}</Typography>}
            {!loading && branchId && !error && <QRCode value={branchId} size={150} />}
            <Typography variant="caption" sx={{ mt: 1, textAlign: "center" }}>
              {branch ? branch.name : "No Branch"}<br />
              {branchId ? `ID: ${branchId}` : ""}
            </Typography>
          </ListItem>
        </List>
      </Box>

      {/* Footer */}
      <SidebarFooterAccount />
    </Box>
  );
}
