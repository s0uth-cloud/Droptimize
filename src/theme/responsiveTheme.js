/**
 * Responsive Theme Configuration for Droptimize
 * 
 * Provides responsive sizing utilities for components across different screen resolutions:
 * - 720p (1280x720)
 * - 1080p (1920x1080) - Base design
 * - 2K (2560x1440)
 * 
 * Usage: Import and apply to sx props in MUI components
 */

// Breakpoints based on common resolutions
export const breakpoints = {
  xs: 0,      // Mobile
  sm: 600,    // Small tablets
  md: 960,    // Tablets / 720p
  lg: 1280,   // 720p to 1080p
  xl: 1920,   // 1080p to 2K
  xxl: 2560,  // 2K and above
};

// Responsive font sizes - scales from 720p to 2K
export const responsiveFontSizes = {
  // Logo and brand text
  logo: {
    xs: "1rem",
    md: "1.1rem",
    lg: "1.25rem",
    xl: "1.5rem",
    xxl: "1.75rem",
  },
  
  // Page titles
  h4: {
    xs: "1.5rem",
    md: "1.75rem",
    lg: "2rem",
    xl: "2.125rem",
    xxl: "2.5rem",
  },
  
  h5: {
    xs: "1.25rem",
    md: "1.35rem",
    lg: "1.5rem",
    xl: "1.5rem",
    xxl: "1.75rem",
  },
  
  h6: {
    xs: "1rem",
    md: "1.1rem",
    lg: "1.25rem",
    xl: "1.25rem",
    xxl: "1.5rem",
  },
  
  // Body text
  body1: {
    xs: "0.875rem",
    md: "0.95rem",
    lg: "1rem",
    xl: "1rem",
    xxl: "1.125rem",
  },
  
  body2: {
    xs: "0.8rem",
    md: "0.85rem",
    lg: "0.9rem",
    xl: "0.95rem",
    xxl: "1rem",
  },
  
  // Button text
  button: {
    xs: "0.875rem",
    md: "0.95rem",
    lg: "1rem",
    xl: "1rem",
    xxl: "1.125rem",
  },
  
  // Navigation text
  nav: {
    xs: "0.85rem",
    md: "0.95rem",
    lg: "1rem",
    xl: "1.25rem",
    xxl: "1.5rem",
  },
  
  // Small text / captions
  caption: {
    xs: "0.7rem",
    md: "0.75rem",
    lg: "0.875rem",
    xl: "0.875rem",
    xxl: "1rem",
  },
};

// Responsive spacing - padding and margins
export const responsiveSpacing = {
  // Section padding (vertical)
  sectionPy: {
    xs: 3,
    md: 4,
    lg: 6,
    xl: 6,
    xxl: 8,
  },
  
  // Section padding (horizontal)
  sectionPx: {
    xs: 2,
    md: 2,
    lg: 3,
    xl: 4,
    xxl: 6,
  },
  
  // Card padding
  cardP: {
    xs: 2,
    md: 2,
    lg: 2,
    xl: 2,
    xxl: 3,
  },
  
  // Small gaps
  gapSmall: {
    xs: 1,
    md: 1.5,
    lg: 2,
    xl: 2,
    xxl: 2.5,
  },
  
  // Medium gaps
  gapMedium: {
    xs: 2,
    md: 2,
    lg: 2,
    xl: 3,
    xxl: 4,
  },
  
  // Large gaps
  gapLarge: {
    xs: 3,
    md: 3,
    lg: 3,
    xl: 4,
    xxl: 5,
  },
};

// Responsive component dimensions
export const responsiveDimensions = {
  // Sidebar/Drawer width
  drawerWidth: {
    xs: 200,
    md: 220,
    lg: 250,
    xl: 250,
    xxl: 300,
  },
  
  // Logo dimensions
  logoWidth: {
    xs: 120,
    md: 130,
    lg: 150,
    xl: 150,
    xxl: 180,
  },
  
  // Feature card dimensions
  featureCard: {
    width: {
      xs: 250,
      md: 270,
      lg: 300,
      xl: 300,
      xxl: 350,
    },
    height: {
      xs: 350,
      md: 380,
      lg: 400,
      xl: 400,
      xxl: 450,
    },
    iconWidth: {
      xs: 150,
      md: 180,
      lg: 200,
      xl: 200,
      xxl: 240,
    },
  },
  
  // Button dimensions
  buttonHeight: {
    xs: 44,
    md: 48,
    lg: 52,
    xl: 54,
    xxl: 58,
  },
  
  buttonPx: {
    xs: 2.5,
    md: 3,
    lg: 3.5,
    xl: 4,
    xxl: 5,
  },
  
  buttonPy: {
    xs: 1.1,
    md: 1.2,
    lg: 1.3,
    xl: 1.4,
    xxl: 1.6,
  },
  
  // Form field dimensions
  formWidth: {
    xs: 360,
    md: 420,
    lg: 480,
    xl: 520,
    xxl: 600,
  },
  
  // QR Code dimensions
  qrCodeSize: {
    xs: 100,
    md: 110,
    lg: 120,
    xl: 140,
    xxl: 160,
  },
  
  qrCodeContainer: {
    xs: 120,
    md: 130,
    lg: 140,
    xl: 140,
    xxl: 170,
  },
  
  // Chart heights
  chartHeight: {
    xs: 280,
    md: 320,
    lg: 350,
    xl: 400,
    xxl: 450,
  },
  
  // Chart widths (for side-by-side layouts)
  chartWidth: {
    xs: "100%",
    md: "100%",
    lg: "48%",
    xl: "48%",
    xxl: "48%",
  },
  
  // Hero image
  heroMaxWidth: {
    xs: 350,
    md: 400,
    lg: 500,
    xl: 500,
    xxl: 600,
  },
  
  // Content max width
  contentMaxWidth: {
    xs: 400,
    md: 450,
    lg: 500,
    xl: 500,
    xxl: 600,
  },
};

// Helper function to get responsive values
export const getResponsiveValue = (valueObject) => {
  return {
    xs: valueObject.xs,
    md: valueObject.md,
    lg: valueObject.lg,
    xl: valueObject.xl,
    xxl: valueObject.xxl,
  };
};

// Icon sizes for different contexts
export const iconSizes = {
  small: {
    xs: "1rem",
    md: "1.1rem",
    lg: "1.25rem",
    xl: "1.25rem",
    xxl: "1.5rem",
  },
  medium: {
    xs: "1.5rem",
    md: "1.75rem",
    lg: "2rem",
    xl: "2rem",
    xxl: "2.5rem",
  },
  large: {
    xs: "2rem",
    md: "2.5rem",
    lg: "3rem",
    xl: "3rem",
    xxl: "3.5rem",
  },
};

export default {
  breakpoints,
  responsiveFontSizes,
  responsiveSpacing,
  responsiveDimensions,
  getResponsiveValue,
  iconSizes,
};
