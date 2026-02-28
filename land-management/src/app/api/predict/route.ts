import { NextRequest, NextResponse } from "next/server";

// Proxy ML prediction requests from Next.js to the Django backend.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/predict/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward Authorization header if present (for protected backends).
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    return new NextResponse(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Prediction proxy failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }
}

