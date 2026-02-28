/**
 * Mapbox configuration for high-quality map tiles.
 * Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local for best experience.
 * Free tier: 50,000 map loads per month
 * Get token at: https://account.mapbox.com/access-tokens/
 */
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/**
 * Get Mapbox tile URL with high-resolution support (up to zoom level 22)
 * @param style - Map style: satellite, satellite-streets, or streets
 * @returns Tile URL with access token
 */
export function getMapboxTileUrl(style: "satellite" | "satellite-streets" | "streets"): string {
  if (!MAPBOX_TOKEN) return "";
  const styleId =
    style === "satellite"
      ? "mapbox/satellite-v9"
      : style === "satellite-streets"
        ? "mapbox/satellite-streets-v12"
        : "mapbox/streets-v12";
  // Use 512px tiles for better quality at high zoom levels
  return `https://api.mapbox.com/styles/v1/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Mapbox geocoding API
 * @param query - Search query (address, place name, etc.)
 * @returns Geocoding API URL
 */
export function getMapboxGeocodingUrl(query: string): string {
  if (!MAPBOX_TOKEN) return "";
  const encoded = encodeURIComponent(query);
  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}`;
}

