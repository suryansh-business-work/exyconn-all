import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { DEVICE_PLATFORMS } from '../tracker.constants';

/**
 * A machine the employee has signed into. This row is what makes a non-expiring desktop
 * token safe: the token carries no `exp`, so the employee never signs in again, but every
 * tracker call re-checks this document. Setting `revokedAt` kills the token immediately —
 * the alternative (rotating JWT_SECRET) would sign out every portal user too.
 *
 * `tokenHash` stores a SHA-256 of the issued token, never the token itself.
 */
const trackerDeviceSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true },
    platform: { type: String, required: true, enum: DEVICE_PLATFORMS },
    hostname: { type: String, default: '', trim: true },
    appVersion: { type: String, default: '', trim: true },

    /**
     * Stable hardware identifier from the OS (registry GUID on Windows, IOPlatformUUID on
     * macOS). Unlike `deviceId` — which is generated per install and would change on a
     * reinstall — this survives, so the same physical machine is recognisable across
     * reinstalls and an employee can't quietly rack up devices.
     */
    machineId: { type: String, default: '', trim: true, index: true },
    osName: { type: String, default: '', trim: true },
    osVersion: { type: String, default: '', trim: true },
    arch: { type: String, default: '', trim: true },
    cpuModel: { type: String, default: '', trim: true },
    cpuCores: { type: Number, default: 0, min: 0 },
    totalMemoryMb: { type: Number, default: 0, min: 0 },
    locale: { type: String, default: '', trim: true },
    timezone: { type: String, default: '', trim: true },
    screenCount: { type: Number, default: 0, min: 0 },
    screenResolution: { type: String, default: '', trim: true },

    issuedAt: { type: Date, required: true, default: Date.now },
    lastSeenAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date, default: null },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type TrackerDeviceDocument = InferSchemaType<typeof trackerDeviceSchema>;
export const TrackerDeviceModel: Model<TrackerDeviceDocument> = model<TrackerDeviceDocument>(
  'TrackerDevice',
  trackerDeviceSchema,
);
