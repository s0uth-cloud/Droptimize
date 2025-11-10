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
  ];

  const total = available + onTrip + offline;
  const isEmpty = total === 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: responsiveSpacing.cardP,
        height: { xs: 320, md: 340, lg: 350, xl: 350, xxl: 400 },
        width: { xs: 280, md: 290, lg: 300, xl: 300, xxl: 350 },
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="h6" gutterBottom align="center" sx={{color: "#00b2e1", fontFamily: "Lexend, sans-serif", fontWeight: "bold", fontSize: responsiveFontSizes.h6}}>
        Driver Status Breakdown
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
              minHeight: { xs: 160, md: 170, lg: 180, xl: 180, xxl: 200 },
            }}
          >
            <PieChart
              series={[{ data: data.map(({ id, value }) => ({ id, value })) }]}
              width={200}
              height={200}
              colors={data.map((d) => d.color)}
              valueFormatter={(value) => `${((value / total) * 100).toFixed(0)}%`}
              sx={{
                '& .MuiChartsLegend-series text': {
                  fontSize: `${responsiveFontSizes.caption} !important`,
                },
              }}
            />
          </Box>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: responsiveFontSizes.body2 }}>
              Total Drivers: {total}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                justifyItems: "center",
                rowGap: 0.5,
              }}
            >
              {data.map(({ id, value, color }) => (
                <Box
                  key={id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 8, md: 9, lg: 10, xxl: 12 },
                      height: { xs: 8, md: 9, lg: 10, xxl: 12 },
                      borderRadius: "50%",
                      backgroundColor: color,
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: responsiveFontSizes.caption }}>
                    {id}: {value}
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
