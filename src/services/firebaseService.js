import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ======================== FETCH ALL PARCELS ========================
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
      });
    }

    return parcels;
  } catch (error) {
    console.error("Error fetching parcels:", error);
    return [];
  }
};

// ======================== PARCEL STATUS DATA ========================
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

// ======================== ADD PARCEL ========================
export const addParcel = async (parcelData, uid) => {
  try {
    if (!uid) throw new Error("User ID (uid) is required to add a parcel");

    const now = new Date();
    const parcelId =
      parcelData.id ||
      `PKG${Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0")}`;

    const dataToStore = {
      uid,
      packageId: parcelId,
      reference: parcelData.reference || "",
      status: parcelData.status || "Pending",

      // Recipient details only
      recipient: parcelData.recipient || "",
      recipientContact: parcelData.recipientContact || "",
      street: parcelData.street || "",
      barangay: parcelData.barangay || "",
      municipality: parcelData.municipality || "",
      province: parcelData.province || "",
      region: parcelData.region || "",

      // Metadata
      dateAdded: parcelData.dateAdded || Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      destination: parcelData.destination || "",
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

// ======================== UPDATE PARCEL ========================
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

// ======================== DELETE PARCEL ========================
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

// ======================== ASSIGN PARCEL TO DRIVER ========================
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

// ======================== GET PARCEL ========================
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

// ======================== DRIVER STATUS DATA ========================
export const fetchDriverStatusData = async () => {
  try {
    const driversRef = collection(db, "drivers");
    const driversSnapshot = await getDocs(driversRef);

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

// ======================== DELIVERY VOLUME DATA ========================
export const fetchDeliveryVolumeData = async (period = "daily") => {
  try {
    const deliveriesRef = collection(db, "deliveries");
    const deliveriesSnapshot = await getDocs(deliveriesRef);
    const deliveryData = {};

    deliveriesSnapshot.forEach((doc) => {
      const delivery = doc.data();
      const date = new Date(delivery.date?.toDate() || delivery.date);
      if (!date || isNaN(date.getTime())) return;

      let dateKey =
        period === "daily"
          ? date.toISOString().split("T")[0]
          : `Week ${getWeekNumber(date)}`;

      if (!deliveryData[dateKey]) {
        deliveryData[dateKey] = {
          date: dateKey,
          deliveries: 0,
          failedOrReturned: 0,
        };
      }

      deliveryData[dateKey].deliveries++;
      if (delivery.status === "failed" || delivery.status === "returned") {
        deliveryData[dateKey].failedOrReturned++;
      }
    });

    const result = Object.values(deliveryData).map((item) => {
      const successRate =
        ((item.deliveries - item.failedOrReturned) / item.deliveries) * 100;
      return {
        ...item,
        successRate: isNaN(successRate) ? 0 : successRate.toFixed(2),
      };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching delivery volume data:", error);
    return [];
  }
};

// ======================== OVERSPEEDING DATA ========================
export const fetchOverspeedingData = async (period = "daily") => {
  try {
    const incidentsRef = collection(db, "speedingIncidents");
    const incidentsSnapshot = await getDocs(incidentsRef);

    const incidentData = {};

    incidentsSnapshot.forEach((doc) => {
      const incident = doc.data();
      const date = new Date(incident.timestamp?.toDate() || incident.timestamp);
      if (!date || isNaN(date.getTime())) return;

      let dateKey =
        period === "daily"
          ? date.toISOString().split("T")[0]
          : `Week ${getWeekNumber(date)}`;

      if (!incidentData[dateKey]) {
        incidentData[dateKey] = {
          date: dateKey,
          incidents: 0,
          totalSpeed: 0,
          speedReadings: 0,
        };
      }

      incidentData[dateKey].incidents++;

      if (incident.speed) {
        incidentData[dateKey].totalSpeed += incident.speed;
        incidentData[dateKey].speedReadings++;
      }
    });

    const result = Object.values(incidentData).map((item) => {
      const avgSpeed =
        item.speedReadings > 0 ? item.totalSpeed / item.speedReadings : 0;
      return {
        date: item.date,
        incidents: item.incidents,
        avgSpeed: Math.round(avgSpeed),
      };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching overspeeding data:", error);
    return [];
  }
};

// ======================== RECENT INCIDENTS ========================
export const fetchRecentIncidents = async (limitCount = 5) => {
  try {
    const incidentsRef = collection(db, "users");
    const q = query(incidentsRef, orderBy("timestamp", "desc"), limit(limitCount));
    const incidentsSnapshot = await getDocs(q);

    const incidents = [];
    incidentsSnapshot.forEach((doc) => {
      const incident = doc.data();
      incidents.push({
        id: doc.id,
        date: incident.timestamp?.toDate().toLocaleDateString() || "Unknown",
        location: incident.location || "Unknown location",
        driverName: incident.driverName || "Unknown driver",
        speed: incident.speed || 0,
      });
    });

    return incidents;
  } catch (error) {
    console.error("Error fetching recent incidents:", error);
    return [];
  }
};

// ======================== UTIL: WEEK NUMBER ========================
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
