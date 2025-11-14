import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { normalizeDriver } from "../../services";
import { calculateDistanceKm, TIME_ALLOWANCES } from "../../utils";
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
  const [etcText, setEtcText] = useState("");
  const [calculatingETC, setCalculatingETC] = useState(false);

  const d = normalizeDriver(driver);

  // Get driver's vehicle weight limit
  const vehicleWeightLimit = driver?.vehicleWeightLimit || 0;
  
  // Calculate total weight of assigned parcels
  const totalAssignedWeight = parcels.assignedToDriver.reduce(
    (sum, parcel) => sum + (Number(parcel.weight) || 0),
    0
  );
  
  // Calculate remaining capacity
  const remainingCapacity = vehicleWeightLimit - totalAssignedWeight;

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

  const computeTotalETA = useCallback(async (list) => {
    if (!userLocation || !list?.length || !window.google) return "";
    
    const destinations = list
      .filter(
        (p) =>
          p.destination &&
          p.destination.latitude != null &&
          p.destination.longitude != null
      )
      .map((p) => ({ lat: p.destination.latitude, lng: p.destination.longitude }));
    
    if (!destinations.length) return "";

    try {
      // Use Google Maps Directions API for accurate road-based ETA
      const directionsService = new window.google.maps.DirectionsService();
      
      // Build optimized route with multiple waypoints
      const origin = new window.google.maps.LatLng(userLocation.latitude, userLocation.longitude);
      const waypoints = destinations.slice(0, -1).map(dest => ({
        location: new window.google.maps.LatLng(dest.lat, dest.lng),
        stopover: true
      }));
      const destination = new window.google.maps.LatLng(
        destinations[destinations.length - 1].lat,
        destinations[destinations.length - 1].lng
      );

      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: true, // Let Google optimize the route
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              reject(status);
            }
          }
        );
      });

      // Calculate total duration from all legs
      let totalSeconds = 0;
      result.routes[0].legs.forEach(leg => {
        totalSeconds += leg.duration.value; // duration in seconds
      });

      // Add time allowance per parcel
      const allowanceMinutes = TIME_ALLOWANCES.MINUTES_PER_PARCEL * destinations.length;
      const totalMinutes = Math.round(totalSeconds / 60) + allowanceMinutes;
      
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
      
    } catch (error) {
      console.error("Error calculating ETA with Google Maps:", error);
      
      // Fallback to straight-line distance calculation
      const speed = Number(speedKmh) || 45;
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
    }
  }, [userLocation, speedKmh]);

  const handleAssign = async (parcel) => {
    if (!parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null) {
      alert("⚠️ Cannot assign parcel: Invalid destination. Please update the parcel location.");
      return;
    }
    
    // Check weight limit
    const parcelWeight = Number(parcel.weight) || 0;
    const newTotalWeight = totalAssignedWeight + parcelWeight;
    
    if (vehicleWeightLimit > 0 && newTotalWeight > vehicleWeightLimit) {
      const overweight = newTotalWeight - vehicleWeightLimit;
      alert(
        `⚠️ Cannot assign parcel: Weight limit exceeded!\n\n` +
        `Parcel weight: ${parcelWeight} kg\n` +
        `Current load: ${totalAssignedWeight} kg\n` +
        `Vehicle capacity: ${vehicleWeightLimit} kg\n` +
        `This would exceed the limit by ${overweight.toFixed(1)} kg.`
      );
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
            ? "No unassigned parcels match this driver's route."
            : "No parcels have been assigned to this driver yet."}
        </Typography>
      );

    return (
      <List dense disablePadding>
        {list.map((parcel) => {
          const isInvalid = !parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null;
          const parcelWeight = Number(parcel.weight) || 0;
          const wouldExceedLimit = type === "unassigned" && vehicleWeightLimit > 0 && (totalAssignedWeight + parcelWeight) > vehicleWeightLimit;
          
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
                bgcolor: isInvalid ? "#fff4f4" : wouldExceedLimit ? "#fff9e6" : "transparent",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={500}>{parcel.reference}</Typography>
                  {parcelWeight > 0 && (
                    <Chip 
                      label={`${parcelWeight} kg`} 
                      size="small" 
                      sx={{ 
                        bgcolor: "#e3f2fd", 
                        color: "#0064b5",
                        fontSize: "0.7rem",
                        height: 20
                      }} 
                    />
                  )}
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
                  {wouldExceedLimit && (
                    <Chip 
                      label="Exceeds Limit" 
                      size="small" 
                      sx={{ 
                        bgcolor: "#ff9914", 
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
                disabled={(isInvalid && type === "unassigned") || wouldExceedLimit}
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

  // Calculate ETC whenever assigned parcels change
  useEffect(() => {
    const calculateETC = async () => {
      if (parcels.assignedToDriver.length === 0) {
        setEtcText("");
        return;
      }
      setCalculatingETC(true);
      const result = await computeTotalETA(parcels.assignedToDriver);
      setEtcText(result);
      setCalculatingETC(false);
    };
    calculateETC();
  }, [parcels.assignedToDriver, computeTotalETA]);

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
              {vehicleWeightLimit > 0 && (
                <Chip 
                  label={`Load: ${totalAssignedWeight}/${vehicleWeightLimit} kg`}
                  sx={{ 
                    bgcolor: totalAssignedWeight > vehicleWeightLimit ? "#f21b3f" : remainingCapacity < vehicleWeightLimit * 0.2 ? "#ff9914" : "#29bf12",
                    color: "#fff"
                  }}
                />
              )}
              {calculatingETC ? (
                <Chip label="Calculating ETC..." icon={<CircularProgress size={16} />} />
              ) : (
                etcText && <Chip label={`ETC: ${etcText}`} />
              )}
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
