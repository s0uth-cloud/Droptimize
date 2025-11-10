import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { normalizeDriver } from "../../services/dataNormalizers";
import { calculateDistanceKm } from "../../utils/geoUtils";
import { TIME_ALLOWANCES } from "../../utils/constants";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Divider,
  Stack,
  TextField,
  Chip,
} from "@mui/material";

export default function AssignDriverModal({ open, onClose, driver }) {
  const [parcels, setParcels] = useState({ unassigned: [], assignedToDriver: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(45);

  const d = normalizeDriver(driver);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => setUserLocation(null)
    );
  }, []);

  useEffect(() => {
    setSpeedKmh(Number(driver?.speedAvg) || 45);
  }, [driver]);

  useEffect(() => {
    if (!d.id || !driver) return;
    const parcelsRef = collection(db, "parcels");
    const unsub = onSnapshot(parcelsRef, (snapshot) => {
      const allParcels = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const preferred = (driver?.preferredRoutes || []).map((r) => ({
        barangay: (r.barangayName || "").toLowerCase(),
        municipality: (r.municipalityName || "").toLowerCase(),
        province: (r.provinceName || "").toLowerCase(),
        region: (r.regionName || "").toLowerCase(),
      }));

      const unassigned = allParcels.filter((p) => {
        const notDelivered = p.status !== "Delivered";
        const isUnassigned = !p.driverUid && !p.driverName;
        if (!preferred.length) return notDelivered && isUnassigned; // fallback if no preferred routes
        const matchPreferred = preferred.some(
          (route) =>
            (p.barangay || "").toLowerCase() === route.barangay &&
            (p.municipality || "").toLowerCase() === route.municipality &&
            (p.province || "").toLowerCase() === route.province &&
            (p.region || "").toLowerCase() === route.region
        );
        return notDelivered && isUnassigned && matchPreferred;
      });

      const assignedToDriver = allParcels.filter(
        (p) => p.status !== "Delivered" && p.driverUid === d.id
      );

      setParcels({ unassigned, assignedToDriver });
      setLoading(false);
    });
    return () => unsub();
  }, [d.id, driver]);

  const computeTotalETA = (list) => {
    if (!userLocation || !list?.length) return "";
    const destinations = list
      .filter(
        (p) =>
          p.destination &&
          p.destination.latitude != null &&
          p.destination.longitude != null
      )
      .map((p) => ({ lat: p.destination.latitude, lng: p.destination.longitude }));
    if (!destinations.length) return "";

    const speed = Number(speedKmh) || 1;
    let fastRoute = [];
    let visited = new Array(destinations.length).fill(false);
    let current = { lat: userLocation.latitude, lng: userLocation.longitude };

    for (let i = 0; i < destinations.length; i++) {
      let nearestIndex = -1;
      let minDist = Infinity;
      for (let j = 0; j < destinations.length; j++) {
        if (visited[j]) continue;
        const dist = calculateDistanceKm(current.lat, current.lng, destinations[j].lat, destinations[j].lng);
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = j;
        }
      }
      if (nearestIndex !== -1) {
        visited[nearestIndex] = true;
        fastRoute.push(destinations[nearestIndex]);
        current = destinations[nearestIndex];
      }
    }

    let fastDistance = 0;
    let lastFast = { lat: userLocation.latitude, lng: userLocation.longitude };
    for (const point of fastRoute) {
      fastDistance += calculateDistanceKm(lastFast.lat, lastFast.lng, point.lat, point.lng);
      lastFast = point;
    }

    const fastMinutes = Math.round((fastDistance / speed) * 60) + TIME_ALLOWANCES.MINUTES_PER_PARCEL * destinations.length;
    const h = Math.floor(fastMinutes / 60);
    const m = fastMinutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleAssign = async (parcel) => {
    if (!parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null) {
      alert("⚠️ Cannot assign parcel: Invalid destination. Please update the parcel location.");
      return;
    }
    try {
      await updateDoc(doc(db, "parcels", parcel.id), {
        driverUid: d.id,
        driverName: d.fullName || "Unknown Driver",
        assignedAt: serverTimestamp(),
        status: "Out for Delivery",
      });
    } catch (error) {
      console.error("Error assigning parcel:", error);
    }
  };

  const handleSaveAverage = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", d.id), {
        speedAvg: Number(speedKmh) || 0,
      });
      alert("Speed Average has been saved successfully!");
    } catch (e) {
      console.error("Error saving driver's speed average", e);
    }
  };

  const handleUnassign = async (parcel) => {
    try {
      await updateDoc(doc(db, "parcels", parcel.id), {
        driverUid: null,
        driverName: null,
        assignedAt: null,
        status: "Pending",
      });
    } catch (error) {
      console.error("Error unassigning parcel:", error);
    }
  };

  const renderList = (list, type) => {
    if (loading)
      return (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      );

    if (!list?.length)
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          {type === "unassigned"
            ? "No unassigned parcels match this driver’s route."
            : "No parcels have been assigned to this driver yet."}
        </Typography>
      );

    return (
      <List dense disablePadding>
        {list.map((parcel) => {
          const isInvalid = !parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null;
          
          return (
            <ListItem
              key={parcel.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #eee",
                bgcolor: isInvalid ? "#fff4f4" : "transparent",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={500}>{parcel.reference}</Typography>
                  {isInvalid && (
                    <Chip 
                      label="Invalid" 
                      size="small" 
                      sx={{ 
                        bgcolor: "#f21b3f", 
                        color: "#fff",
                        fontSize: "0.7rem",
                        height: 20
                      }} 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {parcel.barangay}, {parcel.municipality}
                </Typography>
                {isInvalid && (
                  <Typography variant="caption" color="error">
                    Missing destination coordinates
                  </Typography>
                )}
              </Box>
              <Button
                variant={type === "unassigned" ? "contained" : "outlined"}
                color={type === "unassigned" ? "primary" : "error"}
                size="small"
                disabled={isInvalid && type === "unassigned"}
                onClick={() =>
                  type === "unassigned" ? handleAssign(parcel) : handleUnassign(parcel)
                }
              >
                {type === "unassigned" ? "Assign" : "Unassign"}
              </Button>
            </ListItem>
          );
        })}
      </List>
    );
  };

  const assignedCount = parcels.assignedToDriver.length;
  const validAssignedCount = parcels.assignedToDriver.filter(
    (p) => p.destination && p.destination.latitude !== null && p.destination.longitude !== null
  ).length;
  const invalidAssignedCount = assignedCount - validAssignedCount;
  const etcText = computeTotalETA(parcels.assignedToDriver);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              Manage Parcels — {d.fullName || "Driver"}
            </Typography>

            <Stack direction="row" spacing={1} mt={1} alignItems="center" flexWrap="wrap">
              <Chip label={`Valid Parcels: ${validAssignedCount}`} color="primary" />
              {invalidAssignedCount > 0 && (
                <Chip 
                  label={`Invalid: ${invalidAssignedCount}`} 
                  sx={{ bgcolor: "#f21b3f", color: "#fff" }}
                />
              )}
              {etcText && <Chip label={`ETC: ${etcText}`} />}
            </Stack>

            <Stack direction="row" spacing={1} mt={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">Speed Average (km/h)</Typography>
              <TextField
                size="small"
                type="number"
                value={speedKmh}
                onChange={(e) => setSpeedKmh(Number(e.target.value))}
                placeholder="Enter Speed Average (default 45)"
                sx={{ width: 180 }}
              />
              <Button onClick={handleSaveAverage} variant="outlined" color="primary">
                Save Average
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label={`Unassigned Parcels (${parcels.unassigned.length})`} />
        <Tab label={`Assigned Parcels (${assignedCount})`} />
      </Tabs>

      <DialogContent dividers sx={{ minHeight: 300, p: 2 }}>
        {tab === 0 && renderList(parcels.unassigned, "unassigned")}
        {tab === 1 && renderList(parcels.assignedToDriver, "assigned")}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
