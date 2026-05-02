// Central API base URL for all frontend requests.
// In development, defaults to the local Django backend on port 8000.
// In production, set NEXT_PUBLIC_API_URL to your deployed backend origin,
// e.g. https://your-backend.example.com (NO trailing /api).
//
// To be defensive, we strip any accidental trailing slash or `/api`
// segment so both of these work:
// - https://smart-land-management-system-beta.onrender.com
// - https://smart-land-management-system-beta.onrender.com/api
const rawBase =
  process.env.NEXT_PUBLIC_API_URL || "https://smart-land-management-system-beta.onrender.com";

export const API_BASE_URL = rawBase
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

