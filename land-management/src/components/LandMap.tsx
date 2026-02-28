"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const ProfessionalGeofence = dynamic(() => import("./ProfessionalGeofence"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          TerraFence Pro
        </div>
        <p className="text-gray-600 mb-4">Advanced Land Management System</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Loading professional interface...</span>
        </div>
      </div>
    </div>
  ),
});

export default function LandMap() {
  return (
    <div className="w-full h-screen">
      <ProfessionalGeofence />
    </div>
  );
}
