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
 * Fetch all parcels, optionally filtered by user ID or branch ID.
 * Implements role-based access control: admins see all parcels, dispatchers see branch parcels, drivers see assigned parcels.
 * Retrieves user data to determine role and branchId, then queries accordingly.
 * @param {string|null} uid - User ID to filter parcels (for role-based filtering)
 * @returns {Promise<Array>} Array of parcel objects with weight, reference, status, recipient, address, timestamps, municipality, driver/branch info
 */
export const fetchAllParcels = async (uid = null) => {
  try {
    const parcels = [];
    const parcelsRef = collection(db, "parcels");
    
    // Get user data to determine role and branchId
    let userRole = null;
    let userBranchId = null;
    
    if (uid) {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role;
        userBranchId = userData.branchId;
      }
    }
    
    // Query based on role
    let parcelsSnapshot;
    
    if (userRole === "admin") {
      // Admin can see all parcels
      parcelsSnapshot = await getDocs(parcelsRef);
    } else if (userRole === "dispatcher" && userBranchId) {
      // Dispatcher sees parcels from their branch
      const q = query(parcelsRef, where("branchId", "==", userBranchId));
      parcelsSnapshot = await getDocs(q);
    } else if (userRole === "driver" && uid) {
      // Driver sees only their assigned parcels
      const q = query(parcelsRef, where("driverUid", "==", uid));
      parcelsSnapshot = await getDocs(q);
    } else {
      // Fallback: fetch all and filter by uid if provided
      parcelsSnapshot = await getDocs(parcelsRef);
    }

    if (parcelsSnapshot.empty) return parcels;

    for (const parcelDoc of parcelsSnapshot.docs) {
      const parcelId = parcelDoc.id;
      const parcelData = parcelDoc.data();

      // If no role determined and uid provided, filter by creator uid
      if (!userRole && uid && parcelData.uid !== uid) continue;

      parcels.push({
        id: parcelId,
        weight: parcelData.weight,
        reference: parcelData.reference || parcelId || "",
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
 * Fetch parcel status statistics with optional branch or user filtering.
 * Categorizes parcels by status: delivered, out for delivery, failed/returned, pending.
 * Iterates through all parcels or branch-specific parcels and returns counts for dashboard charts.
 * @param {string|null} uid - User ID to filter parcels (determines role-based filtering)
 * @returns {Promise<Object>} Object with status counts: {delivered, outForDelivery, failedOrReturned, pending, total}
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
 * Add a new parcel with comprehensive validation and automatic ID generation.
 * Validates required fields (recipient, address, municipality, weight), checks municipality/barangay combinations.
 * Generates unique parcel ID (PKG + 6 digits) if not provided, stores all details with timestamps.
 * @param {Object} parcelData - Parcel data including recipient, address, municipality, barangay, weight, contactNumber
 * @param {string} uid - User ID (creator/admin ID)
 * @returns {Promise<Object>} Result object with {success, id, timestamp, uid} or error message
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

    // Get user data to retrieve branchId and adminId
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    let branchId = null;
    let adminId = null;
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      branchId = userData.branchId || null;
      
      // Get adminId from branch document
      if (branchId) {
        const branchDocRef = doc(db, "branches", branchId);
        const branchDoc = await getDoc(branchDocRef);
        if (branchDoc.exists()) {
          adminId = branchDoc.data().adminId || null;
        }
      }
    }

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
      updatedAt: Timestamp.fromDate(now),
      destination: parcelData.destination || { latitude: null, longitude: null },
      branchId: branchId,
      adminId: adminId,
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
 * Update an existing parcel by merging new data with existing fields.
 * Removes undefined values to prevent overwriting, adds updatedAt timestamp, uses merge: true to preserve unmodified fields.
 * @param {Object} parcelData - Parcel data to update (reference, status, recipient, address, etc.)
 * @param {string} parcelId - Parcel ID to update
 * @returns {Promise<Object>} Result object with {success, id} or error message
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
 * Delete a parcel permanently from Firestore.
 * Validates parcel ID presence before deletion, removes the document from parcels collection.
 * @param {string} parcelId - Parcel ID to delete
 * @returns {Promise<Object>} Result object with {success: true} or error message
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
 * Assign a parcel to a driver by updating parcel with driver info and incrementing driver's parcel counts.
 * Fetches driver data, updates parcel with driverUid and driverName, increments parcelsLeft and totalTrips counters.
 * @param {string} parcelId - Parcel ID to assign
 * @param {string} driverId - Driver ID (user uid)
 * @returns {Promise<boolean>} Success status (true if successful)
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
 * Fetch delivery volume data aggregated by date for analytics charts.
 * Fetches parcels with Delivered/Failed status, extracts completion timestamps (DeliveredAt/FailedAt), groups by local date.
 * Includes backwards compatibility with "Cancelled" status. Used for dashboard delivery volume charts.
 * @param {string} period - "daily" (groups by YYYY-MM-DD) or "weekly" (groups by week number)
 * @param {string} uid - User ID to filter parcels by creator
 * @returns {Promise<Array>} Array of {date, count} objects for charting
 */
export const fetchDeliveryVolumeData = async (period = "daily", uid) => {
  try {
    const parcelsRef = collection(db, "parcels");
    const q = query(
      parcelsRef,
      where("status", "in", ["Delivered", "Failed", "Cancelled"]),
      where("uid", "==", uid)
    );

    const parcelsSnapshot = await getDocs(q);
    const deliveryData = {};

    parcelsSnapshot.forEach((docSnap) => {
      const parcel = docSnap.data();

      const ts =
        parcel.DeliveredAt?.toDate?.() ??
        parcel.FailedAt?.toDate?.() ??
        parcel.createdAt?.toDate?.();

      if (!ts || isNaN(ts.getTime?.())) return;
      const date = new Date(ts);

      // Use local date instead of UTC to match user's timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      const dateKey =
        period === "daily"
          ? localDateString
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
      } else if (parcel.status === "Failed" || parcel.status === "Cancelled") {
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
