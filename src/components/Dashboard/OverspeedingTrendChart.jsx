import { useState } from "react";
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

export default function OverspeedingTrendChart({ dailyData = [], weeklyData = [] }) {
  const [view, setView] = useState("daily");

  const handleChange = (_, nextView) => nextView && setView(nextView);
  const selectedData = view === "daily" ? dailyData : weeklyData;
  const noData = !selectedData || selectedData.length === 0;

  return (
    <Paper elevation={3} sx={{ p: { xs: 1.5, md: 2 }, height: { xs: 280, md: 320, lg: 350, xl: 380, xxl: 420 }, minWidth: { xs: 300, md: 500, lg: 600, xl: 700, xxl: 800 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" sx={{color: "#00b2e1", fontWeight: "bold"}}>Overspeeding Drivers</Typography>
        <ToggleButtonGroup value={view} exclusive onChange={handleChange} size="small">
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {noData ? (
        <Box sx={{ height: { xs: 210, md: 240, lg: 270, xl: 300, xxl: 340 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="body2" color="text.secondary">No data available</Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", height: { xs: 210, md: 240, lg: 270, xl: 300, xxl: 340 } }}>
          <LineChart
            xAxis={[{ scaleType: "point", data: selectedData.map(p => p.date), label: view === "daily" ? "Date" : "Week" }]}
            series={[
              {
                data: selectedData.map(p => p.topSpeed),
                label: "Top Speed (km/h)",
                color: "#0064b5",
                yAxisKey: "right",
              },
              {
                data: selectedData.map(p => p.violations),
                label: "Overspeeding Violations",
                color: "#f21b3f",
                yAxisKey: "left",
              },
            ]}
            yAxis={[
              { id: "left", label: "Incidents", min: 0 },
              { id: "right", label: "Avg Speed (km/h)", min: 0 },
            ]}
          />
        </Box>
      )}
    </Paper>
  );
}
