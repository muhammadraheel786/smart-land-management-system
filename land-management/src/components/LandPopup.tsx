"use client";

import { Popup } from "react-leaflet";
import { GeoFence, LandStatus } from "@/types";
import { statusColors, statusGradients, statusBorderColors } from "@/lib/map-styles";
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Droplets, 
  Sun, 
  DollarSign,
  Wheat,
  TreePine,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface LandPopupProps {
  field: GeoFence;
  onEdit?: (field: GeoFence) => void;
  onDelete?: (fieldId: string) => void;
  /** Live temperature from weather API (satellite monitor) */
  liveTempC?: number;
}

const statusIcons: Record<LandStatus, React.ReactNode> = {
  cultivated: <Wheat className="w-4 h-4" />,
  available: <TreePine className="w-4 h-4" />,
  uncultivated: <AlertCircle className="w-4 h-4" />,
  not_usable: <AlertCircle className="w-4 h-4" />,
  thaka: <CheckCircle className="w-4 h-4" />,
};

const statusDescriptions: Record<LandStatus, string> = {
  cultivated: "Active farmland with crops",
  available: "Ready for cultivation",
  uncultivated: "Bare earth, no current activity",
  not_usable: "Unsuitable for farming",
  thaka: "Leased to tenant",
};

export default function LandPopup({ field, onEdit, onDelete, liveTempC }: LandPopupProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: LandStatus) => {
    return statusColors[status];
  };

  return (
    <div className="min-w-[280px] max-w-[320px] bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Header with gradient background */}
      <div 
        className="p-4 text-white relative"
        style={{ 
          background: statusGradients[field.status],
          borderBottom: `3px solid ${statusBorderColors[field.status]}`
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              {statusIcons[field.status]}
              {field.name}
            </h3>
            <p className="text-sm opacity-90">{statusDescriptions[field.status]}</p>
          </div>
          <div 
            className="w-12 h-12 rounded-full border-2 border-white/50 flex items-center justify-center"
            style={{ backgroundColor: `${getStatusColor(field.status)}33` }}
          >
            <MapPin className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Area Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Total Area</span>
          </div>
          <span className="font-bold text-lg text-gray-900">
            {field.area ? `${field.area.toFixed(2)} acres` : 'N/A'}
          </span>
        </div>

        {/* Location Information */}
        {field.locationName && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-sm text-gray-600">{field.locationName}</p>
              {field.address && (
                <p className="text-xs text-gray-500 mt-1">{field.address}</p>
              )}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold text-white border-2"
            style={{ 
              backgroundColor: getStatusColor(field.status),
              borderColor: statusBorderColors[field.status]
            }}
          >
            {field.status.toUpperCase()}
          </span>
          {field.notUsableReason && (
            <span className="text-xs text-gray-500 italic">
              {field.notUsableReason}
            </span>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>Created: {formatDate(field.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>Updated: {formatDate(field.updatedAt)}</span>
          </div>
        </div>

        {/* Quick Stats / Live temp */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          {liveTempC != null && (
            <div className="col-span-3 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
              <Sun className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-700">Live temp</span>
              <span className="font-bold text-orange-600">{liveTempC.toFixed(1)} °C</span>
            </div>
          )}
          <div className="text-center">
            <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Water</p>
            <p className="text-xs font-semibold">Good</p>
          </div>
          <div className="text-center">
            <Sun className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Sunlight</p>
            <p className="text-xs font-semibold">Optimal</p>
          </div>
          <div className="text-center">
            <DollarSign className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">Value</p>
            <p className="text-xs font-semibold">High</p>
          </div>
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t">
            {onEdit && (
              <button
                onClick={() => onEdit(field)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(field.id)}
                className="flex-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
