// External dependencies
import { useEffect, useState } from "react";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";

// Internal components
import DeliveryVolumeChart from "../components/Dashboard/DeliveryVolumeChart.jsx";
import DriverStatusCard from "../components/Dashboard/DriverStatusCard.jsx";
import OverspeedingTrendChart from "../components/Dashboard/OverspeedingTrendChart.jsx";
import ParcelStatusCard from "../components/Dashboard/ParcelStatusCard.jsx";
import RecentIncidentCard from "../components/Dashboard/RecentIncidentCard.jsx";

// Services and config
import { auth, db } from "../firebaseConfig.js";
import {
  fetchDeliveryVolumeData,
  fetchDriverStatusData,
  fetchOverspeedingData,
  fetchParcelStatusData,
  fetchRecentIncidents,
} from "../services.js";
import { responsiveDimensions, responsiveFontSizes, responsiveSpacing } from "../theme/responsiveTheme.js";

/**
 * Main dashboard page component that displays analytics and statistics for the admin interface.
 * Fetches and displays parcel status counts, driver availability, delivery volume charts, overspeeding trends, and recent incidents.
 * Implements branch-based filtering by retrieving the admin's branchId and passing it to relevant data fetching functions.
 * All data is loaded on component mount and displayed in responsive cards and charts.
 */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [parcelData, setParcelData] = useState({
    delivered: 0,
    outForDelivery: 0,
    failedOrReturned: 0,
    pending: 0,
  });
  const [driverData, setDriverData] = useState({
    available: 0,
    onTrip: 0,
    offline: 0,
  });
  const [dailyDeliveryData, setDailyDeliveryData] = useState([]);
  const [weeklyDeliveryData, setWeeklyDeliveryData] = useState([]);
  const [dailySpeedData, setDailySpeedData] = useState([]);
  const [weeklySpeedData, setWeeklySpeedData] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    document.title = "Dashboard";

      /**
       * Fetches all dashboard data in parallel including parcel stats, driver stats, delivery volume, overspeeding data, and recent incidents.
       * Retrieves the current admin's branchId from Firestore and uses it to filter branch-specific data.
       * Uses Promise.all for efficient parallel data fetching and updates all state variables once data is retrieved.
       */
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
        
          auth.onAuthStateChanged(async (user) => {
            if (user) {
              const uid = user.uid; 
              console.log("Current user UID:", uid);

              // Fetch branchId from user document
              const userDoc = await getDoc(doc(db, "users", uid));
              const branchId = userDoc.exists() ? userDoc.data().branchId : null;
              
              if (!branchId) {
                console.error("User has no branchId");
                setLoading(false);
                return;
              }

              console.log("Current user branchId:", branchId);

              const [
                parcels,
                drivers,
                dailyDeliveries,
                weeklyDeliveries,
                dailySpeed,
                weeklySpeed,
                recentIncidents,
              ] = await Promise.all([
                fetchParcelStatusData(uid),
                fetchDriverStatusData(branchId),
                fetchDeliveryVolumeData("daily", uid),
                fetchDeliveryVolumeData("weekly", uid),
                fetchOverspeedingData("daily", branchId),
                fetchOverspeedingData("weekly", branchId),
                fetchRecentIncidents(5, branchId),
              ]);

              console.log("Fetched data:", { parcels, drivers, dailyDeliveries, weeklyDeliveries, dailySpeed, weeklySpeed, recentIncidents });

              setParcelData(parcels);
              setDriverData(drivers);
              setDailyDeliveryData(dailyDeliveries);
              setWeeklyDeliveryData(weeklyDeliveries);
              setDailySpeedData(dailySpeed);
              setWeeklySpeedData(weeklySpeed);
              setIncidents(recentIncidents);
            } else {
              console.log("No user logged in.");
            }
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
          setLoading(false);
        }
      };

    fetchDashboardData();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "100vh",
        px: responsiveSpacing.sectionPx,
        py: responsiveSpacing.sectionPy,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontFamily: "Lexend",
          fontWeight: "bold",
          color: "#00b2e1",
          fontSize: responsiveFontSizes.h4,
        }}
      >
        Dashboard
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "70vh",
            width: "100%",
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: responsiveSpacing.gapLarge,
            width: "100%",
          }}
        >
          {/* Status Cards */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: responsiveSpacing.gapLarge,
            }}
          >
            <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
              <ParcelStatusCard
                delivered={parcelData.delivered}
                outForDelivery={parcelData.outForDelivery}
                failedOrReturned={parcelData.failedOrReturned}
                pending={parcelData.pending}
              />
            </Box>

            <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
              <DriverStatusCard
                drivers={driverData}
              />
            </Box>

            <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
              <RecentIncidentCard incidents={incidents} />
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#c4cad0", my: 1 }} />

          {/* Charts */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
              gap: responsiveSpacing.gapLarge,
              width: "100%",
            }}
          >
            <Box sx={{ 
              width: "100%",
              height: responsiveDimensions.chartHeight 
            }}>
              <DeliveryVolumeChart
                dailyData={dailyDeliveryData}
                weeklyData={weeklyDeliveryData}
              />
            </Box>

            <Box sx={{ 
              width: "100%",
              height: responsiveDimensions.chartHeight 
            }}>
              <OverspeedingTrendChart
                dailyData={dailySpeedData}
                weeklyData={weeklySpeedData}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
