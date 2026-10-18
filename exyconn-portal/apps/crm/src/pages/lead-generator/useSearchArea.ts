import { useCallback, useMemo, useState } from 'react';
import type { LatLng } from '../../maps/mapLinks';
import { MAX_AREA_POINTS, MIN_AREA_POINTS } from './forms/lead-search';

const NO_AREA: LatLng[] = [];

/**
 * The area drawn on the map for "Inside a drawn area": each map click adds a corner while
 * drawing; once finished, the corners can still be dragged and the path is read back.
 */
export function useSearchArea() {
  const [points, setPoints] = useState<LatLng[]>(NO_AREA);
  const [drawing, setDrawing] = useState(false);

  const start = useCallback(() => {
    setPoints(NO_AREA);
    setDrawing(true);
  }, []);
  const addPoint = useCallback(
    (point: LatLng) =>
      setPoints((current) => (current.length >= MAX_AREA_POINTS ? current : [...current, point])),
    [],
  );
  const undo = useCallback(() => setPoints((current) => current.slice(0, -1)), []);
  const finish = useCallback(() => setDrawing(false), []);
  const clear = useCallback(() => {
    setPoints(NO_AREA);
    setDrawing(false);
  }, []);
  const edit = useCallback((next: LatLng[]) => setPoints(next), []);

  const finished = !drawing && points.length >= MIN_AREA_POINTS;
  /** The finished area to search in, or empty while drawing or with too few corners. */
  const area = useMemo(() => (finished ? points : NO_AREA), [finished, points]);

  return { points, drawing, finished, area, start, addPoint, undo, finish, clear, edit };
}

export type SearchArea = ReturnType<typeof useSearchArea>;
