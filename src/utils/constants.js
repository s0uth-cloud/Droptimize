/**
 * Application-wide constants
 */

// Status colors
export const STATUS_COLORS = {
  available: "#29bf12",
  delivering: "#ff9914",
  offline: "#c4cad0",
  delivered: "#29bf12",
  failed: "#f21b3f",
  returned: "#f21b3f",
  "out for delivery": "#ff9914",
  pending: "#c4cad0",
};

// Driver statuses
export const DRIVER_STATUS = {
  AVAILABLE: "Available",
  DELIVERING: "Delivering",
  OFFLINE: "Offline",
};

// Parcel statuses
export const PARCEL_STATUS = {
  PENDING: "pending",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  FAILED: "failed",
  RETURNED: "returned",
};

// Crosswalk detection
export const CROSSWALK_RADIUS_KM = 0.015;
export const CROSSWALK_LIMIT_KMH = 10;

// Map colors for slowdown zones
export const ZONE_COLORS = {
  Church: "#9c27b0",
  Crosswalk: "#2196F3",
  School: "#ff9914",
  Slowdown: "#29bf12",
};

// Speed and distance thresholds
export const SPEED_THRESHOLDS = {
  MOVING_THRESHOLD_M: 3,
  STATIONARY_DIST_M: 6,
  UPDATE_INTERVAL_MS: 1500,
  STATIONARY_WINDOW_MS: 3000,
  ZERO_HOLD_MS: 2000,
};

// Default time allowances
export const TIME_ALLOWANCES = {
  MINUTES_PER_PARCEL: 5,
};

// Default map center (Manila, Philippines)
export const DEFAULT_MAP_CENTER = {
  lat: 14.5995,
  lng: 120.9842,
};
