import { useEffect, useMemo, useRef } from 'react';
import { MarkerF, PolygonF, useGoogleMap } from '@react-google-maps/api';
import { useT } from '@exyconn/i18n';
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
 * The drawn search area, in red, with core Maps JavaScript only (the Drawing library is
 * retired): while drawing, each map click adds a corner and the shape closes itself back to
 * the first corner, which can be clicked to finish; once finished, the polygon is editable
 * and its path is read back after every drag.
 */
export function DrawArea({ area }: Readonly<{ area: SearchArea }>) {
  const t = useT();
  const map = useGoogleMap();
  const theme = useTheme();
  const polygon = useRef<google.maps.Polygon | null>(null);
  const { drawing, points, addPoint, edit, finish } = area;
  const colour = theme.palette.error.main;
  const canClose = points.length >= MIN_AREA_POINTS;

  useEffect(() => {
    if (!map || !drawing) {
      return undefined;
    }
    // A double click would zoom and drop two corners on one spot.
    map.setOptions({ draggableCursor: 'crosshair', disableDoubleClickZoom: true });
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        addPoint(event.latLng.toJSON());
      }
    });
    return () => {
      listener.remove();
      map.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
    };
  }, [map, drawing, addPoint]);

  const outlineOptions = useMemo<google.maps.PolygonOptions>(
    () => ({
      strokeColor: colour,
      strokeWeight: STROKE_WEIGHT,
      fillColor: colour,
      fillOpacity: FILL_OPACITY,
      clickable: false,
    }),
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
        <PolygonF paths={points} options={outlineOptions} />
        {points.map((point, index) => {
          // The first corner closes the shape: clicking it finishes instead of adding a corner.
          const closes = index === 0 && canClose;
          return (
            <MarkerF
              key={`${point.lat}:${point.lng}`}
              position={point}
              icon={vertexIcon}
              clickable={closes}
              title={closes ? t('Click to finish the area') : undefined}
              onClick={closes ? finish : undefined}
            />
          );
        })}
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
