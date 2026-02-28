"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-lg font-medium text-white">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}
