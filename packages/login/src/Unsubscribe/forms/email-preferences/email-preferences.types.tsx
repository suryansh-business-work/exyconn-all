import { z } from 'zod';
import type { PublicEmailPreferencesFieldsFragment } from '@exyconn/shell/graphql/generated';

export type EmailPreferences = PublicEmailPreferencesFieldsFragment;

/** Each category's on/off, keyed by category id, plus the all-marketing switch. */
export const emailPreferencesSchema = z.object({
  subscribed: z.record(z.string(), z.boolean()),
  unsubscribeAll: z.boolean(),
});

export type EmailPreferencesValues = z.infer<typeof emailPreferencesSchema>;

export const toValues = (preferences: EmailPreferences): EmailPreferencesValues => ({
  subscribed: Object.fromEntries(
    preferences.categories.map((category) => [category.id, category.subscribed]),
  ),
  unsubscribeAll: preferences.unsubscribedAll,
});

/** What the API stores: the categories turned OFF. */
export const optedOutIds = (values: EmailPreferencesValues): string[] =>
  Object.entries(values.subscribed)
    .filter(([, on]) => !on)
    .map(([id]) => id);
