/**
 * Geocoding and geometry helpers for satellite-based field mapping.
 * Uses OpenStreetMap Nominatim (no API key required).
 */

export interface DetailedAddress {
  displayName: string;
  humanAddress: string;
  road?: string;
  suburb?: string;
  city?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_HEADERS = {
  "Accept-Language": "en",
  "User-Agent": "SmartLandFarm/1.0 (Land Management App)",
};

function parseDetailedAddress(data: any): DetailedAddress {
  const addr = data.address || {};
  let humanAddress = "";

  // Specific priority for Pakistani locations or general villages
  const place = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || addr.road || addr.place;
  const city = addr.city || addr.town || addr.district || addr.county;

  if (place && city) {
    humanAddress = `${place}, ${city}`;
  } else if (place) {
    humanAddress = place;
  } else if (city) {
    humanAddress = city;
  } else {
    // Fallback to the first part of the display name
    humanAddress = data.display_name.split(',')[0];
  }

  return {
    displayName: data.display_name,
    humanAddress: humanAddress,
    road: addr.road,
    suburb: addr.suburb,
    city: addr.city || addr.town || addr.municipality,
    village: addr.village || addr.hamlet,
    state: addr.state,
    postcode: addr.postcode,
    country: addr.country,
  };
}

/** Geocode a location string to coordinates (Nominatim). */
export async function geocodeLocation(query: string): Promise<(GeoResult & { detailedAddress: DetailedAddress }) | null> {
  if (!query.trim()) return null;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name || query,
      detailedAddress: parseDetailedAddress(first),
    };
  } catch {
    return null;
  }
}

/** Reverse geocode: coordinates to address (Nominatim). */
export async function reverseGeocode(lat: number, lng: number): Promise<DetailedAddress | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return parseDetailedAddress(data);
  } catch {
    return null;
  }
}

/** Get user's current position (browser geolocation). */
export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      reject(new Error("Geolocation requires HTTPS. Please use a secure connection."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (err) => {
        if (err.code === 1) reject(new Error("Location permission denied."));
        else if (err.code === 2) reject(new Error("Location unavailable."));
        else if (err.code === 3) reject(new Error("Location timed out."));
        else reject(new Error("Could not get location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

/** Parse coordinate string(s). */
export function parseCoordinates(input: string): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = [];
  const lines = input.trim().split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        out.push({ lat, lng });
      }
    }
  }
  return out;
}

/** Convert acres to approximate square polygon. */
export function polygonFromCenterAndArea(
  centerLat: number,
  centerLng: number,
  areaAcres: number
): { lat: number; lng: number }[] {
  if (areaAcres <= 0) areaAcres = 1;
  const metersPerAcre = 4046.86;
  const areaM2 = areaAcres * metersPerAcre;
  const sideM = Math.sqrt(areaM2);
  const halfSideM = sideM / 2;
  const latRad = (centerLat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);
  const deltaLat = halfSideM / metersPerDegLat;
  const deltaLng = halfSideM / metersPerDegLng;
  return [
    { lat: centerLat - deltaLat, lng: centerLng - deltaLng },
    { lat: centerLat - deltaLat, lng: centerLng + deltaLng },
    { lat: centerLat + deltaLat, lng: centerLng + deltaLng },
    { lat: centerLat + deltaLat, lng: centerLng - deltaLng },
  ];
}

/** Get center of a polygon. */
export function centroid(coords: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (!coords?.length) return null;
  const n = coords.length;
  let lat = 0;
  let lng = 0;
  for (const c of coords) {
    lat += c.lat;
    lng += c.lng;
  }
  return { lat: lat / n, lng: lng / n };
}
