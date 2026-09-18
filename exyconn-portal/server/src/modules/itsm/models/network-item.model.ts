import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { IT_NETWORK_KINDS, IT_SERVICE_STATUSES } from '../itsm.enums';

/** One piece of the network: a Wi-Fi network, a VPN, a firewall, a DNS zone, an IP range. */
const networkItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: IT_NETWORK_KINDS, required: true, default: 'WIFI' },
    /** IP, CIDR range, hostname or SSID — whatever identifies it on the network. */
    address: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    provider: { type: String, default: '', trim: true },
    status: { type: String, enum: IT_SERVICE_STATUSES, required: true, default: 'ACTIVE' },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ItNetworkItemDocument = InferSchemaType<typeof networkItemSchema>;
export const ItNetworkItemModel: Model<ItNetworkItemDocument> = model<ItNetworkItemDocument>(
  'ItNetworkItem',
  networkItemSchema,
);
