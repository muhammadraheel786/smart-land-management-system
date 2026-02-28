/** Enhanced land parcel styling with gradients and visual effects */
import type { LandStatus } from "@/types";

export const statusColors: Record<LandStatus, string> = {
  cultivated: "#228B22",   // Forest green - active farmland
  available: "#90EE90",    // Light green - ready for cultivation
  uncultivated: "#DEB887", // Burlywood - dry soil / bare earth
  not_usable: "#8B7355",   // Dark khaki - rocky / saline
  thaka: "#4682B4",        // Steel blue - leased land
};

export const statusGradients: Record<LandStatus, string> = {
  cultivated: "linear-gradient(135deg, #228B22, #32CD32)",
  available: "linear-gradient(135deg, #90EE90, #98FB98)",
  uncultivated: "linear-gradient(135deg, #DEB887, #F4A460)",
  not_usable: "linear-gradient(135deg, #8B7355, #A0522D)",
  thaka: "linear-gradient(135deg, #4682B4, #5F9EA0)",
};

export const statusBorderColors: Record<LandStatus, string> = {
  cultivated: "#006400",
  available: "#228B22",
  uncultivated: "#D2691E",
  not_usable: "#654321",
  thaka: "#1E90FF",
};

/** Enhanced border styling with glow effects */
export const BORDER_COLOR = "rgba(255, 255, 255, 0.95)";
export const BORDER_WEIGHT = 3;
export const FILL_OPACITY = 0.35;
export const BORDER_GLOW = "0 0 8px rgba(255, 255, 255, 0.6)";

/** Enhanced dashed border for unfenced / available land */
export const DASHED_BORDER = "8, 6";
export const DOTTED_BORDER = "2, 4";

/** Enhanced style for drawing preview */
export const DRAW_PREVIEW = {
  color: "#00FF00",
  fillColor: "#00FF00",
  fillOpacity: 0.3,
  weight: 3,
  dashArray: "5, 5",
};

/** Hover effects for interactive land parcels */
export const HOVER_STYLE = {
  fillOpacity: 0.5,
  weight: 4,
  color: "#FFD700",
};

/** Selected field styling */
export const SELECTED_STYLE = {
  fillOpacity: 0.6,
  weight: 4,
  color: "#FF6347",
  dashArray: "10, 5",
};
