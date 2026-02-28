/** Generate rectangular coordinates from center point and area in acres */
export function rectFromCenterAndArea(
  centerLat: number,
  centerLng: number,
  acres: number
): { lat: number; lng: number }[] {
  // 1 acre ≈ 4047 m², rough: 63.6m x 63.6m for 1 acre
  const sideM = Math.sqrt(acres * 4046.86);
  const degLat = sideM / 111320; // meters to degrees latitude
  const degLng = sideM / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const halfLat = degLat / 2;
  const halfLng = degLng / 2;
  return [
    { lat: centerLat + halfLat, lng: centerLng - halfLng },
    { lat: centerLat + halfLat, lng: centerLng + halfLng },
    { lat: centerLat - halfLat, lng: centerLng + halfLng },
    { lat: centerLat - halfLat, lng: centerLng - halfLng },
  ];
}

/** Approximate area in acres from polygon coordinates (uses centroid latitude for accuracy). */
export function getArea(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i].lat * coords[j].lng - coords[j].lat * coords[i].lng;
  }
  const centerLat = coords.reduce((s, c) => s + c.lat, 0) / n;
  const m2PerDegLat = 111319.9;
  const m2PerDegLng = 111319.9 * Math.cos((centerLat * Math.PI) / 180);
  const areaM2 = Math.abs(area / 2) * m2PerDegLat * m2PerDegLng;
  return areaM2 / 4046.86;
}
