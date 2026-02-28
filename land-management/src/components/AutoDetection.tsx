"use client";

import { useState, useCallback } from "react";
import { useMapEvents, Polygon, Circle } from "react-leaflet";
import { autoLandDetection, DetectedLandParcel } from "@/lib/auto-detection";
import { useLandStore } from "@/lib/store";
import type { LandStatus } from "@/types";
import { statusColors, statusBorderColors } from "@/lib/map-styles";
import { 
  Radar, 
  MapPin, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Sparkles
} from "lucide-react";

interface AutoDetectionProps {
  onDetectionComplete?: (parcels: DetectedLandParcel[]) => void;
  onCancel?: () => void;
}

interface DetectionResult {
  parcel: DetectedLandParcel;
  quality: Awaited<ReturnType<typeof autoLandDetection.analyzeLandQuality>>;
}

function AutoClickDetector({ onDetect, onCancel }: { 
  onDetect: (lat: number, lng: number) => void;
  onCancel: () => void;
}) {
  const [isDetecting, setIsDetecting] = useState(false);

  useMapEvents({
    async click(e) {
      if (isDetecting) return;
      
      setIsDetecting(true);
      const { lat, lng } = e.latlng;
      
      // Show detection animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onDetect(lat, lng);
      setIsDetecting(false);
    },
  });

  return (
    <>
      {isDetecting && (
        <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="bg-black/80 text-white px-6 py-4 rounded-xl flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Detecting land area...</span>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="leaflet-top leaflet-left" style={{ marginTop: '80px' }}>
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 m-3 max-w-xs border border-blue-200">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-700">
            <Radar className="w-4 h-4" />
            Auto-Detection Mode
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 text-blue-500" />
              <span>Click anywhere on the map to automatically detect land boundaries</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 mt-0.5 text-purple-500" />
              <span>AI will identify parcel boundaries and calculate area</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="w-3 h-3 mt-0.5 text-yellow-500" />
              <span>Detection takes 1-2 seconds</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-full mt-3 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            Cancel Detection
          </button>
        </div>
      </div>
    </>
  );
}

function DetectedParcelOverlay({ 
  result, 
  onAccept, 
  onReject 
}: { 
  result: DetectionResult;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { parcel, quality } = result;
  
  const getLandStatus = (landType: DetectedLandParcel['landType']): LandStatus => {
    switch (landType) {
      case 'cultivated': return 'cultivated';
      case 'fallow': return 'available';
      case 'barren': return 'uncultivated';
      case 'forest': return 'not_usable';
      case 'water': return 'not_usable';
      default: return 'available';
    }
  };

  const statusColor = statusColors[getLandStatus(parcel.landType)];
  const borderColor = statusBorderColors[getLandStatus(parcel.landType)];

  return (
    <>
      {/* Detected parcel overlay */}
      <Polygon
        positions={parcel.coordinates.map(c => [c.lat, c.lng] as [number, number])}
        pathOptions={{
          color: borderColor,
          fillColor: statusColor,
          fillOpacity: 0.4,
          weight: 3,
          dashArray: "8, 4",
        }}
      />
      
      {/* Center marker */}
      <Circle
        center={parcel.centroid}
        radius={15}
        pathOptions={{
          fillColor: "#10B981",
          color: "#FFFFFF",
          weight: 3,
          fillOpacity: 0.8,
        }}
      />

      {/* Detection result panel */}
      <div className="leaflet-bottom leaflet-right">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-4 m-3 max-w-sm border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-green-700">Land Detected!</h4>
          </div>
          
          <div className="space-y-3">
            {/* Parcel Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Area:</span>
                  <span className="ml-2 font-semibold">{parcel.area.toFixed(2)} acres</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-semibold capitalize">{parcel.landType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span>
                  <span className="ml-2 font-semibold">{(parcel.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Quality:</span>
                  <span className={`ml-2 font-semibold ${
                    quality.suitability > 0.8 ? 'text-green-600' : 
                    quality.suitability > 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(quality.suitability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Indicators */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-gray-700">Land Quality</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-1">
                    <div 
                      className="h-1 bg-blue-500 rounded-full" 
                      style={{ width: `${quality.soilQuality * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600">Soil</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-1">
                    <div 
                      className="h-1 bg-cyan-500 rounded-full" 
                      style={{ width: `${quality.waterAccess * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600">Water</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-1">
                    <div 
                      className="h-1 bg-yellow-500 rounded-full" 
                      style={{ width: `${quality.sunlight * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-600">Sun</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {quality.recommendations.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-gray-700">Recommendations</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {quality.recommendations.slice(0, 2).map((rec, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <button
                onClick={onAccept}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Accept & Save
              </button>
              <button
                onClick={onReject}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AutoDetection({ onDetectionComplete, onCancel }: AutoDetectionProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const { addField } = useLandStore();

  const handleDetect = useCallback(async (lat: number, lng: number) => {
    setIsDetecting(true);
    
    try {
      // Detect land parcel
      const parcel = await autoLandDetection.quickDetect(lat, lng);
      
      if (!parcel) {
        setIsDetecting(false);
        return;
      }

      // Analyze land quality
      const quality = await autoLandDetection.analyzeLandQuality(parcel);
      
      setDetectionResult({ parcel, quality });
    } catch (error) {
      console.error('Detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const handleAccept = useCallback(async () => {
    if (!detectionResult) return;

    const getLandStatus = (landType: DetectedLandParcel['landType']): LandStatus => {
      switch (landType) {
        case 'cultivated': return 'cultivated';
        case 'fallow': return 'available';
        case 'barren': return 'uncultivated';
        case 'forest': return 'not_usable';
        case 'water': return 'not_usable';
        default: return 'available';
      }
    };

    const success = await addField({
      name: `Auto-detected Field ${new Date().toLocaleTimeString()}`,
      coordinates: detectionResult.parcel.coordinates,
      area: detectionResult.parcel.area,
      status: getLandStatus(detectionResult.parcel.landType),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (success) {
      onDetectionComplete?.([detectionResult.parcel]);
      setDetectionResult(null);
    }
  }, [detectionResult, addField, onDetectionComplete]);

  const handleReject = useCallback(() => {
    setDetectionResult(null);
  }, []);

  if (detectionResult) {
    return (
      <DetectedParcelOverlay
        result={detectionResult}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );
  }

  return <AutoClickDetector onDetect={handleDetect} onCancel={onCancel || (() => {})} />;
}
