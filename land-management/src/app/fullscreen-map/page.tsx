"use client";

import dynamic from "next/dynamic";

const LandMapUnified = dynamic(() => import("@/components/LandMapUnified"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-2xl bg-green-500/20 p-4">
            <div className="h-12 w-12 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-lg font-medium text-white">Loading map…</p>
        <p className="mt-1 text-sm text-gray-400">Land map & field boundaries</p>
      </div>
    </div>
  ),
});

export default function FullScreenMapPage() {
  return <LandMapUnified />;
}
