/**
 * Speed calculation utilities
 */

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
