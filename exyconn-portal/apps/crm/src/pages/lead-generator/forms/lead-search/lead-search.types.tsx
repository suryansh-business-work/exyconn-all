import { z } from 'zod';

/** The largest radius Google Places accepts around a point, in kilometres. */
export const MAX_RADIUS_KM = 50;
/** An area drawn on the map needs at least this many corners… */
export const MIN_AREA_POINTS = 3;
/** …and the server accepts at most this many. */
export const MAX_AREA_POINTS = 50;

/** Where to look: a place typed as text, a radius around the map's centre, or a drawn area. */
export const SEARCH_MODES = ['place', 'map', 'area'] as const;
export type SearchMode = (typeof SEARCH_MODES)[number];

const point = z.object({ lat: z.number(), lng: z.number() });

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
  radiusKm: 5,
  area: [],
};
