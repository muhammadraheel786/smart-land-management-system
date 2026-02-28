"use client";

import { useState, useCallback, useRef } from "react";

const CLOSE_PIXEL_THRESHOLD = 25;
const DBLCLICK_MS = 350;

export interface UseMapDrawReturn {
  points: { lat: number; lng: number }[];
  isDrawing: boolean;
  startDrawing: () => void;
  finishDrawing: (coords: { lat: number; lng: number }[]) => void;
  cancelDrawing: () => void;
  addPoint: (lat: number, lng: number) => void;
  undoPoint: () => void;
  tryCloseOrFinish: (
    currentPoints: { lat: number; lng: number }[],
    lat: number,
    lng: number,
    latLngToContainerPoint: (lat: number, lng: number) => { x: number; y: number },
    firstLat: number,
    firstLng: number
  ) => boolean;
  handleDoubleClick: (currentPoints: { lat: number; lng: number }[]) => boolean;
  lastClickTimeRef: React.MutableRefObject<number>;
}

export function useMapDraw(
  onFinish: (coords: { lat: number; lng: number }[]) => void,
  onCancel: () => void
): UseMapDrawReturn {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastClickTimeRef = useRef(0);

  const startDrawing = useCallback(() => {
    setPoints([]);
    setIsDrawing(true);
  }, []);

  const finishDrawing = useCallback(
    (coords: { lat: number; lng: number }[]) => {
      if (coords.length >= 3) {
        onFinish(coords);
      }
      setPoints([]);
      setIsDrawing(false);
    },
    [onFinish]
  );

  const cancelDrawing = useCallback(() => {
    setPoints([]);
    setIsDrawing(false);
    onCancel();
  }, [onCancel]);

  const addPoint = useCallback((lat: number, lng: number) => {
    setPoints((prev) => [...prev, { lat, lng }]);
  }, []);

  const undoPoint = useCallback(() => {
    setPoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const tryCloseOrFinish = useCallback(
    (
      currentPoints: { lat: number; lng: number }[],
      lat: number,
      lng: number,
      latLngToContainerPoint: (lat: number, lng: number) => { x: number; y: number },
      firstLat: number,
      firstLng: number
    ): boolean => {
      if (currentPoints.length < 2) return false;
      const pt = latLngToContainerPoint(lat, lng);
      const firstPt = latLngToContainerPoint(firstLat, firstLng);
      const dist = Math.hypot(pt.x - firstPt.x, pt.y - firstPt.y);
      if (dist <= CLOSE_PIXEL_THRESHOLD) {
        finishDrawing(currentPoints);
        return true;
      }
      return false;
    },
    [finishDrawing]
  );

  const handleDoubleClick = useCallback(
    (currentPoints: { lat: number; lng: number }[]): boolean => {
      if (currentPoints.length >= 3) {
        finishDrawing(currentPoints);
        return true;
      }
      return false;
    },
    [finishDrawing]
  );

  return {
    points,
    isDrawing,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    addPoint,
    undoPoint,
    tryCloseOrFinish,
    handleDoubleClick,
    lastClickTimeRef,
  };
}
