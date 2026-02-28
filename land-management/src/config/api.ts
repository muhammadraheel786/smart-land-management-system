// Central API base URL for all frontend requests.
// In development, defaults to the local Django backend on port 8000.
// In production, set NEXT_PUBLIC_API_URL to your deployed backend origin,
// e.g. https://your-backend.example.com
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

