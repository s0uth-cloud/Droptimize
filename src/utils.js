/**
 * Consolidated Utility Functions
 * All utility functions and constants in one file
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Color mapping for driver and parcel statuses used across the UI.
 * Provides consistent visual representation of states in charts, cards, and markers.
 */
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

/**
 * Standard driver status constants to ensure consistency across the application.
 * Used for status updates, filtering, and conditional rendering.
 */
export const DRIVER_STATUS = {
  AVAILABLE: "Available",
  DELIVERING: "Delivering",
  OFFLINE: "Offline",
};

/**
 * Standard parcel status constants in lowercase for database queries and filtering.
 * Used throughout the app for status comparisons and updates.
 */
export const PARCEL_STATUS = {
  PENDING: "pending",
  OUT_FOR_DELIVERY: "out for delivery",
  DELIVERED: "delivered",
  FAILED: "failed",
  RETURNED: "returned",
};

/**
 * Crosswalk detection radius (15 meters) for triggering speed limit warnings.
 */
export const CROSSWALK_RADIUS_KM = 0.015;

/**
 * Speed limit enforced within crosswalk zones (10 km/h).
 */
export const CROSSWALK_LIMIT_KMH = 10;

/**
 * Color mapping for different zone types displayed on the map and in the legend.
 * Church (purple), Crosswalk (blue), School (orange), Slowdown (green).
 */
export const ZONE_COLORS = {
  Church: "#9c27b0",
  Crosswalk: "#2196F3",
  School: "#ff9914",
  Slowdown: "#29bf12",
};

/**
 * Thresholds and constants for speed calculation and GPS filtering.
 * Used by the speed tracking system to filter noise, smooth readings, and detect stationary vs moving states.
 */
export const SPEED_THRESHOLDS = {
  MOVING_THRESHOLD_M: 2,
  STATIONARY_DIST_M: 5,
  UPDATE_INTERVAL_MS: 1000,
  STATIONARY_WINDOW_MS: 4000,
  ZERO_HOLD_MS: 1500,
  EMA_ALPHA: 0.3,
  MIN_SPEED_THRESHOLD_KMH: 2,
  MIN_DISTANCE_FOR_CALC_M: 3,
  MIN_TIME_DELTA_S: 0.5,
  MAX_REASONABLE_SPEED_KMH: 150,
  GPS_ACCURACY_THRESHOLD_M: 30,
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

// Earth radius constants
export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS_M = 6371000;

// ============================================================================
// GEOSPATIAL UTILITIES
// ============================================================================

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export const toDegrees = (radians) => (radians * 180) / Math.PI;

/**
 * Calculate distance between two points using Haversine formula (in kilometers)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate distance between two points using Haversine formula (in meters)
 * @param {Object} pointA - First point with {lat, lng} properties
 * @param {Object} pointB - Second point with {lat, lng} properties
 * @returns {number} Distance in meters
 */
export function calculateDistanceMeters(pointA, pointB) {
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);
  const la1 = toRadians(pointA.lat);
  const la2 = toRadians(pointB.lat);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return EARTH_RADIUS_M * c;
}

/**
 * Calculate bearing between two points
 * @param {Object} pointA - First point with {lat, lng} properties
 * @param {Object} pointB - Second point with {lat, lng} properties
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(pointA, pointB) {
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const lon1 = toRadians(pointA.lng);
  const lon2 = toRadians(pointB.lng);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let deg = toDegrees(Math.atan2(y, x));
  if (deg < 0) deg += 360;
  return deg;
}

/**
 * Normalize angle to 0-360 range
 * @param {number} degrees - Angle in degrees
 * @returns {number} Normalized angle (0-360)
 */
export function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Smoothly interpolate between two headings (handles wrap-around)
 * @param {number} prevHeading - Previous heading in degrees
 * @param {number} nextHeading - Next heading in degrees
 * @param {number} alpha - Smoothing factor (0-1)
 * @returns {number} Smoothed heading in degrees
 */
export function smoothHeading(prevHeading, nextHeading, alpha) {
  let diff = ((nextHeading - prevHeading + 540) % 360) - 180;
  return normalizeDegrees(prevHeading + alpha * diff);
}

/**
 * Extract lat/lng from driver object (handles multiple data structures)
 * @param {Object} driver - Driver object
 * @returns {Object|null} Object with {latitude, longitude} or null if not found
 */
export function getDriverLocation(driver) {
  if (!driver) return null;

  // Check loc property
  if (driver.loc && typeof driver.loc.lat === "number" && typeof driver.loc.lng === "number") {
    return { latitude: driver.loc.lat, longitude: driver.loc.lng };
  }

  // Check location property
  if (driver.location) {
    if (typeof driver.location.latitude === "number" && typeof driver.location.longitude === "number") {
      return { latitude: driver.location.latitude, longitude: driver.location.longitude };
    }
    if (typeof driver.location.lat === "number" && typeof driver.location.lng === "number") {
      return { latitude: driver.location.lat, longitude: driver.location.lng };
    }
  }

  return null;
}

/**
 * Check if a driver is inside a slowdown zone
 * @param {Object} driver - Driver object with location
 * @param {Object} zone - Zone object with location and radius
 * @returns {boolean} True if driver is inside zone
 */
export function isInsideZone(driver, zone) {
  const driverLoc = getDriverLocation(driver);
  if (!driverLoc || !zone?.location) return false;

  const distKm = calculateDistanceKm(
    driverLoc.latitude,
    driverLoc.longitude,
    zone.location.lat,
    zone.location.lng
  );
  const radiusKm = (zone.radius || 15) / 1000;
  return distKm <= radiusKm;
}

// ============================================================================
// SPEED UTILITIES
// ============================================================================

/**
 * Get display speed from driver object (handles multiple data structures)
 * @param {Object} driver - Driver object
 * @returns {number|null} Speed in km/h or null
 */
export function getDisplaySpeed(driver) {
  if (!driver) return null;

  // Priority: loc.speed > location.speedKmh > speed > avgSpeed
  if (typeof driver.loc?.speed === "number" && isFinite(driver.loc.speed)) {
    return Math.round(driver.loc.speed);
  }

  if (typeof driver.location?.speedKmh === "number" && isFinite(driver.location.speedKmh)) {
    return Math.round(driver.location.speedKmh);
  }

  if (typeof driver.speed === "number" && isFinite(driver.speed)) {
    return Math.round(driver.speed);
  }

  if (typeof driver.avgSpeed === "number" && isFinite(driver.avgSpeed)) {
    return Math.round(driver.avgSpeed);
  }

  return null;
}

// ============================================================================
// INPUT VALIDATION UTILITIES
// ============================================================================

export const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9]{10,}$/;
export const PLATE_REGEX = /^[A-Z0-9\-]{2,15}$/;
export const ALPHANUMERIC_REGEX = /^[A-Za-z0-9]{3,20}$/;
export const VEHICLE_MODEL_REGEX = /^[A-Za-z0-9\s\-]{2,50}$/;
export const NUMERIC_DECIMAL_REGEX = /^[0-9]+(\.[0-9]{1,2})?$/;
export const ZIP_CODE_REGEX = /^[0-9]{4,10}$/;
export const TRACKING_ID_REGEX = /^[A-Z0-9\-]{4,20}$/;
export const WEBSITE_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)$/;

/**
 * Restricts names to letters, spaces, apostrophes and hyphens.
 */
export function sanitizeNameInput(value) {
  // Only trim, don't remove characters - validation will reject invalid input
  return String(value || "").trimStart();
}

export function sanitizeEmailInput(value) {
  return String(value || "").trim().toLowerCase();
}

export function sanitizePhoneInput(value) {
  // Remove non-numeric chars for user convenience, but validation will check
  return String(value || "").replace(/[^0-9]/g, "");
}

export function validateName(value, label = "Name") {
  const original = String(value || "").trim();
  if (!original) return `${label} is required`;
  
  // Check for numbers - reject if any digits found
  if (/\d/.test(original)) {
    return `${label} cannot contain numbers`;
  }
  
  // Check full pattern
  if (!NAME_REGEX.test(original)) {
    return `${label} must contain letters only (spaces, apostrophes, and hyphens are allowed)`;
  }
  return "";
}

export function validateEmail(value) {
  const cleaned = String(value || "").trim().toLowerCase();
  if (!cleaned) return "Email is required";
  if (!EMAIL_REGEX.test(cleaned)) return "Invalid email format";
  return "";
}

export function validateStrongPassword(value) {
  const password = String(value || "");
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include at least one number";
  return "";
}

export function validatePhone(value) {
  const cleaned = String(value || "").replace(/[^0-9]/g, "");
  if (!cleaned) return "Phone number is required";
  if (cleaned.length < 10) return "Phone number must be at least 10 digits";
  if (!/^[0-9]{10,}$/.test(cleaned)) return "Phone number can only contain digits";
  return "";
}

export function validatePlateNumber(value) {
  const cleaned = String(value || "").toUpperCase().trim();
  if (!cleaned) return "Plate number is required";
  if (!PLATE_REGEX.test(cleaned)) {
    return "Plate number must be 2-15 characters (letters, numbers, hyphens only)";
  }
  return "";
}

export function validateJoinCode(value) {
  const cleaned = String(value || "").toUpperCase().trim();
  if (!cleaned) return "Join code is required";
  if (!/^[A-Z0-9]{3,20}$/.test(cleaned)) {
    return "Join code must be 3-20 characters (letters and numbers only)";
  }
  return "";
}

export function validateVehicleModel(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Vehicle model is required";
  if (!VEHICLE_MODEL_REGEX.test(cleaned)) {
    return "Vehicle model must be 2-50 characters (letters, numbers, spaces, hyphens only)";
  }
  return "";
}

export function validateNumericField(value, fieldName = "Value", minValue = 0) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return `${fieldName} is required`;
  if (!NUMERIC_DECIMAL_REGEX.test(cleaned)) {
    return `${fieldName} must be a number (decimals allowed)`;
  }
  const num = parseFloat(cleaned);
  if (num < minValue) return `${fieldName} must be at least ${minValue}`;
  return "";
}

export function validateZipCode(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Zip code is required";
  if (!ZIP_CODE_REGEX.test(cleaned)) {
    return "Zip code must be 4-10 digits";
  }
  return "";
}

export function validateTrackingId(value) {
  const cleaned = String(value || "").toUpperCase().trim();
  if (!cleaned) return "Tracking ID is required";
  if (!TRACKING_ID_REGEX.test(cleaned)) {
    return "Tracking ID must be 4-20 characters (letters, numbers, hyphens only)";
  }
  return "";
}

export function validateAddress(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Address is required";
  if (cleaned.length < 5) return "Address must be at least 5 characters";
  if (cleaned.length > 200) return "Address is too long (max 200 characters)";
  // Allow letters, numbers, spaces, common punctuation for addresses
  if (!/^[A-Za-z0-9\s\.,#\-\/()]{5,200}$/.test(cleaned)) {
    return "Address contains invalid characters";
  }
  return "";
}

export function validateWebsite(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Website is required";
  if (!WEBSITE_REGEX.test(cleaned)) {
    return "Please enter a valid website URL";
  }
  return "";
}

export function validateTrackingIdOptional(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return ""; // Optional field
  if (!TRACKING_ID_REGEX.test(cleaned.toUpperCase())) {
    return "Tracking ID must be 4-20 characters (letters, numbers, hyphens only)";
  }
  return "";
}

export function validateRecipientName(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) return "Recipient name is required";
  if (/\d/.test(cleaned)) {
    return "Recipient name cannot contain numbers";
  }
  if (!NAME_REGEX.test(cleaned)) {
    return "Recipient name must contain letters only (spaces, apostrophes, and hyphens are allowed)";
  }
  return "";
}

/**
 * Check if driver is overspeeding
 * @param {number} currentSpeed - Current speed in km/h
 * @param {number} speedLimit - Speed limit in km/h
 * @returns {boolean} True if overspeeding
 */
export function isOverspeeding(currentSpeed, speedLimit) {
  return (
    typeof currentSpeed === "number" &&
    speedLimit != null &&
    speedLimit > 0 &&
    currentSpeed > speedLimit
  );
}

/**
 * Convert meters per second to kilometers per hour
 * @param {number} mps - Speed in meters per second
 * @returns {number} Speed in kilometers per hour
 */
export function mpsToKmh(mps) {
  return mps * 3.6;
}

/**
 * Convert kilometers per hour to meters per second
 * @param {number} kmh - Speed in kilometers per hour
 * @returns {number} Speed in meters per second
 */
export function kmhToMps(kmh) {
  return kmh / 3.6;
}
