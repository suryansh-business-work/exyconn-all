import { ChatFaqModel, ChatSettingsModel } from './models';
import { isWithinHours } from './chat.hours';
import { chatHub } from './chat.hub';
import { parseInput, settingsSchema } from './chat.validation';

/**
 * The chat's settings in the company in scope, created with their defaults the first time
 * anything asks — so a fresh install has a working chat before anyone opens the settings.
 */
export async function readChatSettings() {
  return ChatSettingsModel.findOneAndUpdate(
    {},
    { $setOnInsert: { enabled: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

/** The settings with whether the team is on duty right now, for the console. */
export async function chatSettingsView() {
  const settings = await readChatSettings();
  return { ...settings, online: isWithinHours(settings) };
}

/** What a widget needs before anyone signs in: the copy, the hours and the FAQs. */
export async function widgetConfig() {
  const [settings, faqs] = await Promise.all([
    readChatSettings(),
    ChatFaqModel.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select('question answer')
      .limit(100)
      .lean(),
  ]);
  return {
    enabled: settings.enabled,
    botName: settings.botName,
    welcomeMessage: settings.welcomeMessage,
    offlineMessage: settings.offlineMessage,
    online: isWithinHours(settings),
    timezone: settings.timezone,
    weeklyHours: settings.weeklyHours.map(({ day, enabled, start, end }) => ({
      day,
      enabled,
      start,
      end,
    })),
    allowUploads: settings.allowUploads,
    maxUploadMb: settings.maxUploadMb,
    soundEnabledByDefault: settings.soundEnabledByDefault,
    faqs: faqs.map((faq) => ({ id: String(faq._id), question: faq.question, answer: faq.answer })),
  };
}

/** Pushes the current widget config to every open widget (after settings or FAQs change). */
export async function announceWidgetConfig(): Promise<void> {
  chatHub.toAllVisitors({ t: 'config', config: await widgetConfig() });
}

/** Saves Website > Chatbot > Settings and tells every open widget at once. */
export async function updateChatSettings(input: unknown) {
  const values = parseInput(settingsSchema, input);
  await ChatSettingsModel.findOneAndUpdate(
    {},
    { $set: values },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  await announceWidgetConfig();
  return chatSettingsView();
}
