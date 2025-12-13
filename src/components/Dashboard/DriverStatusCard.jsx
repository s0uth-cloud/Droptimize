import { Paper, Typography, Box, Divider } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { responsiveFontSizes, responsiveSpacing } from "../../theme/responsiveTheme.js";

export default function DriverStatusCard({ drivers }) {
  // Extract values from the drivers object
  const available = drivers?.available || 0;
  const onTrip = drivers?.onTrip || 0;
  const offline = drivers?.offline || 0;

  const data = [
    { id: "Available", value: available, color: "#29bf12" },
    { id: "Delivering", value: onTrip, color: "#ff9914" },
    { id: "Offline", value: offline, color: "#c4cad0" },
  ].filter(item => item.value > 0);

  const total = available + onTrip + offline;
  const isEmpty = total === 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: responsiveSpacing.cardP,
        height: { xs: 280, md: 320, lg: 350, xl: 380, xxl: 420 },
        width: { xs: 220, md: 240, lg: 260, xl: 280, xxl: 320 },
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
            <Typography variant="h6" gutterBottom align="center" sx={{color: "#00b2e1", fontWeight: "bold", fontSize: responsiveFontSizes.h6}}>
        Driver Status Overview
      </Typography>

      {isEmpty ? (
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2" sx={{ fontSize: responsiveFontSizes.body2 }}>No data available</Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", mx: "auto", textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: { xs: 120, md: 140, lg: 150, xl: 160, xxl: 180 },
            }}
          >
            <PieChart
              series={[
                { 
                  data: data.map(({ id, value }) => ({ id, value, label: id })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                }
              ]}
              width={150}
              height={150}
              colors={data.map((d) => d.color)}
              slotProps={{
                legend: { hidden: true }
              }}
              margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
            />
          </Box>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: responsiveFontSizes.body2, fontWeight: 600 }}>
              Total: {total}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                alignItems: "flex-start",
                px: 2,
              }}
            >
              {data.map(({ id, value, color }) => (
                <Box
                  key={id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1 }}>
                    <Box
                      sx={{
                        width: { xs: 10, md: 11, lg: 12, xxl: 14 },
                        height: { xs: 10, md: 11, lg: 12, xxl: 14 },
                        borderRadius: "50%",
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: responsiveFontSizes.caption,
                        fontWeight: 500,
                      }}
                    >
                      {id}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: responsiveFontSizes.caption,
                      fontWeight: "bold",
                      color: color,
                    }}
                  >
                    {value} ({((value / total) * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
