import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import QRCode from "react-qr-code";
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
  Checkbox,
} from "@mui/material";

export default function AssignDriverModal({ open, onClose, driver }) {
  const [parcels, setParcels] = useState({ unassigned: [], assignedToDriver: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const speedKmh = 45; // Fixed speed for ETC calculations
  const [etcText, setEtcText] = useState("");
  const [calculatingETC, setCalculatingETC] = useState(false);
  const [selectedParcels, setSelectedParcels] = useState([]);
  const [qrCodeData, setQrCodeData] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

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

  const toggleSelectParcel = (parcel) => {
    if (!parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null) {
      alert("⚠️ Cannot select parcel: Invalid destination. Please update the parcel location.");
      return;
    }
    
    const isSelected = selectedParcels.some(p => p.id === parcel.id);
    
    if (isSelected) {
      setSelectedParcels(selectedParcels.filter(p => p.id !== parcel.id));
    } else {
      // Check weight limit
      const parcelWeight = Number(parcel.weight) || 0;
      const currentSelectionWeight = selectedParcels.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
      const newTotalWeight = totalAssignedWeight + currentSelectionWeight + parcelWeight;
      
      if (vehicleWeightLimit > 0 && newTotalWeight > vehicleWeightLimit) {
        const overweight = newTotalWeight - vehicleWeightLimit;
        alert(
          `⚠️ Cannot select parcel: Weight limit exceeded!\n\n` +
          `Parcel weight: ${parcelWeight} kg\n` +
          `Currently assigned: ${totalAssignedWeight} kg\n` +
          `Selected for assignment: ${currentSelectionWeight} kg\n` +
          `Vehicle capacity: ${vehicleWeightLimit} kg\n` +
          `This would exceed the limit by ${overweight.toFixed(1)} kg.`
        );
        return;
      }
      
      setSelectedParcels([...selectedParcels, parcel]);
    }
  };

  const handleGenerateQR = async () => {
    if (selectedParcels.length === 0) {
      alert("Please select at least one parcel to assign.");
      return;
    }

    setGeneratingQR(true);
    try {
      // Create assignment document
      const assignmentData = {
        driverId: d.id,
        driverName: d.fullName || "Unknown Driver",
        parcels: selectedParcels.map(p => ({
          id: p.id,
          recipient: p.recipient,
          recipientContact: p.recipientContact,
          reference: p.reference,
          weight: p.weight,
          destination: p.destination,
          street: p.street,
          barangay: p.barangay,
          municipality: p.municipality,
          province: p.province,
          region: p.region,
        })),
        createdAt: serverTimestamp(),
        status: "pending", // pending, accepted, rejected
        createdBy: auth.currentUser?.email || "Unknown",
      };

      const assignmentRef = await addDoc(collection(db, "assignments"), assignmentData);
      const assignmentId = assignmentRef.id;

      // Generate QR code data
      const qrData = JSON.stringify({ type: "assignment", id: assignmentId });
      
      setQrCodeData(qrData);
      setShowQRModal(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setQrCodeData("");
    setSelectedParcels([]);
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
          const isSelected = selectedParcels.some(p => p.id === parcel.id);
          
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
              {type === "unassigned" ? (
                <Checkbox
                  checked={isSelected}
                  disabled={isInvalid || wouldExceedLimit}
                  onChange={() => toggleSelectParcel(parcel)}
                  sx={{ color: "#00b2e1" }}
                />
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleUnassign(parcel)}
                >
                  Unassign
                </Button>
              )}
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
    <>
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
        {tab === 0 && selectedParcels.length > 0 && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{color: "#00b2e1"}}>
              {selectedParcels.length} parcel{selectedParcels.length > 1 ? "s" : ""} selected
            </Typography>
            <Button 
              onClick={handleGenerateQR} 
              variant="contained" 
              disabled={generatingQR}
              sx={{ backgroundColor: "#00b2e1", "&:hover": { backgroundColor: "#0099c7" } }}
            >
              {generatingQR ? "Generating..." : "Generate QR Code"}
            </Button>
          </Box>
        )}
        <Button onClick={onClose} variant="outlined" color="primary">
          Done
        </Button>
      </DialogActions>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog
      open={showQRModal}
      onClose={handleCloseQRModal}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ textAlign: "center", bgcolor: "#00b2e1", color: "#fff" }}>
        Assignment QR Code
      </DialogTitle>
      <DialogContent sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h6" textAlign="center">
            {d.fullName || "Driver"}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {selectedParcels.length} parcel{selectedParcels.length > 1 ? "s" : ""} ready for assignment
          </Typography>
          
          {qrCodeData && (
            <Box
              sx={{
                p: 2,
                bgcolor: "white",
                border: "2px solid #ddd",
                borderRadius: 2,
                display: "inline-block",
              }}
            >
              <QRCode value={qrCodeData} size={300} />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontStyle: "italic" }}>
            Driver must scan this QR code to receive the assignment
          </Typography>

          <Box sx={{ width: "100%", maxHeight: 200, overflowY: "auto", bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
            <Typography variant="caption" fontWeight="bold" gutterBottom>
              Parcels in this assignment:
            </Typography>
            {selectedParcels.map((p, idx) => (
              <Typography key={idx} variant="caption" display="block">
                {idx + 1}. {p.reference} - {p.recipient} ({p.barangay}, {p.municipality})
              </Typography>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseQRModal} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
      </Dialog>
    </>
  );
}
