import {
Box,
Card,
CardContent,
Typography,
Grid,
Chip,
Avatar,
Skeleton,
Stack,
IconButton,
Dialog,
DialogTitle,
DialogContent,
DialogActions,
Button,
Checkbox,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useState, useEffect } from "react";
import ParcelDetailsModal from "./ParcelDetailsModal";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "/src/firebaseConfig";
import { STATUS_COLORS } from "../../utils";

const statusOrder = ["pending", "out for delivery", "delivered", "failed", "returned"];

export default function ParcelList({ parcels = [], loading = false, selectedParcels = [], onSelectionChange }) {
const [selectedParcel, setSelectedParcel] = useState(null);

useEffect(() => {
console.log("📦 ParcelList received:", parcels);
}, [parcels]);

const formatDate = (date) => {
try {
if (!date) return "N/A";
if (date instanceof Date) return date.toLocaleDateString();
if (typeof date.toDate === "function") return date.toDate().toLocaleDateString();
return new Date(date).toLocaleDateString();
} catch {
return "Invalid Date";
}
};

const handleOpen = (parcel) => setSelectedParcel(parcel);
const handleClose = () => setSelectedParcel(null);

const handleToggleSelect = (parcelId, event) => {
event.stopPropagation();
if (selectedParcels.includes(parcelId)) {
onSelectionChange(selectedParcels.filter(id => id !== parcelId));
} else {
onSelectionChange([...selectedParcels, parcelId]);
}
};

const handleSelectAll = (event) => {
event.stopPropagation();
if (selectedParcels.length === sortedParcels.length) {
onSelectionChange([]);
} else {
onSelectionChange(sortedParcels.map(p => p.id));
}
};

if (loading) {
return ( <Grid container spacing={2}>
{[1, 2, 3].map((item) => (
<Grid
key={item}
size={{
xs: 12,
sm: 6,
md: 4
}}>
<Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} /> </Grid>
))} </Grid>
);
}

if (!parcels.length) {
return ( <Typography variant="body2" color="text.secondary">
No parcels found. </Typography>
);
}

const sortedParcels = [...parcels].sort((a, b) => {
const sOrder =
statusOrder.indexOf((a.status || "").toLowerCase()) -
statusOrder.indexOf((b.status || "").toLowerCase());
if (sOrder !== 0) return sOrder;
return (b.dateAdded?.seconds || 0) - (a.dateAdded?.seconds || 0);
});

return (
<>
{onSelectionChange && sortedParcels.length > 0 && (
<Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
<Checkbox
checked={selectedParcels.length === sortedParcels.length && sortedParcels.length > 0}
indeterminate={selectedParcels.length > 0 && selectedParcels.length < sortedParcels.length}
onChange={handleSelectAll}
/>
<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
Select All ({selectedParcels.length}/{sortedParcels.length})
</Typography>
</Box>
)}
<Grid container spacing={2}>
{sortedParcels.map((parcel, index) => {
const statusKey = parcel.status?.toLowerCase() || "pending";
const isInvalid = !parcel.destination || parcel.destination.latitude === null || parcel.destination.longitude === null;
const color = isInvalid ? "#f21b3f" : (STATUS_COLORS[statusKey] || "#c4cad0");


      return (
        <Grid
          key={parcel.id || index}
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": { boxShadow: 6, transform: "translateY(-3px)" },
              display: "flex",
              alignItems: "center",
              border: isInvalid ? "2px solid #f21b3f" : "none",
              position: "relative",
            }}
            onClick={() => handleOpen(parcel)}
          >
            {/* Selection Checkbox */}
            {onSelectionChange && (
              <Checkbox
                checked={selectedParcels.includes(parcel.id)}
                onChange={(e) => handleToggleSelect(parcel.id, e)}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  zIndex: 1,
                }}
              />
            )}

            <Avatar
              sx={{
                bgcolor: color,
                width: 48,
                height: 48,
                ml: 2,
                mr: 2,
              }}
            >
              <LocalShippingIcon />
            </Avatar>

            <CardContent sx={{ flex: 1 }}>
              <Stack spacing={0.5}>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  <Chip
                    label={isInvalid ? "Invalid" : (parcel.status || "Pending")}
                    size="small"
                    sx={{
                      backgroundColor: color,
                      color: "#fff",
                      fontSize: "0.75rem",
                      textTransform: "capitalize",
                      width: "fit-content",
                    }}
                  />
                {isInvalid && (
                  <Typography variant="caption" color="error" sx={{ fontWeight: 500 }}>
                    ⚠️ Missing destination
                  </Typography>
                )}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {parcel.recipient || "Unnamed Recipient"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[parcel.municipality, parcel.province].filter(Boolean).join(", ") || "No address available"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Added: {formatDate(parcel.dateAdded)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      );
    })}
  </Grid>

  <ParcelDetailsModal
    open={Boolean(selectedParcel)}
    onClose={handleClose}
    parcel={selectedParcel}
  />
</>
);
}
