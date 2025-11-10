import { Paper, Typography } from "@mui/material";

export default function SummaryCard({ title, count, color, onClick, selected }) {
  return (
    <Paper
      elevation={selected ? 4 : 2}
      onClick={onClick}
      sx={{
        p: { xs: 0.5, sm: 0.6, md: 0.8 },
        minWidth: { xs: 70, sm: 80, md: 90 },
        width: { xs: "auto", sm: 90, md: 100 },
        minHeight: { xs: 40, sm: 45, md: 50 },
        border: `2px solid ${color}`,
        borderRadius: 2,
        bgcolor: selected ? `${color}10` : "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 0.3,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          bgcolor: `${color}22`,
          transform: "translateY(-2px)",
          elevation: 5,
        },
      }}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          color, 
          fontWeight: 500,
          fontSize: { xs: "0.6rem", sm: "0.65rem", md: "0.7rem" },
          textAlign: "center",
          lineHeight: 1.1,
          whiteSpace: "normal",
          wordWrap: "break-word",
          maxWidth: "100%",
          px: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h6" 
        fontWeight="bold" 
        sx={{ 
          color,
          fontSize: { xs: "0.85rem", sm: "0.9rem", md: "1rem" },
          lineHeight: 1,
        }}
      >
        {count}
      </Typography>
    </Paper>
  );
}
