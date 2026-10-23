/** The radius choices, in kilometres, for a search or filter around a point. */
export const RADIUS_KM_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

const METRES_PER_KM = 1000;

export const kmToMetres = (km: number) => Math.round(km * METRES_PER_KM);

/** Latitude and longitude in range, as typed or read back from the browser. */
export const isLatitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 90;
export const isLongitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 180;
