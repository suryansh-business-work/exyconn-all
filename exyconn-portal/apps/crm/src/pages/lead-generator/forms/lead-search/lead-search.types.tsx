import { z } from 'zod';
import type { LatLng } from '../../../../maps/mapLinks';
import { isLatitude, isLongitude } from '../../../../maps/radius';

/** The largest radius Google Places accepts around a point, in kilometres. */
export const MAX_RADIUS_KM = 50;
/** An area drawn on the map needs at least this many corners… */
export const MIN_AREA_POINTS = 3;
/** …and the server accepts at most this many. */
export const MAX_AREA_POINTS = 50;

/** Where to look: a place typed as text, a radius around a point, or a drawn area. */
export const SEARCH_MODES = ['place', 'map', 'area'] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

/** The point a radius search is around: the map's centre, the reader's location, or typed. */
export const SEARCH_CENTRES = ['map', 'me', 'coords'] as const;
export type SearchCentre = (typeof SEARCH_CENTRES)[number];

/** The radius search the map shows as a circle; a null centre follows the map's centre. */
export interface SearchCircle {
  centre: LatLng | null;
  radiusKm: number;
}

const point = z.object({ lat: z.number(), lng: z.number() });

interface CentreValues {
  centre: SearchCentre;
  lat: string;
  lng: string;
}

const numberOf = (text: string) => (text === '' ? Number.NaN : Number(text));

/** The typed or located point, or null when the search is around the map's centre or incomplete. */
export function pointOf(values: Readonly<CentreValues>): LatLng | null {
  const lat = numberOf(values.lat);
  const lng = numberOf(values.lng);
  if (values.centre === 'map' || !isLatitude(lat) || !isLongitude(lng)) {
    return null;
  }
  return { lat, lng };
}

/** A radius search around the reader or typed coordinates needs a real point. */
function checkCentre(values: Readonly<CentreValues>, ctx: z.RefinementCtx) {
  if (values.centre === 'me' && pointOf(values) === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['lat'],
      message: 'Your location is not known yet. Choose Locate me and allow location access.',
    });
  }
  if (values.centre !== 'coords') {
    return;
  }
  if (!isLatitude(numberOf(values.lat))) {
    ctx.addIssue({ code: 'custom', path: ['lat'], message: 'Enter a latitude between -90 and 90' });
  }
  if (!isLongitude(numberOf(values.lng))) {
    ctx.addIssue({
      code: 'custom',
      path: ['lng'],
      message: 'Enter a longitude between -180 and 180',
    });
  }
}

/** What to look for, and where: the chosen mode decides which of the "where" fields is required. */
export const leadSearchSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(2, 'Describe what to look for, e.g. dentists')
      .max(200, 'At most 200 characters'),
    mode: z.enum(SEARCH_MODES),
    location: z.string().trim().max(200, 'At most 200 characters'),
    radiusKm: z.coerce
      .number('Enter the radius in kilometres')
      .min(1, 'At least 1 km')
      .max(MAX_RADIUS_KM, `At most ${MAX_RADIUS_KM} km`),
    centre: z.enum(SEARCH_CENTRES),
    /** Text while typed; read as numbers by `pointOf`. */
    lat: z.string().trim(),
    lng: z.string().trim(),
    /** The finished area's corners, kept in step with the map by the page. */
    area: z.array(point),
  })
  .superRefine((values, ctx) => {
    if (values.mode === 'place' && values.location === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Enter a place, e.g. Pune, India — or search on the map',
      });
    }
    if (values.mode === 'map') {
      checkCentre(values, ctx);
    }
    if (values.mode === 'area' && values.area.length < MIN_AREA_POINTS) {
      ctx.addIssue({
        code: 'custom',
        path: ['area'],
        message: 'Draw an area on the map with at least 3 points, then choose Finish area',
      });
    }
    if (values.mode === 'area' && values.area.length > MAX_AREA_POINTS) {
      ctx.addIssue({
        code: 'custom',
        path: ['area'],
        message: 'An area can have at most 50 points',
      });
    }
  });

export type LeadSearchFormInput = z.input<typeof leadSearchSchema>;
export type LeadSearchValues = z.infer<typeof leadSearchSchema>;

export const LEAD_SEARCH_DEFAULTS: LeadSearchFormInput = {
  query: '',
  mode: 'place',
  location: '',
  radiusKm: '5',
  centre: 'map',
  lat: '',
  lng: '',
  area: [],
};
