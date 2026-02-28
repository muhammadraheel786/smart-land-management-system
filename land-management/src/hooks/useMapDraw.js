"use client";

import { useState, useCallback, useRef } from "react";

const CLOSE_PIXEL_THRESHOLD = 25;
const DBLCLICK_MS = 350;

export function useMapDraw(onFinish, onCancel) {
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastClickTimeRef = useRef(0);

  const startDrawing = useCallback(() => {
    setPoints([]);
    setIsDrawing(true);
    lastClickTimeRef.current = 0;
  }, []);

  const finishDrawing = useCallback(
    (coords) => {
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

  const addPoint = useCallback((lat, lng) => {
    setPoints((prev) => [...prev, { lat, lng }]);
  }, []);

  const undoPoint = useCallback(() => {
    setPoints((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const tryCloseOrFinish = useCallback(
    (currentPoints, lat, lng, latLngToContainerPoint, firstLat, firstLng) => {
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
    (currentPoints) => {
      if (currentPoints.length >= 3) {
        finishDrawing(currentPoints);
        return true;
      }
      return false;
    },
    [finishDrawing]
  );

  const handleClick = useCallback(
    (lat, lng, mapInstance, shape) => {
      const now = Date.now();
      
      // Check for double click
      if (now - lastClickTimeRef.current < DBLCLICK_MS && points.length >= 3) {
        finishDrawing(points);
        return true;
      }
      
      lastClickTimeRef.current = now;
      
      // Check if clicking near first point to close polygon
      if (points.length >= 3) {
        const containerPoint = mapInstance.latLngToContainerPoint([lat, lng]);
        const firstPoint = mapInstance.latLngToContainerPoint([points[0].lat, points[0].lng]);
        const distance = Math.sqrt(
          Math.pow(containerPoint.x - firstPoint.x, 2) + 
          Math.pow(containerPoint.y - firstPoint.y, 2)
        );
        
        if (distance <= CLOSE_PIXEL_THRESHOLD) {
          finishDrawing(points);
          return true;
        }
      }
      
      // Handle rectangle mode
      if (shape === "rectangle" && points.length >= 2) {
        const [a, b] = [points[0], { lat, lng }];
        const rect = [
          { lat: Math.min(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
          { lat: Math.min(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
          { lat: Math.max(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
          { lat: Math.max(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
        ];
        finishDrawing(rect);
        return true;
      }
      
      // Add point for polygon
      addPoint(lat, lng);
      return false;
    },
    [points, finishDrawing, addPoint]
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
    handleClick,
    lastClickTimeRef,
  };
}
