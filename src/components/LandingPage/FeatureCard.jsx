import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import { responsiveFontSizes, responsiveSpacing, responsiveDimensions } from "../../theme/responsiveTheme.js";

export default function FeatureCard({ title, description, icon }) {
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        color: "#000000",
        borderRadius: "8px",
        p: responsiveSpacing.cardP,
        m: responsiveSpacing.gapSmall,
        width: responsiveDimensions.featureCard.width,
        height: responsiveDimensions.featureCard.height,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s ease",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >
      <Box
        component="img"
        src={icon}
        alt={`${title} icon`}
        sx={{
          width: responsiveDimensions.featureCard.iconWidth,
          mb: 2,
        }}
      />

      <CardContent sx={{ textAlign: "center", p: 0 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: responsiveFontSizes.h6,
            mb: 1,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#333",
            fontSize: responsiveFontSizes.body2,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
