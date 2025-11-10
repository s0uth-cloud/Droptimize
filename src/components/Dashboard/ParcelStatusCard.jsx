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
    { id: "Failed/Returned", value: failedOrReturned, color: "#f21b3f" },
  ].filter(item => item.value > 0);

  const total = delivered + pending + outForDelivery + failedOrReturned;
  const isEmpty = total === 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: responsiveSpacing.cardP,
        height: { xs: 380, md: 400, lg: 420, xl: 420, xxl: 480 },
        width: { xs: 300, md: 320, lg: 340, xl: 340, xxl: 400 },
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Title */}
            <Typography variant="h6" align="center" gutterBottom sx={{color: "#00b2e1", fontWeight: "bold", fontSize: responsiveFontSizes.h6}}>
        Parcel Status Overview
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
              series={[
                { 
                  data: data.map(({ id, value }) => ({ id, value, label: id })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                }
              ]}
              width={200}
              height={200}
              colors={data.map((d) => d.color)}
              slotProps={{
                legend: { hidden: true }
              }}
              margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: responsiveFontSizes.body2, fontWeight: 600 }}>
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
                      color="textSecondary" 
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
        </>
      )}
    </Paper>
  );
}
