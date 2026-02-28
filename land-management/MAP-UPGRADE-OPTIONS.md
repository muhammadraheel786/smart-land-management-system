# Land Map — Upgrade options for better experience

The Land Map works with **free** services (OpenStreetMap Nominatim for search, Esri/OSM for tiles). For higher accuracy, better satellite imagery, and fewer limits, you can add paid providers.

## What you get today (free)

- **Search**: Address/place search via Nominatim (rate-limited, ~1 req/sec).
- **My location**: Browser GPS.
- **Coordinates**: Paste lat,lng (single point + area, or polygon).
- **Draw**: Polygon or rectangle on the map; area calculated automatically.
- **Tiles**: Esri World Imagery (satellite), OpenStreetMap (street).

## Paid options (optional)

### 1. **Mapbox** (recommended for balance of cost and quality)

- **Use for**: Geocoding (search), vector/satellite tiles, better mobile performance.
- **Pricing**: Free tier (50k geocodes/month, 50k map loads). Paid after that.
- **Add**: Create account at [mapbox.com](https://www.mapbox.com), get access token. We can wire `MAPBOX_ACCESS_TOKEN` into the app and switch geocoding + optional tiles to Mapbox.

### 2. **Google Maps Platform**

- **Use for**: Best geocoding accuracy, Street View, high-quality satellite.
- **Pricing**: Pay-as-you-go; free monthly credit. Requires billing account.
- **Add**: Enable Maps JavaScript API + Geocoding API, create API key. We can add a “Google” layer and use Google for search when key is present.

### 3. **HERE**

- **Use for**: Geocoding and routing; good international coverage.
- **Pricing**: Free tier available; then paid.
- **Add**: HERE API key for geocoding and optional base maps.

## What we can do once you have a key

1. **Geocoding**: Prefer Mapbox/Google/HERE over Nominatim when a key is set (more accurate, fewer “location not found” issues).
2. **Satellite/imagery**: Option to use Mapbox or Google satellite when configured.
3. **Fallback**: If the paid service fails or has no key, the app continues to use the current free stack.

If you decide to buy and add a key, tell me which provider (Mapbox, Google, or HERE) and we can wire it in next.
