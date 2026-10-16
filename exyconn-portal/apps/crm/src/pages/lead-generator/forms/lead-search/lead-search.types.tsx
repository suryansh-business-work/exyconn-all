import { z } from 'zod';

/** The largest radius Google Places accepts around a point, in kilometres. */
export const MAX_RADIUS_KM = 50;

/**
 * What to look for and where: a place typed as text, or a radius around the map's centre.
 * One of the two is required.
 */
export const leadSearchSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(2, 'Describe what to look for, e.g. dentists')
      .max(200, 'At most 200 characters'),
    aroundMap: z.boolean(),
    location: z.string().trim().max(200, 'At most 200 characters'),
    radiusKm: z.coerce
      .number('Enter the radius in kilometres')
      .min(1, 'At least 1 km')
      .max(MAX_RADIUS_KM, `At most ${MAX_RADIUS_KM} km`),
    type: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.aroundMap && values.location === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['location'],
        message: 'Enter a place, e.g. Pune, India — or search around the map centre',
      });
    }
  });

export type LeadSearchFormInput = z.input<typeof leadSearchSchema>;
export type LeadSearchValues = z.infer<typeof leadSearchSchema>;

export const LEAD_SEARCH_DEFAULTS: LeadSearchFormInput = {
  query: '',
  aroundMap: false,
  location: '',
  radiusKm: 5,
  type: '',
};
