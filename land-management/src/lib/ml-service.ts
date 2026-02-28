// ML Service - uses same-origin /api (proxied to Django)
const API_BASE = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api");

export async function predictCropHealth(fieldId: string, data: { status?: string }) {
  const res = await fetch(`${API_BASE}/predict/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "crop_health", fieldId, data }),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export async function predictYield(fieldId: string, data: { area?: number; historicalYield?: number }) {
  const res = await fetch(`${API_BASE}/predict/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "yield_prediction", fieldId, data }),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}

export async function forecastWater(fieldId: string) {
  const res = await fetch(`${API_BASE}/predict/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "water_forecast", fieldId, data: {} }),
  });
  if (!res.ok) throw new Error("Prediction failed");
  return res.json();
}
