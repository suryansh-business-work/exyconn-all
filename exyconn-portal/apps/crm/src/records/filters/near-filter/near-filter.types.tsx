import { z } from 'zod';
import type { CrmNearInput } from '@exyconn/shell/graphql/generated';
import type { LatLng } from '../../../maps/mapLinks';
import { isLatitude, isLongitude, RADIUS_KM_OPTIONS } from '../../../maps/radius';

/** The radius a new filter starts with, in kilometres. */
export const DEFAULT_NEAR_RADIUS_KM = 10;

const RADIUS_CHOICES: ReadonlySet<number> = new Set(RADIUS_KM_OPTIONS);

/** "Near a location" as the list holds it: the circle, and what to call its centre. */
export interface NearFilter extends CrmNearInput {
  /** The place picked or "Your location"; empty when the coordinates were typed in. */
  label: string;
}

/** A centre found by name (the browser's position or a suggested place). */
export interface NamedCentre extends LatLng {
  label: string;
}

interface CoordinateRules {
  missing: string;
  notNumber: string;
  outOfRange: string;
  inRange: (value: number) => boolean;
}

/** A coordinate typed as text: required, a number, and in range. */
const coordinate = ({ missing, notNumber, outOfRange, inRange }: CoordinateRules) =>
  z
    .string()
    .trim()
    .min(1, missing)
    .refine((text) => !Number.isNaN(Number(text)), notNumber)
    .refine((text) => Number.isNaN(Number(text)) || inRange(Number(text)), outOfRange);

/** The centre (typed, from the browser or from a place) and a radius from the fixed choices. */
export const nearFilterSchema = z.object({
  lat: coordinate({
    missing: 'Enter the latitude, or use your location or a place',
    notNumber: 'The latitude is a number, e.g. 12.9716',
    outOfRange: 'Latitude is from -90 to 90',
    inRange: isLatitude,
  }),
  lng: coordinate({
    missing: 'Enter the longitude, or use your location or a place',
    notNumber: 'The longitude is a number, e.g. 77.5946',
    outOfRange: 'Longitude is from -180 to 180',
    inRange: isLongitude,
  }),
  radiusKm: z.coerce
    .number('Choose a radius')
    .refine((value) => RADIUS_CHOICES.has(value), 'Choose a radius'),
});

export type NearFilterFormInput = z.input<typeof nearFilterSchema>;
export type NearFilterValues = z.infer<typeof nearFilterSchema>;

/** The form's starting values: the filter being edited, or an empty centre. */
export function toNearFormValues(near: NearFilter | null | undefined): NearFilterFormInput {
  return {
    lat: near ? String(near.lat) : '',
    lng: near ? String(near.lng) : '',
    radiusKm: near?.radiusKm ?? DEFAULT_NEAR_RADIUS_KM,
  };
}

/** The filter the values make, keeping the centre's name only while its coordinates are unchanged. */
export function toNearFilter(values: NearFilterValues, named: NamedCentre | null): NearFilter {
  const lat = Number(values.lat);
  const lng = Number(values.lng);
  const sameCentre = named?.lat === lat && named.lng === lng;
  return { lat, lng, radiusKm: values.radiusKm, label: sameCentre ? named.label : '' };
}

/** The circle as the server takes it, or undefined when there is no filter. */
export function nearInputOf(near: NearFilter | null | undefined): CrmNearInput | undefined {
  return near ? { lat: near.lat, lng: near.lng, radiusKm: near.radiusKm } : undefined;
}
