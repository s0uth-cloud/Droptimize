import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { db } from "/src/firebaseConfig";
import { normalizeDriver } from "../services";
import {
  calculateDistanceKm,
  getDriverLocation,
  isInsideZone,
  getDisplaySpeed,
  CROSSWALK_RADIUS_KM,
  CROSSWALK_LIMIT_KMH,
  STATUS_COLORS,
  DRIVER_STATUS,
} from "../utils";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tooltip,
} from "@mui/material";
import { ExpandMore, MyLocation } from "@mui/icons-material";
import GiveWarningButton from "./GiveWarningButton.jsx";

export default function DriverListPanel({ user, mapRef, onDriverSelect, selectedDriver }) {
  const [drivers, setDrivers] = useState([]);
  const [branchId, setBranchId] = useState(null);
  const [parcels, setParcels] = useState({});
  const [slowdowns, setSlowdowns] = useState([]);
  const [crosswalkMap, setCrosswalkMap] = useState({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setBranchId(userDoc.data().branchId || null);
      } catch (err) {
        console.error("Error fetching branchId:", err);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!branchId) return;
    // Query all drivers for the branch and filter by status client-side.
    // This avoids missing drivers due to inconsistent casing stored in Firestore.
    const qDrivers = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      where("branchId", "==", branchId)
    );
    const unsub = onSnapshot(qDrivers, (snapshot) => {
      const driverList = snapshot.docs
        .map((d) => normalizeDriver({ id: d.id, ...d.data() }))
        .filter((drv) => drv.status === "delivering");
      setDrivers(driverList);
    });
    return () => unsub();
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    const unsub = onSnapshot(doc(db, "branches", branchId), (snap) => {
      setSlowdowns(snap.exists() ? snap.data().slowdowns || [] : []);
    });
    return () => unsub();
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    const qParcels = query(collection(db, "parcels"), where("status", "==", "Out for Delivery"));
    const unsub = onSnapshot(qParcels, (snapshot) => {
      const grouped = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (!grouped[data.driverUid]) grouped[data.driverUid] = [];
        grouped[data.driverUid].push({ id: d.id, ...data });
      });
      setParcels(grouped);
    });
    return () => unsub();
  }, [branchId]);

  useEffect(() => {
    let cancelled = false;

    async function checkDriverCrosswalk(driver) {
      const dl = getDriverLocation(driver);
      if (!dl) return [driver.id, false];

      const lat = dl.latitude;
      const lng = dl.longitude;

      const delta = 0.00045;
      const minLat = lat - delta,
        maxLat = lat + delta;
      const minLng = lng - delta,
        maxLng = lng + delta;

      const query = `
        [out:json][timeout:20];
        (node["highway"="crossing"](${minLat},${minLng},${maxLat},${maxLng}););
        out body;
      `;
      try {
        const res = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        let inside = false;
        if (Array.isArray(data?.elements)) {
          for (const el of data.elements) {
            if (el.type !== "node") continue;
            const dKm = calculateDistanceKm(lat, lng, el.lat, el.lon);
            if (dKm <= CROSSWALK_RADIUS_KM) {
              inside = true;
              break;
            }
          }
        }
        return [driver.id, inside];
      } catch (e) {
        console.error("Crosswalk check failed for driver", driver.id, e);
        return [driver.id, false];
      }
    }

    async function run() {
      const entries = await Promise.all(drivers.map((d) => checkDriverCrosswalk(d)));
      if (cancelled) return;
      const next = {};
      entries.forEach(([id, inside]) => {
        next[id] = inside;
      });
      setCrosswalkMap(next);
    }

    if (drivers.length > 0) run();
    else setCrosswalkMap({});

    return () => {
      cancelled = true;
    };
  }, [drivers]);

  const getApplicableLimit = (driver) => {
    const dl = getDriverLocation(driver);
    if (!dl) return null;

    const inCrosswalk = !!crosswalkMap[driver.id];
    const fsActiveLimits = slowdowns
      .filter(
        (z) =>
          z?.category === "Slowdown" &&
          z?.location &&
          typeof z.location.lat === "number" &&
          typeof z.location.lng === "number" &&
          typeof z.radius === "number" &&
          typeof z.speedLimit === "number" &&
          isInsideZone(driver, z)
      )
      .map((z) => z.speedLimit);

    const candidates = [];
    if (inCrosswalk) candidates.push(CROSSWALK_LIMIT_KMH);
    candidates.push(...fsActiveLimits);

    if (candidates.length === 0) return null;
    return Math.min(...candidates);
  };

  const handleGiveWarning = async (driver) => {
    if (!user) return alert("User not authenticated.");
    try {
      const distance = driver.totalDistance || 0;
      const displaySpeed = getDisplaySpeed(driver) || 0;
      const avgSpeed = driver.avgSpeed || displaySpeed || 0;
      const topSpeed = driver.topSpeed || displaySpeed || 0;
      const time = driver.activeMinutes || 0;

      await updateDoc(doc(db, "users", driver.id), {
        violations: arrayUnion({
          driverLocation: getDriverLocation(driver) || null,
          issuedAt: Timestamp.now(),
          message: "Speeding violation",
          distance,
          avgSpeed,
          topSpeed,
          time,
          speedAtIssue: displaySpeed,
        }),
      });

      alert(`Warning given to ${driver.fullName || "driver"}`);
    } catch (err) {
      console.error("Failed to give warning:", err);
      alert("Error giving warning. Try again.");
    }
  };

  const handleFocusOnMap = (driver) => {
    // If clicking the same driver, deselect
    if (selectedDriver?.id === driver.id) {
      onDriverSelect && onDriverSelect(null);
      return;
    }
    
    // Get driver location
    const dl = getDriverLocation(driver);
    if (!dl) {
      alert("Driver location not available");
      return;
    }
    
    // Focus on map first
    if (mapRef?.current) {
      try {
        mapRef.current.panTo({ lat: dl.latitude, lng: dl.longitude });
        mapRef.current.setZoom(17);
      } catch (err) {
        console.error("Error focusing on map:", err);
      }
    }
    
    // Then update selected driver after a short delay to ensure map updates first
    setTimeout(() => {
      onDriverSelect && onDriverSelect(driver);
    }, 100);
  };

  return (
    <Card sx={{ height: "100%", overflowY: "auto", borderRadius: 3, boxShadow: 4 }}>
      <CardContent sx={{ p: 2 }}>
        {drivers.length === 0 && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
            No drivers found
          </Typography>
        )}

        {drivers.map((driver) => {
          const applicableLimit = getApplicableLimit(driver);
          const displaySpeed = getDisplaySpeed(driver);
          const isOverspeeding =
            typeof displaySpeed === "number" &&
            applicableLimit != null &&
            applicableLimit > 0 &&
            displaySpeed > applicableLimit;

          return (
            <Accordion
              key={driver.id}
              sx={{
                mb: 2,
                borderRadius: 2,
                "&:before": { display: "none" },
                bgcolor: isOverspeeding ? "#fff4f4" : (selectedDriver?.id === driver.id ? "#e3f2fd" : "#f9f9f9"),
                border: selectedDriver?.id === driver.id ? "2px solid #00b2e1" : "none",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 2 }}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={driver.photoURL || ""} alt={driver.fullName || "Driver"} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {driver.fullName || "Unnamed Driver"}
                      </Typography>

                      <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Typography variant="body2">
                          Parcels: {parcels[driver.id]?.length || 0}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{ color: isOverspeeding ? "#f21b3f" : "#29bf12" }}
                        >
                          Speed: {typeof displaySpeed === "number" ? displaySpeed : "N/A"} km/h
                          {applicableLimit != null ? ` • Limit ${applicableLimit}` : ""}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {isOverspeeding && (
                    <Grid>
                      <Tooltip title="Give Warning">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGiveWarning(driver);
                          }}
                        >
                          <GiveWarningButton />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  )}
                </Grid>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Typography variant="body2">
                        Vehicle:{" "}
                        {driver?.vehicleType || driver?.model
                          ? `${driver?.vehicleType || "—"} | ${driver?.model || "—"}`
                          : "N/A"}
                      </Typography>
                      <Typography variant="body2">Plate: {driver?.plateNumber || "N/A"}</Typography>
                    </Box>
                  </Grid>

                  {getDriverLocation(driver) && (
                    <Grid>
                      <Tooltip title={
                        selectedDriver?.id === driver.id 
                          ? "Deselect Driver" 
                          : selectedDriver 
                            ? "Deselect current driver first" 
                            : "Focus on Map"
                      }>
                        <span>
                          <IconButton 
                            onClick={() => handleFocusOnMap(driver)} 
                            disabled={selectedDriver !== null && selectedDriver?.id !== driver.id}
                          >
                            <MyLocation />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </CardContent>
    </Card>
  );
}
