import { useEffect, useMemo, useRef } from 'react';
import { MarkerF, PolygonF, PolylineF, useGoogleMap } from '@react-google-maps/api';
import { useTheme } from '@exyconn/shell/components/ui';
import type { LatLng } from '../../../maps/mapLinks';
import { MIN_AREA_POINTS } from '../forms/lead-search';
import type { SearchArea } from '../useSearchArea';

const FILL_OPACITY = 0.12;
const STROKE_WEIGHT = 2;
const VERTEX_SCALE = 5;

const samePath = (a: LatLng[], b: LatLng[]) =>
  a.length === b.length && a.every((point, i) => point.lat === b[i].lat && point.lng === b[i].lng);

/**
 * The drawn search area, with core Maps JavaScript only (the Drawing library is retired):
 * while drawing, each map click adds a corner and the outline follows; once finished, the
 * polygon is editable and its path is read back after every drag.
 */
export function DrawArea({ area }: Readonly<{ area: SearchArea }>) {
  const map = useGoogleMap();
  const theme = useTheme();
  const polygon = useRef<google.maps.Polygon | null>(null);
  const { drawing, points, addPoint, edit } = area;
  const colour = theme.palette.primary.main;

  useEffect(() => {
    if (!map || !drawing) {
      return undefined;
    }
    map.setOptions({ draggableCursor: 'crosshair' });
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        addPoint(event.latLng.toJSON());
      }
    });
    return () => {
      listener.remove();
      map.setOptions({ draggableCursor: null });
    };
  }, [map, drawing, addPoint]);

  const lineOptions = useMemo<google.maps.PolylineOptions>(
    () => ({ strokeColor: colour, strokeWeight: STROKE_WEIGHT, clickable: false }),
    [colour],
  );
  const shapeOptions = useMemo<google.maps.PolygonOptions>(
    () => ({
      strokeColor: colour,
      strokeWeight: STROKE_WEIGHT,
      fillColor: colour,
      fillOpacity: FILL_OPACITY,
    }),
    [colour],
  );
  const vertexIcon = useMemo<google.maps.Symbol>(
    () => ({
      path: google.maps.SymbolPath.CIRCLE,
      scale: VERTEX_SCALE,
      fillColor: colour,
      fillOpacity: 1,
      strokeColor: theme.palette.background.paper,
      strokeWeight: STROKE_WEIGHT,
    }),
    [colour, theme.palette.background.paper],
  );

  const readBack = () => {
    const next = polygon.current
      ?.getPath()
      .getArray()
      .map((point) => point.toJSON());
    if (next && !samePath(next, points)) {
      edit(next);
    }
  };

  if (drawing) {
    return (
      <>
        <PolylineF path={points} options={lineOptions} />
        {points.map((point) => (
          <MarkerF
            key={`${point.lat}:${point.lng}`}
            position={point}
            icon={vertexIcon}
            clickable={false}
          />
        ))}
      </>
    );
  }
  if (points.length < MIN_AREA_POINTS) {
    return null;
  }
  return (
    <PolygonF
      paths={points}
      editable
      options={shapeOptions}
      onLoad={(loaded) => {
        polygon.current = loaded;
      }}
      onUnmount={() => {
        polygon.current = null;
      }}
      onMouseUp={readBack}
    />
  );
}
