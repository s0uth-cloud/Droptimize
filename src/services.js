/**
 * Consolidated Services
 * All Firebase services and data normalizers in one file
 */

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ============================================================================
// DATA NORMALIZERS
// ============================================================================

/**
 * Normalize driver data to provide consistent shape across the UI
 * @param {Object} raw - Raw driver data from Firestore
 * @returns {Object} Normalized driver object
 */
export function normalizeDriver(raw = {}) {
  const source = { ...raw };
  const id = source.id || source.uid || source._id || null;

  // name
  const nameFromParts = `${source.firstName || ""} ${source.lastName || ""}`.trim();
  const fullName =
    source.fullName || source.displayName || nameFromParts || source.name || null;

  // photo / avatar
  const photoURL = source.photoURL || source.avatar || source.profilePhoto || source.image || "";

  // normalize location into both `.loc` and `.location` shapes so existing code keeps working
  let latitude = null;
  let longitude = null;
  let locSpeed = null;

  if (source.loc && typeof source.loc.lat === "number" && typeof source.loc.lng === "number") {
    latitude = source.loc.lat;
    longitude = source.loc.lng;
    locSpeed = source.loc.speed ?? source.loc.speedKmh ?? null;
  } else if (
    source.location &&
    (typeof source.location.latitude === "number" || typeof source.location.lat === "number")
  ) {
    latitude = source.location.latitude ?? source.location.lat;
    longitude = source.location.longitude ?? source.location.lng;
    locSpeed = source.location.speedKmh ?? source.location.speed ?? null;
  } else if (source.geo && typeof source.geo.lat === "number") {
    latitude = source.geo.lat;
    longitude = source.geo.lng;
    locSpeed = source.geo.speed ?? null;
  }

  // Preserve extra fields like heading/ts when available on the original source.loc/location
  const loc =
    latitude != null && longitude != null
      ? {
          lat: latitude,
          lng: longitude,
          speed: locSpeed,
          heading: source.loc?.heading ?? source.heading ?? null,
          ts: source.loc?.ts ?? source.location?.ts ?? source.ts ?? null,
        }
      : source.loc || null;

  const location = loc
    ? { latitude: loc.lat, longitude: loc.lng, speedKmh: loc.speed, heading: loc.heading, ts: loc.ts }
    : source.location || null;

  // status normalized to lowercase string when present
  const statusRaw = source.status ?? source.state ?? "";
  const status = typeof statusRaw === "string" ? statusRaw.toLowerCase() : String(statusRaw).toLowerCase();

  // speeds
  const speed =
    typeof loc?.speed === "number"
      ? Math.round(loc.speed)
      : typeof source.speed === "number"
      ? Math.round(source.speed)
      : typeof source.speedKmh === "number"
      ? Math.round(source.speedKmh)
      : null;

  const avgSpeed = source.avgSpeed ?? null;
  const topSpeed = source.topSpeed ?? null;

  // parcels assigned count (some shapes use parcels, parcelsAssigned, parcelsLeft)
  const parcelsCount =
    Array.isArray(source.parcels) ? source.parcels.length : source.parcelsLeft ?? source.parcelsCount ?? null;

  return {
    // spread original properties first so we can override them
    ...source,
    // keep original reference for fallbacks
    __raw: source,
    // normalized fields that should override any original values
    id,
    uid: id,
    fullName,
    photoURL,
    loc,
    location,
    status,
    speed,
    avgSpeed,
    topSpeed,
    parcelsCount,
  };
}

/**
 * Normalize parcel data to provide consistent shape across the UI
 * @param {Object} raw - Raw parcel data from Firestore
 * @returns {Object} Normalized parcel object
 */
export function normalizeParcel(raw = {}) {
  const p = { ...raw };
  const id = p.id || p.packageId || p.reference || null;
  return {
    __raw: p,
    id,
    reference: p.reference || p.packageId || id,
    status: (p.status || "").toString(),
    recipient: p.recipient || p.name || "",
    ...p,
  };
}

// ============================================================================
// PARCEL SERVICES
// ============================================================================

/**
 * Fetch all parcels, optionally filtered by user ID
 * @param {string|null} uid - User ID to filter parcels
 * @returns {Promise<Array>} Array of parcel objects
 */
export const fetchAllParcels = async (uid = null) => {
  try {
    const parcels = [];
    const parcelsRef = collection(db, "parcels");
    const parcelsSnapshot = await getDocs(parcelsRef);

    if (parcelsSnapshot.empty) return parcels;

    for (const parcelDoc of parcelsSnapshot.docs) {
      const parcelId = parcelDoc.id;
      const parcelData = parcelDoc.data();

      if (uid && parcelData.uid !== uid) continue;

      parcels.push({
        id: parcelId,
        weight: parcelData.weight,
        reference: parcelId || "",
        status: parcelData.status || "Pending",
        recipient: parcelData.recipient || "",
        recipientContact: parcelData.recipientContact || "",
        street: parcelData.street || "",
        barangay: parcelData.barangay || "",
        municipality: parcelData.municipality || "",
        province: parcelData.province || "",
        region: parcelData.region || "",
        dateAdded: parcelData.dateAdded?.toDate() || new Date(),
        userId: parcelData.uid || "",
        destination: parcelData.destination || null,
      });
    }

    return parcels;
  } catch (error) {
    console.error("Error fetching parcels:", error);
    return [];
  }
};

/**
 * Fetch parcel status statistics
 * @param {string|null} uid - User ID to filter parcels
 * @returns {Promise<Object>} Object with status counts
 */
export const fetchParcelStatusData = async (uid = null) => {
  try {
    let delivered = 0;
    let outForDelivery = 0;
    let failedOrReturned = 0;
    let pending = 0;

    const parcelsRef = collection(db, "parcels");
    const parcelsSnapshot = await getDocs(parcelsRef);

    if (parcelsSnapshot.empty) {
      return { delivered: 0, outForDelivery: 0, failedOrReturned: 0, pending: 0, total: 0 };
    }

    for (const parcelDoc of parcelsSnapshot.docs) {
      const parcelData = parcelDoc.data();
      if (uid && parcelData.uid !== uid) continue;

      switch (parcelData.status?.toLowerCase()) {
        case "delivered":
          delivered++;
          break;
        case "out for delivery":
          outForDelivery++;
          break;
        case "failed":
        case "returned":
          failedOrReturned++;
          break;
        case "pending":
        default:
          pending++;
          break;
      }
    }

    return {
      delivered,
      outForDelivery,
      failedOrReturned,
      pending,
      total: delivered + outForDelivery + failedOrReturned + pending,
    };
  } catch (error) {
    console.error("Error fetching parcel status data:", error);
    return { delivered: 0, outForDelivery: 0, failedOrReturned: 0, pending: 0, total: 0 };
  }
};

/**
 * Add a new parcel
 * @param {Object} parcelData - Parcel data to add
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Result object with success status
 */
export const addParcel = async (parcelData, uid) => {
  try {
    if (!uid) throw new Error("User ID (uid) is required to add a parcel");

    const now = new Date();
    // Use reference as parcelId if provided, otherwise generate one
    const parcelId =
      parcelData.reference ||
      parcelData.id ||
      `PKG${Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0")}`;

    const dataToStore = {
      uid,
      weight: parcelData.weight,
      packageId: parcelId,
      reference: parcelId,
      status: parcelData.status || "Pending",
      recipient: parcelData.recipient || "",
      recipientContact: parcelData.recipientContact || "",
      street: parcelData.street || "",
      barangay: parcelData.barangay || "",
      municipality: parcelData.municipality || "",
      province: parcelData.province || "",
      region: parcelData.region || "",
      dateAdded: parcelData.dateAdded || Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      destination: parcelData.destination || { latitude: null, longitude: null },
    };

    const parcelDocRef = doc(db, "parcels", parcelId);
    await setDoc(parcelDocRef, dataToStore);

    return {
      success: true,
      id: parcelId,
      timestamp: now.getTime(),
      userId: uid,
    };
  } catch (error) {
    console.error("Error adding parcel:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update an existing parcel
 * @param {Object} parcelData - Parcel data to update
 * @param {string} parcelId - Parcel ID
 * @returns {Promise<Object>} Result object with success status
 */
export const updateParcel = async (parcelData, parcelId) => {
  try {
    if (!parcelId) throw new Error("Parcel ID is required to update a parcel");

    const dataToUpdate = {
      reference: parcelId,
      status: parcelData.status,
      recipient: parcelData.recipient,
      contact: parcelData.contact,
      street: parcelData.street,
      region: parcelData.region,
      province: parcelData.province,
      municipality: parcelData.municipality,
      barangay: parcelData.barangay,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    const parcelDocRef = doc(db, "parcels", parcelId);
    await setDoc(parcelDocRef, dataToUpdate, { merge: true });
    return { success: true, id: parcelId };
  } catch (err) {
    console.error("Error updating parcel:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete a parcel
 * @param {string} parcelId - Parcel ID to delete
 * @returns {Promise<Object>} Result object with success status
 */
export const deleteParcel = async (parcelId) => {
  try {
    if (!parcelId) throw new Error("Parcel ID is required to delete a parcel");
    await deleteDoc(doc(db, "parcels", parcelId));
    return { success: true };
  } catch (err) {
    console.error("Error deleting parcel:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Assign a parcel to a driver
 * @param {string} parcelId - Parcel ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<boolean>} Success status
 */
export async function assignParcelToDriver(parcelId, driverId) {
  const parcelRef = doc(db, "parcels", parcelId);
  const driverRef = doc(db, "users", driverId);

  await updateDoc(parcelRef, {
    assignedDriverId: driverId,
    status: "assigned",
    updatedAt: serverTimestamp(),
  });

  await updateDoc(driverRef, {
    parcelsLeft: increment(1),
    updatedAt: serverTimestamp(),
  });

  return true;
}

/**
 * Get a specific parcel by ID
 * @param {string} parcelId - Parcel ID
 * @returns {Promise<Object>} Result object with parcel data
 */
export const getParcel = async (parcelId) => {
  try {
    if (!parcelId) throw new Error("Parcel ID is required to get a parcel");

    const parcelDocRef = doc(db, `parcels/${parcelId}`);
    const parcelDoc = await getDoc(parcelDocRef);

    if (!parcelDoc.exists()) {
      return { success: false, error: "Parcel not found" };
    }

    const parcelData = parcelDoc.data();
    return {
      success: true,
      data: {
        id: parcelId,
        reference: parcelData.reference || "",
        status: parcelData.status || "Pending",
        recipient: parcelData.recipient || "",
        recipientContact: parcelData.recipientContact || "",
        street: parcelData.street || "",
        barangay: parcelData.barangay || "",
        municipality: parcelData.municipality || "",
        province: parcelData.province || "",
        region: parcelData.region || "",
        dateAdded: parcelData.dateAdded?.toDate() || new Date(),
        userId: parcelData.uid || "",
      },
    };
  } catch (error) {
    console.error("Error getting parcel:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// DRIVER SERVICES
// ============================================================================

/**
 * Remove a driver from their branch
 * @param {string} driverId - Driver's user ID
 * @returns {Promise<Object>} Result object with success status
 */
export const removeDriverFromBranch = async (driverId) => {
  try {
    if (!driverId) {
      throw new Error("Driver ID is required");
    }

    const driverRef = doc(db, "users", driverId);
    await updateDoc(driverRef, {
      branchId: "",
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: "Driver removed from branch successfully" };
  } catch (error) {
    console.error("Error removing driver from branch:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch driver status statistics
 * @param {string} branchId - Branch ID to filter drivers
 * @returns {Promise<Object>} Object with driver status counts
 */
export const fetchDriverStatusData = async (branchId) => {
  try {
    if (!branchId) {
      console.error("Branch ID is required.");
      return { available: 0, onTrip: 0, offline: 0 };
    }
    console.log("Fetching drivers for branch:", branchId);
    const driversRef = collection(db, "users");
    const driverDoc = query(
      driversRef,
      where("role", "==", "driver"),
      where("branchId", "==", branchId)
    );

    const driversSnapshot = await getDocs(driverDoc);

    let available = 0;
    let onTrip = 0;
    let offline = 0;

    driversSnapshot.forEach((doc) => {
      const driver = doc.data();
      switch (driver.status?.toLowerCase()) {
        case "available":
          available++;
          break;
        case "delivering":
          onTrip++;
          break;
        case "offline":
        default:
          offline++;
          break;
      }
    });

    return { available, onTrip, offline };
  } catch (error) {
    console.error("Error fetching driver status data:", error);
    return { available: 0, onTrip: 0, offline: 0 };
  }
};

// ============================================================================
// ANALYTICS SERVICES
// ============================================================================

/**
 * Fetch delivery volume data for a given period
 * @param {string} period - "daily" or "weekly"
 * @param {string} uid - User ID
 * @returns {Promise<Array>} Array of delivery volume data
 */
export const fetchDeliveryVolumeData = async (period = "daily", uid) => {
  try {
    const parcelsRef = collection(db, "parcels");
    const q = query(
      parcelsRef,
      where("status", "in", ["Delivered", "Cancelled"]),
      where("uid", "==", uid)
    );

    const parcelsSnapshot = await getDocs(q);
    const deliveryData = {};

    parcelsSnapshot.forEach((docSnap) => {
      const parcel = docSnap.data();

      const ts =
        parcel.DeliveredAt?.toDate?.() ??
        parcel.CancelledAt?.toDate?.() ??
        parcel.createdAt?.toDate?.();

      if (!ts || isNaN(ts.getTime?.())) return;
      const date = new Date(ts);

      const dateKey =
        period === "daily"
          ? date.toISOString().split("T")[0]
          : `Week ${getWeekNumber(date)}`;

      if (!deliveryData[dateKey]) {
        deliveryData[dateKey] = {
          date: dateKey,
          deliveries: 0,
          cancelled: 0,
        };
      }

      if (parcel.status === "Delivered") {
        deliveryData[dateKey].deliveries++;
      } else if (parcel.status === "Cancelled") {
        deliveryData[dateKey].cancelled++;
      }
    });

    const result = Object.values(deliveryData).map((item) => {
      const total = item.deliveries + item.cancelled;
      const successRate = total
        ? ((item.deliveries / total) * 100).toFixed(2)
        : 0;

      return { ...item, total, successRate };
    });

    return result.sort((a, b) =>
      a.date.localeCompare(b.date, undefined, { numeric: true })
    );
  } catch (error) {
    console.error("Error fetching delivery volume data:", error);
    return [];
  }
};

/**
 * Fetch overspeeding incidents data for a given period
 * @param {string} period - "daily" or "weekly"
 * @param {string} branchId - Branch ID to filter incidents
 * @returns {Promise<Array>} Array of overspeeding data
 */
export const fetchOverspeedingData = async (period = "daily", branchId) => {
  try {
    if (!branchId) {
      console.error("Branch ID is required.");
      return [];
    }

    const incidentsRef = collection(db, "users");
    const q = query(incidentsRef, where("branchId", "==", branchId));

    const incidentsSnapshot = await getDocs(q);
    const violationData = {};

    incidentsSnapshot.forEach((doc) => {
      const user = doc.data();
      const violations = user.violations;

      if (!Array.isArray(violations)) return;

      violations.forEach((violation) => {
        const date = new Date(
          violation.issuedAt?.toDate?.() || violation.issuedAt
        );
        if (!date || isNaN(date.getTime())) return;

        const dateKey =
          period === "daily"
            ? date.toISOString().split("T")[0]
            : `Week ${getWeekNumber(date)}`;

        if (!violationData[dateKey]) {
          violationData[dateKey] = {
            date: dateKey,
            count: 0,
            topSpeed: 0,
          };
        }

        violationData[dateKey].count++;

        if (typeof violation.topSpeed === "number") {
          violationData[dateKey].topSpeed = Math.max(
            violationData[dateKey].topSpeed,
            violation.topSpeed
          );
        }
      });
    });

    const result = Object.values(violationData).map((item) => ({
      date: item.date,
      violations: item.count,
      topSpeed: item.topSpeed,
    }));

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching violations data:", error);
    return [];
  }
};

/**
 * Fetch recent violation incidents
 * @param {number} limitCount - Number of recent incidents to fetch
 * @param {string} branchId - Branch ID to filter incidents
 * @returns {Promise<Array>} Array of recent violations
 */
export const fetchRecentIncidents = async (limitCount = 5, branchId) => {
  try {
    if (!branchId) {
      console.error("Branch ID is required.");
      return [];
    }
    const usersRef = collection(db, "users");
    const usersQuery = query(
      usersRef,
      where("role", "==", "driver"),
      where("branchId", "==", branchId)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const violations = [];
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const driverViolations = userData.violations || [];

      driverViolations.forEach((violation) => {
        // Only include actual overspeeding violations
        const topSpeed = violation.topSpeed || 0;
        // Use zoneLimit if available, otherwise use defaultLimit, fallback to 40
        const speedLimit = violation.zoneLimit || violation.defaultLimit || 40;
        
        // Only add if actually overspeeding (matching mobile app logic)
        if (topSpeed > speedLimit) {
          violations.push({
            id: `${userDoc.id}_${violation.timestamp || Date.now()}`,
            date: violation.issuedAt
              ? violation.issuedAt.toDate
                ? violation.issuedAt.toDate().toLocaleString()
                : new Date(violation.issuedAt).toLocaleString()
              : "Unknown",
            location: violation.driverLocation
              ? `${violation.driverLocation.latitude}, ${violation.driverLocation.longitude}`
              : "Unknown location",
            driverName: userData.fullName || "Unknown driver",
            message: violation.message || "No message",
            topSpeed: topSpeed,
            avgSpeed: violation.avgSpeed || 0,
            speedLimit: speedLimit,
            zoneCategory: violation.zoneCategory || "Default",
          });
        }
      });
    });
    return violations
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching recent violations:", error);
    return [];
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate week number of a date
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
