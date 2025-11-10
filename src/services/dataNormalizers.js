// Normalizers to provide a consistent shape for drivers/parcels across the UI
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
