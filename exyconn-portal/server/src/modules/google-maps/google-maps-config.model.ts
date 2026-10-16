import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The install's Google Maps Platform keys, managed in Tech > Environment Variables > Google Maps
 * (DB-backed, no env dependency). One config is active at a time.
 *
 * - `browserKey` loads the Maps JavaScript API in the CRM (the lead generator's map, the map on a
 *   company or contact). It necessarily reaches the browser, so in Google Cloud it must be
 *   restricted to HTTP referrers (https://crm.exyconn.com/*) and to the Maps JavaScript and
 *   Geocoding APIs — that restriction, not secrecy, is what protects it.
 * - `serverKey` calls the Places API (New) from this server only and never leaves it. Restrict it
 *   to the Places API (New) and, where possible, to the server's IP address.
 */
const googleMapsConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    browserKey: { type: String, default: '', trim: true },
    /** Write-only. */
    serverKey: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type GoogleMapsConfigDocument = InferSchemaType<typeof googleMapsConfigSchema>;

export const GoogleMapsConfigModel: Model<GoogleMapsConfigDocument> =
  model<GoogleMapsConfigDocument>('GoogleMapsConfig', googleMapsConfigSchema);
