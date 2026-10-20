import { z } from 'zod';
import { USER_REMINDER_INTERVALS } from '../utils/reminders';
import { createSlot, isRecord, type KeyValueArea } from './area';

// Extension pages forbid eval (CSP `script-src 'self'`): keep zod off its `new Function` fast path.
z.config({ jitless: true });

export const THEME_CHOICES = ['system', 'light', 'dark'] as const;
export const ICON_CORNERS = ['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const;
export const PANEL_STATES = ['collapsed', 'expanded'] as const;
export const REMINDER_INTERVAL_CHOICES = ['org', ...USER_REMINDER_INTERVALS] as const;
export const SNOOZE_MINUTES = { min: 5, max: 120 } as const;

/**
 * The user's own extension settings, synced across their Chrome profiles. Messages are
 * English source strings; the form translates them where they are shown.
 */
export const prefsSchema = z.object({
  showFloatingIcon: z.boolean(),
  iconCorner: z.enum(ICON_CORNERS),
  defaultPanelState: z.enum(PANEL_STATES),
  autoOpenPanel: z.boolean(),
  desktopNotifications: z.boolean(),
  participantTracking: z.boolean(),
  liveTranscript: z.boolean(),
  reminderInterval: z.enum(REMINDER_INTERVAL_CHOICES),
  snoozeMinutes: z
    .number({ error: 'Enter a number of minutes' })
    .int('Use whole minutes')
    .min(SNOOZE_MINUTES.min, 'Snooze for at least 5 minutes')
    .max(SNOOZE_MINUTES.max, 'Snooze for at most 120 minutes'),
  theme: z.enum(THEME_CHOICES),
  captureMicrophone: z.boolean(),
});

export type ExtensionPrefs = z.infer<typeof prefsSchema>;
export type ThemeChoice = ExtensionPrefs['theme'];
export type IconCorner = ExtensionPrefs['iconCorner'];

export const DEFAULT_PREFS: ExtensionPrefs = {
  showFloatingIcon: true,
  iconCorner: 'bottom-left',
  defaultPanelState: 'collapsed',
  autoOpenPanel: false,
  desktopNotifications: true,
  participantTracking: true,
  liveTranscript: true,
  reminderInterval: 'org',
  snoozeMinutes: 15,
  theme: 'system',
  captureMicrophone: false,
};

/** The storage key, exported so `storage.onChanged` listeners can match it. */
export const PREFS_KEY = 'prefs';

/**
 * Stored settings over the defaults, field by field: one invalid or missing field (an older
 * version, a hand edit) falls back alone instead of resetting everything.
 */
export function parsePrefs(raw: unknown): ExtensionPrefs {
  const prefs: Record<string, unknown> = { ...DEFAULT_PREFS };
  if (isRecord(raw)) {
    for (const [key, field] of Object.entries(prefsSchema.shape)) {
      const parsed = field.safeParse(raw[key]);
      if (parsed.success) {
        prefs[key] = parsed.data;
      }
    }
  }
  return prefsSchema.parse(prefs);
}

export interface PrefsStore {
  read(): Promise<ExtensionPrefs>;
  write(prefs: ExtensionPrefs): Promise<void>;
}

export function createPrefsStore(area: KeyValueArea): PrefsStore {
  const slot = createSlot(area, PREFS_KEY, parsePrefs);
  return {
    read: async () => (await slot.read()) ?? DEFAULT_PREFS,
    // Validation runs inside the promise chain, so an invalid value rejects instead of throwing.
    write: (prefs) => Promise.resolve(prefs).then((value) => slot.write(prefsSchema.parse(value))),
  };
}
