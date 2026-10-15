/**
 * The example calls a visitor can pick on the demo (a clinic booking, a loan EMI reminder…),
 * edited in Tech > Demos > Calling bot > Examples. A picked example replaces the active
 * config's prompt and greeting for that call, and its language when it names one; the keys,
 * voice and limits stay the config's.
 */
export const CALLING_BOT_SCENARIO_MODEL = 'CallingBotScenario';

export const CALLING_BOT_SCENARIO_FIELDS = {
  /** A seeded example's stable name, so a release adds new ones without touching edited ones. */
  key: { type: String, default: '', trim: true },
  title: { type: String, required: true, trim: true },
  /** One line for the visitor: who the bot is and what to try. */
  description: { type: String, required: true, trim: true },
  /** Who the bot is on this call: the system prompt. */
  systemPrompt: { type: String, required: true, trim: true },
  /** The first thing the bot says. */
  greeting: { type: String, required: true, trim: true },
  /** e.g. hi-IN; empty keeps the active config's language. */
  languageCode: { type: String, default: '', trim: true },
  /** Only enabled examples are offered on the demo. */
  enabled: { type: Boolean, required: true, default: true },
  /** Where it sits in the demo's list, smallest first. */
  order: { type: Number, required: true, default: 0 },
};

/** One example as stored. */
export interface CallingBotScenarioRecord {
  _id: unknown;
  key: string;
  title: string;
  description: string;
  systemPrompt: string;
  greeting: string;
  languageCode: string;
  enabled: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/** What an example changes on the config a call runs on. */
export type ScenarioPersona = Pick<
  CallingBotScenarioRecord,
  'systemPrompt' | 'greeting' | 'languageCode'
>;

/** The config a call runs on once its example, if any, has set who the bot is. */
export function withScenario<T extends ScenarioPersona>(
  config: T,
  scenario: ScenarioPersona | null,
): T {
  if (!scenario) {
    return config;
  }
  return {
    ...config,
    systemPrompt: scenario.systemPrompt,
    greeting: scenario.greeting,
    languageCode: scenario.languageCode || config.languageCode,
  };
}
