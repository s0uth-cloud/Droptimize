import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
} from "@mui/material";

export default function RecentIncidentCard({ incidents = [] }) {
  const [resolvedIncidents, setResolvedIncidents] = useState([]);

useEffect(() => {
  const fetchLocationNames = async () => {
    const updated = await Promise.all(
      incidents.map(async (incident) => {
        let lat = null;
        let lng = null;

        if (typeof incident.location === "string" && incident.location.includes(",")) {
          const [latStr, lngStr] = incident.location.split(",").map((v) => v.trim());
          lat = parseFloat(latStr);
          lng = parseFloat(lngStr);
        }

        if (!isNaN(lat) && !isNaN(lng)) {
          try {
            console.log(lat, lng);
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            const address = data.results?.[0]?.formatted_address || "Unknown Location";
            return { ...incident, address };
          } catch (error) {
            console.error("Error fetching location:", error);
            return { ...incident, address: "Unknown Location" };
          }
        }

        return { ...incident, address: "Unknown Location" };
      })
    );
    setResolvedIncidents(updated);
  };

  if (incidents.length > 0) fetchLocationNames();
}, [incidents]);


  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1.5, md: 2 },
        height: { xs: 280, md: 320, lg: 350, xl: 380, xxl: 420 },
        minWidth: { xs: 300, md: 340, lg: 380, xl: 420, xxl: 460 },
        maxWidth: { xs: 320, md: 380, lg: 420, xl: 460, xxl: 500 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom sx={{color: "#00b2e1", fontWeight: "bold", flexShrink: 0}}>
        Recent Overspeeding Incidents
      </Typography>

      {resolvedIncidents.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 2, color: "text.secondary", flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body2">No recent incidents recorded</Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
          <List sx={{ py: 0 }}>
            {resolvedIncidents.map((incident, index) => (
              <ListItem 
                key={incident.id || index} 
                divider={index < incidents.length - 1}
                sx={{ px: 0, py: { xs: 1, md: 1.5 } }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}>
                        {incident.driverName}
                      </Typography>
                      <Chip
                        size="small"
                        color="error"
                        label={`${incident.topSpeed} km/h`}
                        sx={{ height: { xs: 18, md: 20 }, fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                      />
                      <Chip
                        size="small"
                        label={`Limit: ${incident.speedLimit} km/h`}
                        sx={{ height: { xs: 18, md: 20 }, bgcolor: "#f0f0f0", color: "#666", fontSize: { xs: "0.65rem", md: "0.75rem" } }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span" sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" } }}>
                        {incident.date}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ display: "block", fontSize: { xs: "0.7rem", md: "0.875rem" } }}
                      >
                        {incident.address}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}
