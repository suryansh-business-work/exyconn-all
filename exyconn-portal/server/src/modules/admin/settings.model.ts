import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { FALLBACK_LOCALE } from '../i18n/locale.constants';

/**
 * Single document holding the portal-wide localization defaults every screen reads:
 * date/time formats, the house timezone, the house language and which languages people
 * may pick from. Identified by a fixed `key`.
 */
const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    dateFormat: { type: String, required: true, default: 'dd MMM yyyy' },
    timeFormat: { type: String, required: true, default: 'hh:mm a' },
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },
    /**
     * The language the portal is shown in when a person has not chosen one, and the one
     * every missing translation falls back to. BCP-47.
     */
    defaultLocale: { type: String, required: true, default: FALLBACK_LOCALE },
    /**
     * The locales this workspace offers in its pickers. The default is always available
     * whether or not it is listed here, and so is English — a workspace can always read
     * the source strings.
     */
    enabledLocales: { type: [String], required: true, default: [FALLBACK_LOCALE] },
    /**
     * Machine-translate a string the first time somebody's screen needs it and no
     * translation exists. Off leaves untranslated strings in the default locale, which is
     * the honest thing to show when a workspace would rather translate by hand.
     */
    autoTranslate: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type AppSettingsDocument = InferSchemaType<typeof settingsSchema>;

export const AppSettingsModel: Model<AppSettingsDocument> = model<AppSettingsDocument>(
  'AppSettings',
  settingsSchema,
);
