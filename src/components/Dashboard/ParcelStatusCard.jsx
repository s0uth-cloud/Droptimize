import { Paper, Typography, Box, Divider } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { responsiveFontSizes, responsiveSpacing } from "../../theme/responsiveTheme.js";

export default function ParcelStatusCard({
  delivered = 0,
  pending = 0,
  outForDelivery = 0,
  failedOrReturned = 0,
}) {
  const data = [
    { id: "Delivered", value: delivered, color: "#29bf12" },
    { id: "Out for Delivery", value: outForDelivery, color: "#ff9914" },
    { id: "Pending", value: pending, color: "#c4cad0" },
  ];

  const total = delivered + pending + outForDelivery + failedOrReturned;
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
      {/* Title */}
      <Typography variant="h6" align="center" gutterBottom sx={{color: "#00b2e1", fontFamily: "Lexend, sans-serif", fontWeight: "bold", fontSize: responsiveFontSizes.h6}}>
        Parcel Status Breakdown
      </Typography>

      {/* No data fallback */}
      {isEmpty ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: responsiveFontSizes.body2 }}>
            No data available
          </Typography>
        </Box>
      ) : (
        <>
          {/* Chart */}
          <Box
            sx={{
              flex: 1,
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
              valueFormatter={(v) => `${((v / total) * 100).toFixed(0)}%`}
              sx={{
                '& .MuiChartsLegend-series text': {
                  fontSize: `${responsiveFontSizes.caption} !important`,
                },
              }}
            />
          </Box>

          {/* Legend */}
          <Box
            sx={{
              textAlign: "center",
              mt: 1,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: responsiveFontSizes.body2 }}>
              Total Parcels: {total}
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
        </>
      )}
    </Paper>
  );
}
