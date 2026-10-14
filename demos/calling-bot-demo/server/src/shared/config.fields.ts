/**
 * What the calling bot runs on, edited in Tech > Demos > Calling bot and read by the voice
 * server. Exactly one document is `isActive`; that one answers every call.
 *
 * The fields are a plain schema definition rather than a Mongoose schema so the portal server
 * (which edits them) and the voice server (which reads them) each build the schema with their
 * own Mongoose, from this one description.
 */
export const CALLING_BOT_CONFIG_MODEL = 'CallingBotConfig';

export const CALLING_BOT_CONFIG_FIELDS = {
  label: { type: String, required: true, trim: true },
  /** Sarvam AI subscription key, for speech-to-text and text-to-speech. Write-only. */
  sarvamApiKey: { type: String, required: true, trim: true },
  /** OpenAI key the bot thinks with. Write-only. */
  openAiApiKey: { type: String, required: true, trim: true },
  /** A fast chat model, e.g. gpt-4o-mini: the reply has to start within a second. */
  openAiModel: { type: String, required: true, trim: true },
  /** Who the bot is and how it talks: the system prompt of every call. */
  systemPrompt: { type: String, required: true, trim: true },
  /** The first thing the bot says when the call connects. */
  greeting: { type: String, required: true, trim: true },
  /** The language the caller speaks and the bot answers in, e.g. hi-IN, en-IN. */
  languageCode: { type: String, required: true, trim: true },
  /** Sarvam text-to-speech model and voice, e.g. bulbul:v2 / anushka. */
  ttsModel: { type: String, required: true, trim: true },
  ttsSpeaker: { type: String, required: true, trim: true },
  /** A call is hung up after this long, so a demo cannot run up the bill. */
  maxCallSeconds: { type: Number, required: true, min: 30, max: 900 },
  /** Vobiz account, for calls to a real phone; all three empty leaves only the browser call. */
  vobizAuthId: { type: String, default: '', trim: true },
  /** Write-only. */
  vobizAuthToken: { type: String, default: '', trim: true },
  /** The Vobiz number calls are placed from, in E.164 (+91…). */
  vobizNumber: { type: String, default: '', trim: true },
  /**
   * Signs the short-lived tickets that open a call on the voice server. Generated with the
   * config, never shown and never edited; replacing the config retires every open ticket.
   */
  ticketSecret: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: false },
};

/** One calling bot configuration as stored. */
export interface CallingBotConfigRecord {
  _id: unknown;
  label: string;
  sarvamApiKey: string;
  openAiApiKey: string;
  openAiModel: string;
  systemPrompt: string;
  greeting: string;
  languageCode: string;
  ttsModel: string;
  ttsSpeaker: string;
  maxCallSeconds: number;
  vobizAuthId: string;
  vobizAuthToken: string;
  vobizNumber: string;
  ticketSecret: string;
  isActive: boolean;
}

/** Whether a config can place calls to a real phone: every Vobiz field is filled in. */
export const canPhone = (
  config: Pick<CallingBotConfigRecord, 'vobizAuthId' | 'vobizAuthToken' | 'vobizNumber'>,
): boolean => Boolean(config.vobizAuthId && config.vobizAuthToken && config.vobizNumber);
