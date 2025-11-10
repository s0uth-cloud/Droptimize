import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Drawer,
  IconButton,
  Fab,
  Tooltip,
  Divider,
  TextField,
  CircularProgress,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

import { auth, db } from "/src/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import MapComponent from "/src/components/MapComponent.jsx";
import DriverListPanel from "/src/components/DriverListPanel.jsx";
import { Autocomplete as GmapAutocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places", "geometry"];

export default function MapView() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchText, setSearchText] = useState("");
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  const getLatLngFromDriver = (d) => {
    if (!d) return null;
    if (d.loc && typeof d.loc.lat === "number" && typeof d.loc.lng === "number") {
      return { lat: d.loc.lat, lng: d.loc.lng };
    }
    if (
      d.location &&
      typeof d.location.latitude === "number" &&
      typeof d.location.longitude === "number"
    ) {
      return { lat: d.location.latitude, lng: d.location.longitude };
    }
    return null;
  };

  useEffect(() => {
    document.title = "Map View";
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchDriverById = async (driverId) => {
      try {
        const docRef = doc(db, "users", driverId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const driverData = { id: docSnap.id, ...docSnap.data() };
          setSelectedDriver(driverData);

          const p = getLatLngFromDriver(driverData);
          if (mapRef.current && p) {
            mapRef.current.panTo(p);
            mapRef.current.setZoom(17);
          }
        }
      } catch (err) {
        console.error("Error fetching driver:", err);
      }
    };

    const params = new URLSearchParams(window.location.search);
    const driverId = params.get("driverId");
    if (driverId) fetchDriverById(driverId);
  }, []);

  const handleDriverSelect = useCallback((driver) => {
    // If driver is null, we're deselecting
    if (!driver) {
      setSelectedDriver(null);
      setDrawerOpen(false);
      // Reset map to default center
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: 14.5995, lng: 120.9842 });
        mapRef.current.setZoom(16);
      }
      return;
    }

    // Set the selected driver (automatically replaces previous selection)
    setSelectedDriver(driver);
    setDrawerOpen(false);

    // Get position and focus map
    const p = getLatLngFromDriver(driver);
    if (mapRef.current && p) {
      try {
        mapRef.current.panTo(p);
        mapRef.current.setZoom(17);
      } catch (err) {
        console.error("Error panning to driver:", err);
      }
    }
  }, []);

  const handlePlaceChanged = () => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace?.();
    
    if (!place || !place.geometry) {
      console.warn("No geometry found for place");
      return;
    }
    
    const loc = place.geometry.location;
    if (loc && mapRef.current) {
      const point = { lat: loc.lat(), lng: loc.lng() };
      mapRef.current.panTo(point);
      mapRef.current.setZoom(18);
      
      setSearchText(place.formatted_address || place.name || "");
    }
  };

  const geocodeSearch = (query) => {
    if (!query?.trim() || !window.google) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ 
      address: query,
      componentRestrictions: { country: "PH" },
      region: "ph"
    }, (results, status) => {
      if (status === "OK" && results?.[0] && mapRef.current) {
        const loc = results[0].geometry.location;
        const point = { lat: loc.lat(), lng: loc.lng() };
        mapRef.current.panTo(point);
        mapRef.current.setZoom(18);
        
        setSearchText(results[0].formatted_address);
      } else {
        console.warn("Geocode failed:", status);
        alert("Location not found. Please try a different search.");
      }
    });
  };

  if (!isLoaded) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading Map...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <style>
        {`
          .pac-container {
            z-index: 1300 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            border-radius: 4px;
            margin-top: 4px;
          }
          .pac-item {
            cursor: pointer;
            padding: 8px 12px;
            font-size: 14px;
          }
          .pac-item:hover {
            background-color: #f5f5f5;
          }
          .pac-icon {
            margin-right: 8px;
          }
        `}
      </style>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          p: 3,
          boxSizing: "border-box",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontFamily: "Lexend",
            fontWeight: "bold",
            color: "#00b2e1",
          }}
        >
          Map View
        </Typography>

      <Paper
        elevation={3}
        sx={{
          position: "relative",
          width: "100%",
          flexGrow: 1,
          minHeight: 400,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <MapComponent selectedDriver={selectedDriver} user={user} mapRef={mapRef} />

        <Box sx={{ 
          position: "absolute", 
          top: 16, 
          right: 16, 
          display: "flex", 
          flexDirection: "column",
          gap: 1.5,
          alignItems: "flex-end",
          zIndex: 1200,
          maxWidth: { xs: "50%", sm: "45%", md: "40%", lg: "35%", xl: "400px" },
        }}>
          {/* Search bar row */}
          <Box sx={{ 
            display: "flex", 
            gap: 1, 
            alignItems: "center",
            width: "100%",
          }}>
            {isLoaded && window.google ? (
              <GmapAutocomplete
                onLoad={(ac) => (autocompleteRef.current = ac)}
                onPlaceChanged={handlePlaceChanged}
                options={{
                  fields: ["geometry", "name", "formatted_address", "place_id", "address_components"],
                  componentRestrictions: { country: "ph" },
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Search place"
                  placeholder="Search place or address in Philippines"
                  defaultValue={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      geocodeSearch(e.target.value);
                    }
                  }}
                  sx={{ 
                    bgcolor: "white", 
                    borderRadius: 1,
                    '& .MuiInputBase-root': {
                      fontSize: { xs: "0.875rem", md: "0.95rem", xl: "1rem" },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: "0.875rem", md: "0.95rem", xl: "1rem" },
                    },
                  }}
                  inputProps={{
                    autoComplete: 'off',
                    'aria-autocomplete': 'list',
                  }}
                />
              </GmapAutocomplete>
            ) : (
              <TextField
                fullWidth
                size="small"
                label="Search place"
                placeholder="Loading search..."
                disabled
                sx={{ bgcolor: "white", borderRadius: 1 }}
              />
            )}

            <Fab size="small" color="primary" onClick={() => geocodeSearch(searchText)}>
              <SearchIcon />
            </Fab>
            {searchText && (
              <Fab size="small" color="default" onClick={() => setSearchText("")}>
                <CloseIcon />
              </Fab>
            )}
          </Box>

          {/* Action buttons row */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Tooltip title="Drivers">
              <Fab
                size="small"
                onClick={() => setDrawerOpen((prev) => !prev)}
                sx={{
                  bgcolor: "#00b2e1",
                  "&:hover": { bgcolor: "#0290bf" },
                  color: "#fff",
                }}
              >
                <PeopleAltIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box
          sx={{
            width: 360,
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <ChevronRightIcon />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: "#00b2e1", ml: 1 }}
            >
              Drivers
            </Typography>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            <DriverListPanel user={user} onDriverSelect={handleDriverSelect} mapRef={mapRef} selectedDriver={selectedDriver} />
          </Box>
        </Box>
      </Drawer>
    </Box>
    </>
  );
}
