import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Divider,
  Button,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useJsApiLoader } from "@react-google-maps/api";
import { auth, db } from "../firebaseConfig";
import DriversHeader from "../components/Drivers/DriversHeader.jsx";
import DriverList from "../components/Drivers/DriverList.jsx";
import AssignDriverModal from "../components/Modals/AssignDriver.jsx";
import DriverDetailsModal from "../components/Drivers/DriverDetailsModal.jsx";
import InviteDriverModal from "../components/Modals/InviteDriverModal.jsx";

const libraries = ["places", "geometry"];

export default function Drivers() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [user, setUser] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchBranchId = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setBranchId(userDoc.data().branchId || null);
        }
      } catch (err) {
        console.error("Error fetching branch ID:", err);
      }
    };
    fetchBranchId();
  }, [user]);

  useEffect(() => {
    if (!branchId) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "driver"),
      where("branchId", "==", branchId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const driverData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllDrivers(driverData);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading drivers:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [branchId]);

  const getDisplayName = (d) =>
    `${d?.firstName || ""} ${d?.lastName || ""}`.trim() ||
    d?.displayName ||
    "Unnamed Driver";

  const filteredDrivers = useMemo(() => {
    let result = [...allDrivers];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (d) =>
          getDisplayName(d).toLowerCase().includes(q) ||
          (d.id || "").toLowerCase().includes(q)
      );
    }

    if (selectedStatus) {
      result = result.filter(
        (d) => (d.status || "").toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    return result;
  }, [allDrivers, searchQuery, selectedStatus]);

  const handleAssignParcelClick = (driver) => {
    setSelectedDriver(driver);
    setAssignModalOpen(true);
  };

  const handleViewDetails = (driver) => {
    setSelectedDriver(driver);
    setDetailsModalOpen(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        px: { xs: 2, md: 4 },
        py: 3,
        boxSizing: "border-box",
      }}
    >
      {/* Page Title */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography
          variant="h4"
          sx={{
            color: "#00b2e1",
            fontWeight: "bold",
            fontFamily: "Lexend",
          }}
        >
          Manage Drivers
        </Typography>
        <Button
          variant="contained"
          onClick={() => setInviteModalOpen(true)}
          sx={{
            bgcolor: "#00b2e1",
            "&:hover": { bgcolor: "#007bb5" },
            textTransform: "none",
            fontWeight: "bold",
            px: 3,
          }}
        >
          + Invite Driver
        </Button>
      </Stack>

      {!isLoaded && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
          <Typography sx={{ ml: 2 }}>Loading Google Maps...</Typography>
        </Box>
      )}

      <Stack spacing={3} sx={{ width: "100%" }}>
        {/* Filters */}
        <DriversHeader
          showSearch
          onSearch={setSearchQuery}
          onStatusSelect={setSelectedStatus}
          counts={{
            all: allDrivers.length,
            available: allDrivers.filter(
              (d) => (d.status || "").toLowerCase() === "available"
            ).length,
            delivering: allDrivers.filter(
              (d) => (d.status || "").toLowerCase() === "delivering"
            ).length,
            offline: allDrivers.filter(
              (d) => !d.status || (d.status || "").toLowerCase() === "offline"
            ).length,
          }}
        />

        <Divider sx={{ borderColor: "#c4cad0" }} />

        {/* Driver List */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
              width: "100%",
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <DriverList
              drivers={filteredDrivers}
              onAssignParcel={handleAssignParcelClick}
              onViewDetails={handleViewDetails}
            />
          </Box>
        )}
      </Stack>

      {/* Assign Parcel Modal */}
      <AssignDriverModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        driver={selectedDriver}
      />

      {/* Driver Details Modal */}
      <DriverDetailsModal
        open={detailsModalOpen}
        driver={selectedDriver}
        onClose={() => setDetailsModalOpen(false)}
        onAssignParcel={(driver) => {
          setDetailsModalOpen(false);
          handleAssignParcelClick(driver);
        }}
      />

      {/* Invite Driver Modal */}
      <InviteDriverModal
        open={inviteModalOpen}
        handleClose={() => setInviteModalOpen(false)}
        branchId={branchId}
      />
    </Box>
  );
}
