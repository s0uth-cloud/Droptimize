import { Paper, Typography } from "@mui/material";

export default function SummaryCard({ title, count, color, onClick, selected }) {
  return (
    <Paper
      elevation={selected ? 4 : 2}
      onClick={onClick}
      sx={{
        p: { xs: 0.75, sm: 1, md: 1.5 },
        minWidth: { xs: 90, sm: 100, md: 110 },
        width: { xs: "auto", sm: 110, md: 120 },
        minHeight: { xs: 50, sm: 55, md: 60 },
        border: `2px solid ${color}`,
        borderRadius: 2,
        bgcolor: selected ? `${color}10` : "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 0.5,
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
          fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
          textAlign: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h6" 
        fontWeight="bold" 
        sx={{ 
          color,
          fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
          lineHeight: 1,
        }}
      >
        {count}
      </Typography>
    </Paper>
  );
}
