import { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import ParcelStatusCard from "../components/Dashboard/ParcelStatusCard.jsx";
import DriverStatusCard from "../components/Dashboard/DriverStatusCard.jsx";
import DeliveryVolumeChart from "../components/Dashboard/DeliveryVolumeChart.jsx";
import OverspeedingTrendChart from "../components/Dashboard/OverspeedingTrendChart.jsx";
import RecentIncidentCard from "../components/Dashboard/RecentIncidentCard.jsx";
import {
  fetchParcelStatusData,
  fetchDriverStatusData,
  fetchDeliveryVolumeData,
  fetchOverspeedingData,
  fetchRecentIncidents,
} from "../services/firebaseService.js";
import { auth } from "../firebaseConfig.js";

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

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        const uid = currentUser ? currentUser.uid : null;

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
          fetchDriverStatusData(),
          fetchDeliveryVolumeData("daily"),
          fetchDeliveryVolumeData("weekly"),
          fetchOverspeedingData("daily"),
          fetchOverspeedingData("weekly"),
          fetchRecentIncidents(5),
        ]);

        setParcelData(parcels);
        setDriverData(drivers);
        setDailyDeliveryData(dailyDeliveries);
        setWeeklyDeliveryData(weeklyDeliveries);
        setDailySpeedData(dailySpeed);
        setWeeklySpeedData(weeklySpeed);
        setIncidents(recentIncidents);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
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
        px: { xs: 2, md: 4 },
        py: 3,
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
        <Grid
          container
          spacing={3}
          sx={{
            width: "100%",
            margin: 0,
            alignItems: "stretch",
          }}
        >
          {/* Row 1: Status Cards */}
          <Grid item xs={12} md={6} lg={3}>
            <ParcelStatusCard
              delivered={parcelData.delivered}
              outForDelivery={parcelData.outForDelivery}
              failedOrReturned={parcelData.failedOrReturned}
              pending={parcelData.pending}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <DriverStatusCard
              available={driverData.available}
              onTrip={driverData.onTrip}
              offline={driverData.offline}
            />
          </Grid>

          {/* Spacer */}
          <Grid item xs={12}>
            <Divider sx={{ borderColor: "#c4cad0", my: 1 }} />
          </Grid>

          {/* Row 2: Charts */}
          <Grid item xs={12} lg={6} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%", height: "100%" }}>
              <DeliveryVolumeChart
                dailyData={dailyDeliveryData}
                weeklyData={weeklyDeliveryData}
              />
            </Box>
          </Grid>

          <Grid item xs={12} lg={6} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%", height: "100%" }}>
              <OverspeedingTrendChart
                dailyData={dailySpeedData}
                weeklyData={weeklySpeedData}
              />
            </Box>
          </Grid>

          {/* Spacer */}
          <Grid item xs={12}>
            <Divider sx={{ borderColor: "#c4cad0", my: 1 }} />
          </Grid>

          {/* Row 3: Recent Incidents */}
          <Grid item xs={12}>
            <RecentIncidentCard incidents={incidents} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
