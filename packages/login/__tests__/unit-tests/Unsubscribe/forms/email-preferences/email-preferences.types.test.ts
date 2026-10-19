import {
  emailPreferencesSchema,
  optedOutIds,
  toValues,
  type EmailPreferences,
} from '../../../../../src/Unsubscribe/forms/email-preferences';

const preferences = (patch: Partial<EmailPreferences> = {}): EmailPreferences => ({
  email: 'asha@example.com',
  preview: false,
  unsubscribedAll: false,
  categories: [
    { id: 'news', name: 'Newsletter', description: '', subscribed: true },
    { id: 'offers', name: 'Offers', description: 'Deals', subscribed: false },
  ],
  ...patch,
});

describe('email preferences values', () => {
  it('maps each category to its subscribed flag, keyed by id', () => {
    expect(toValues(preferences())).toEqual({
      subscribed: { news: true, offers: false },
      unsubscribeAll: false,
    });
  });

  it('carries an existing unsubscribe-all and handles no categories', () => {
    expect(toValues(preferences({ categories: [], unsubscribedAll: true }))).toEqual({
      subscribed: {},
      unsubscribeAll: true,
    });
  });

  it('sends only the categories switched off', () => {
    expect(
      optedOutIds({
        subscribed: { news: true, offers: false, tips: false },
        unsubscribeAll: false,
      }),
    ).toEqual(['offers', 'tips']);
    expect(optedOutIds({ subscribed: {}, unsubscribeAll: true })).toEqual([]);
  });

  it('accepts booleans only', () => {
    expect(emailPreferencesSchema.safeParse(toValues(preferences())).success).toBe(true);
    expect(
      emailPreferencesSchema.safeParse({ subscribed: { news: 'yes' }, unsubscribeAll: false })
        .success,
    ).toBe(false);
    expect(emailPreferencesSchema.safeParse({ subscribed: {} }).success).toBe(false);
  });
});
