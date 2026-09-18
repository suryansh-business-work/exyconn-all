import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { isValidCountry } from '../../utils/iso';

/** How binding a company holiday is. */
export const HOLIDAY_TYPES = ['PUBLIC', 'OPTIONAL', 'RESTRICTED'] as const;

const NOT_A_COUNTRY = '"{VALUE}" is not an ISO 3166-1 country';

/**
 * A company holiday, readable by every authenticated employee it applies to: a global one
 * (no country) reaches everybody except the countries that opted out of it, a country one
 * reaches only the people in that country.
 */
const holidaySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: HOLIDAY_TYPES, required: true, default: 'PUBLIC' },
    description: { type: String, trim: true, default: null },
    /** ISO 3166-1 alpha-2, or empty for a holiday the whole company observes. */
    country: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      validate: {
        validator: (code: string) => code === '' || isValidCountry(code),
        message: NOT_A_COUNTRY,
      },
    },
    /** Countries that do not observe this global holiday. Unused on a country holiday. */
    excludedCountries: {
      type: [
        {
          type: String,
          trim: true,
          uppercase: true,
          validate: { validator: isValidCountry, message: NOT_A_COUNTRY },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

holidaySchema.index({ date: 1 });

export type HolidayDocument = InferSchemaType<typeof holidaySchema>;

export const HolidayModel: Model<HolidayDocument> = model<HolidayDocument>(
  'Holiday',
  holidaySchema,
);
