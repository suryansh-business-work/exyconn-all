import { notFound } from '../../utils/errors';
import { requireSecret, withoutBlankSecret } from '../tech/tech.service';
import { GoogleMapsConfigModel } from './google-maps-config.model';
import { searchText } from './places.client';

export interface GoogleMapsConfigInput {
  label: string;
  /** Empty when editing keeps the stored key. */
  browserKey: string;
  /** Empty when editing keeps the stored key. */
  serverKey: string;
  isActive?: boolean | null;
}

/** What the CRM needs to know: the browser key (if any) and whether search can run. */
export interface GoogleMapsClientConfig {
  browserKey: string | null;
  placesReady: boolean;
}

/** Blank secrets on an edit keep the stored ones. */
const updateOf = (input: GoogleMapsConfigInput) =>
  withoutBlankSecret(withoutBlankSecret(input, 'browserKey') as GoogleMapsConfigInput, 'serverKey');

/** Tech > Environment Variables > Google Maps: one config active at a time. */
export const googleMapsConfigs = {
  list() {
    return GoogleMapsConfigModel.find().sort({ createdAt: -1 }).lean();
  },

  async create(input: GoogleMapsConfigInput) {
    requireSecret(input.serverKey, 'Places server key');
    if (input.isActive) {
      await GoogleMapsConfigModel.updateMany({}, { isActive: false });
    }
    return (await GoogleMapsConfigModel.create(input)).toObject();
  },

  async update(id: string, input: GoogleMapsConfigInput) {
    if (input.isActive) {
      await GoogleMapsConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await GoogleMapsConfigModel.findByIdAndUpdate(id, updateOf(input), {
      new: true,
    }).lean();
    if (!doc) notFound('Google Maps config');
    return doc;
  },

  /** One cheap Places search through this config's server key; Google's error is kept. */
  async test(id: string) {
    const config = await GoogleMapsConfigModel.findById(id).lean();
    if (!config) notFound('Google Maps config');
    requireSecret(config.serverKey, 'Places server key');
    const page = await searchText(config.serverKey, { query: 'coffee in London' });
    return `Places API answered with ${page.places.length} results. The browser key is checked by Google against its HTTP referrers when the CRM map loads.`;
  },

  async remove(id: string) {
    const doc = await GoogleMapsConfigModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Google Maps config');
    return true;
  },

  async client(): Promise<GoogleMapsClientConfig> {
    const config = await GoogleMapsConfigModel.findOne({ isActive: true }).lean();
    const browserKey = config?.browserKey ?? '';
    return {
      browserKey: browserKey === '' ? null : browserKey,
      placesReady: Boolean(config?.serverKey),
    };
  },
};
