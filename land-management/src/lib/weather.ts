/**
 * Live weather by location (Open-Meteo, no API key).
 * Production: cache by lat,lng to avoid excessive requests.
 */

const CACHE_MINUTES = 10;
const cache = new Map<string, { data: LiveWeatherResult; fetchedAt: number }>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export interface LiveWeatherResult {
  temperatureC: number;
  minTempC?: number;
  maxTempC?: number;
  relativeHumidity?: number;
  updatedAt: string; // ISO
  source: string;
  error?: string;
}

interface OpenMeteoCurrent {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  time?: string;
}

interface OpenMeteoDaily {
  temperature_2m_min?: number[];
  temperature_2m_max?: number[];
  time?: string[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

/** Fetch live weather for a location. Uses in-memory cache for CACHE_MINUTES. */
export async function fetchLiveWeather(
  lat: number,
  lng: number
): Promise<LiveWeatherResult> {
  const key = cacheKey(lat, lng);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < CACHE_MINUTES * 60 * 1000) {
    return cached.data;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m");
  url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max");
  url.searchParams.set("timezone", "auto");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const err: LiveWeatherResult = {
        temperatureC: 0,
        updatedAt: new Date().toISOString(),
        source: "Open-Meteo",
        error: `Weather service error: ${res.status}`,
      };
      return err;
    }
    const data: OpenMeteoResponse = await res.json();
    const current = data.current;
    const daily = data.daily;
    const temperatureC = current?.temperature_2m ?? 0;
    const minTempC = daily?.temperature_2m_min?.[0];
    const maxTempC = daily?.temperature_2m_max?.[0];
    const updatedAt = current?.time
      ? new Date(current.time).toISOString()
      : new Date().toISOString();

    const result: LiveWeatherResult = {
      temperatureC,
      minTempC,
      maxTempC,
      relativeHumidity: current?.relative_humidity_2m,
      updatedAt,
      source: "Open-Meteo",
    };
    cache.set(key, { data: result, fetchedAt: now });
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const err: LiveWeatherResult = {
      temperatureC: 0,
      updatedAt: new Date().toISOString(),
      source: "Open-Meteo",
      error: message,
    };
    return err;
  }
}

/** Clear cache (e.g. when user clicks "Refresh all"). */
export function clearWeatherCache(): void {
  cache.clear();
}
