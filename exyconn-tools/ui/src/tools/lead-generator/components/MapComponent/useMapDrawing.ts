import { useState, useCallback, useRef } from 'react';
import { PolygonCoordinates } from '../../types';
import { polygonOptions } from './types';

interface UseMapDrawingProps {
  map: google.maps.Map | null;
  isLoaded: boolean;
  onPolygonComplete: (coordinates: PolygonCoordinates[]) => void;
  onClearPolygon: () => void;
}

export const useMapDrawing = ({ map, isLoaded, onPolygonComplete, onClearPolygon }: UseMapDrawingProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const triggerDrawPolygon = useCallback(() => {
    if (!map || !isLoaded) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
      onClearPolygon();
    }

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
      setIsDrawing(true);
      return;
    }

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions: polygonOptions,
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;
    setIsDrawing(true);

    google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      polygonRef.current = polygon;

      const path = polygon.getPath();
      const coordinates: PolygonCoordinates[] = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push({
          lat: point.lat(),
          lng: point.lng(),
        });
      }

      onPolygonComplete(coordinates);
      setIsDrawing(false);

      drawingManager.setDrawingMode(null);

      google.maps.event.addListener(path, 'set_at', () => {
        const updatedCoords: PolygonCoordinates[] = [];
        for (let j = 0; j < path.getLength(); j++) {
          const pt = path.getAt(j);
          updatedCoords.push({ lat: pt.lat(), lng: pt.lng() });
        }
        onPolygonComplete(updatedCoords);
      });

      google.maps.event.addListener(path, 'insert_at', () => {
        const updatedCoords: PolygonCoordinates[] = [];
        for (let j = 0; j < path.getLength(); j++) {
          const pt = path.getAt(j);
          updatedCoords.push({ lat: pt.lat(), lng: pt.lng() });
        }
        onPolygonComplete(updatedCoords);
      });
    });
  }, [map, isLoaded, onPolygonComplete, onClearPolygon]);

  const handleClearPolygon = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    setIsDrawing(false);
    onClearPolygon();
  }, [onClearPolygon]);

  return {
    isDrawing,
    polygonRef,
    triggerDrawPolygon,
    handleClearPolygon,
  };
};
