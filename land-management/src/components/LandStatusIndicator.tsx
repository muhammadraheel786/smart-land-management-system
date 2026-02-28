"use client";

import { LandStatus } from "@/types";
import { statusColors, statusGradients, statusBorderColors } from "@/lib/map-styles";
import { 
  Wheat, 
  TreePine, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  TrendingUp,
  Droplets,
  Sun
} from "lucide-react";

interface LandStatusIndicatorProps {
  status: LandStatus;
  label?: string;
  size?: "sm" | "md" | "lg";
  showAnimation?: boolean;
  showStats?: boolean;
  compact?: boolean;
}

const statusIcons: Record<LandStatus, React.ReactNode> = {
  cultivated: <Wheat className="w-4 h-4" />,
  available: <TreePine className="w-4 h-4" />,
  uncultivated: <AlertTriangle className="w-4 h-4" />,
  not_usable: <XCircle className="w-4 h-4" />,
  thaka: <CheckCircle className="w-4 h-4" />,
};

const statusLabels: Record<LandStatus, string> = {
  cultivated: "Cultivated",
  available: "Available",
  uncultivated: "Uncultivated",
  not_usable: "Not Usable",
  thaka: "Thaka (Leased)",
};

const statusDescriptions: Record<LandStatus, string> = {
  cultivated: "Active farmland with crops growing",
  available: "Ready for cultivation or planting",
  uncultivated: "Bare earth, no current activity",
  not_usable: "Unsuitable for farming",
  thaka: "Currently leased to tenant",
};

const statusStats: Record<LandStatus, {
  water: 'Low' | 'Medium' | 'High';
  sunlight: 'Low' | 'Medium' | 'High';
  fertility: 'Low' | 'Medium' | 'High';
}> = {
  cultivated: { water: 'High', sunlight: 'High', fertility: 'High' },
  available: { water: 'Medium', sunlight: 'Medium', fertility: 'Medium' },
  uncultivated: { water: 'Low', sunlight: 'Medium', fertility: 'Low' },
  not_usable: { water: 'Low', sunlight: 'Low', fertility: 'Low' },
  thaka: { water: 'Medium', sunlight: 'Medium', fertility: 'Medium' },
};

const getStatColor = (stat: 'Low' | 'Medium' | 'High') => {
  switch (stat) {
    case 'High': return 'text-green-600 bg-green-100';
    case 'Medium': return 'text-yellow-600 bg-yellow-100';
    case 'Low': return 'text-red-600 bg-red-100';
  }
};

const getStatIcon = (statType: 'water' | 'sunlight' | 'fertility') => {
  switch (statType) {
    case 'water': return <Droplets className="w-3 h-3" />;
    case 'sunlight': return <Sun className="w-3 h-3" />;
    case 'fertility': return <TrendingUp className="w-3 h-3" />;
  }
};

export default function LandStatusIndicator({ 
  status, 
  label, 
  size = "md", 
  showAnimation = true,
  showStats = false,
  compact = false
}: LandStatusIndicatorProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const animationClass = showAnimation ? "animate-pulse" : "";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full border border-white/80 ${animationClass}`}
          style={{ backgroundColor: statusColors[status] }}
        />
        <span className="text-xs font-medium text-gray-700">
          {label || statusLabels[status]}
        </span>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Status Badge */}
      <div
        className={`
          inline-flex items-center gap-2 rounded-full border-2 font-medium
          transition-all duration-300 hover:scale-105 hover:shadow-lg
          ${sizeClasses[size]}
          ${animationClass}
        `}
        style={{
          background: statusGradients[status],
          borderColor: statusBorderColors[status],
          color: 'white',
        }}
      >
        <div className={iconSizes[size]}>
          {statusIcons[status]}
        </div>
        <span>{label || statusLabels[status]}</span>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl p-4 min-w-[200px] border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <div className={iconSizes.md} style={{ color: statusColors[status] }}>
              {statusIcons[status]}
            </div>
            {statusLabels[status]}
          </h4>
          <p className="text-xs text-gray-600 mb-3">
            {statusDescriptions[status]}
          </p>
          
          {showStats && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h5 className="text-xs font-semibold text-gray-700 mb-1">Field Conditions</h5>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(statusStats[status]).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${getStatColor(value)}`}>
                      {getStatIcon(key as 'water' | 'sunlight' | 'fertility')}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 capitalize">{key}</p>
                    <p className="text-xs font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
}

// Legend component for map
interface LandStatusLegendProps {
  compact?: boolean;
  showStats?: boolean;
}

export function LandStatusLegend({ compact = false, showStats = false }: LandStatusLegendProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
        Land Status Legend
      </h3>
      <div className="space-y-2">
        {(Object.keys(statusColors) as LandStatus[]).map((status) => (
          <div key={status} className="flex items-center justify-between">
            <LandStatusIndicator 
              status={status} 
              compact={true}
              showAnimation={false}
            />
            {!compact && (
              <span className="text-xs text-gray-500">
                {statusDescriptions[status]}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {showStats && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Condition Indicators</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                <Droplets className="w-3 h-3" />
              </div>
              <p className="mt-1">Water</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600">
                <Sun className="w-3 h-3" />
              </div>
              <p className="mt-1">Sunlight</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                <TrendingUp className="w-3 h-3" />
              </div>
              <p className="mt-1">Fertility</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
