import { describe, expect, it } from 'vitest';
import {
  WEEKDAYS,
  chatSettingsSchema,
  toChatSettingsValues,
  type ChatSettingsFormValues,
} from '../../../../../../src/pages/chat/forms/chat-settings';
import { settingsRow } from '../../chat-fixtures';

const VALID: ChatSettingsFormValues = toChatSettingsValues(settingsRow());

/** The first message the schema reports for each field path of `values`, as a form shows it. */
function problems(values: Partial<Record<keyof ChatSettingsFormValues, unknown>>) {
  const parsed = chatSettingsSchema.safeParse({ ...VALID, ...values });
  const first: Record<string, string> = {};
  for (const issue of parsed.error?.issues ?? []) {
    first[issue.path.join('.')] ??= issue.message;
  }
  return first;
}

describe('WEEKDAYS', () => {
  it('starts on Sunday, as the server numbers the days', () => {
    expect(WEEKDAYS).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });
});

describe('toChatSettingsValues', () => {
  it('puts the week in order, Sunday first, without the cache’s type names', () => {
    expect(VALID.weeklyHours.map((day) => day.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(VALID.weeklyHours[0]).toEqual({ day: 0, enabled: false, start: '09:00', end: '18:00' });
  });

  it('copies the agents rather than sharing the cached list', () => {
    const row = settingsRow();
    const values = toChatSettingsValues(row);

    expect(values.agentIds).toEqual(row.agentIds);
    expect(values.agentIds).not.toBe(row.agentIds);
    expect(values).not.toHaveProperty('online');
    expect(values).not.toHaveProperty('knowledgeSyncCount');
  });
});

describe('chatSettingsSchema', () => {
  it('accepts the saved settings as they are', () => {
    expect(chatSettingsSchema.safeParse(VALID).success).toBe(true);
  });

  it('asks for enough words in the bot name and the fixed messages, trimmed', () => {
    expect(problems({ botName: ' A ', welcomeMessage: 'Hi', botModel: 'x' })).toEqual({
      botName: 'Bot name needs at least 2 characters',
      welcomeMessage: 'Welcome message needs at least 5 characters',
      botModel: 'Bot model needs at least 2 characters',
    });
  });

  it('keeps the texts under the server’s limits', () => {
    expect(
      problems({ refusalMessage: 'r'.repeat(501), customInstructions: 'c'.repeat(2001) }),
    ).toEqual({
      refusalMessage: 'Keep refusal message under 500 characters',
      customInstructions: 'Keep custom instructions under 2000 characters',
    });
  });

  it('wants whole numbers inside each range', () => {
    expect(
      problems({
        noReplyTimeoutSeconds: 29,
        maxContextChars: 60001,
        maxUploadMb: 2.5,
        sessionTimeoutMinutes: 'soon',
      }),
    ).toEqual({
      noReplyTimeoutSeconds: 'No-reply timeout must be at least 30',
      maxContextChars: 'Knowledge per question can be at most 60000',
      maxUploadMb: 'Largest upload must be a whole number',
      sessionTimeoutMinutes: 'Session timeout must be a number',
    });
  });

  it('reads numbers typed into the form', () => {
    const parsed = chatSettingsSchema.parse({ ...VALID, maxUploadMb: '7' });
    expect(parsed.maxUploadMb).toBe(7);
  });

  it('needs a timezone from the list', () => {
    expect(problems({ timezone: '' })).toEqual({ timezone: 'Timezone is required' });
    expect(problems({ timezone: 'Mars/Olympus' })).toEqual({
      timezone: 'Choose a timezone from the list',
    });
  });

  it('wants hours for all seven days, each opening and closing at different times', () => {
    expect(problems({ weeklyHours: VALID.weeklyHours.slice(0, 6) })).toEqual({
      weeklyHours: 'Give hours for all seven days',
    });

    const sameTime = VALID.weeklyHours.map((day) =>
      day.day === 2 ? { ...day, end: day.start } : day,
    );
    expect(problems({ weeklyHours: sameTime })).toEqual({
      'weeklyHours.2.end': 'Opening and closing time cannot be the same',
    });
  });

  it('wants each time picked as HH:mm', () => {
    const unpicked = VALID.weeklyHours.map((day) =>
      day.day === 1 ? { ...day, start: '', end: '9am' } : day,
    );
    expect(problems({ weeklyHours: unpicked })).toEqual({
      'weeklyHours.1.start': 'Pick a time',
      'weeklyHours.1.end': 'Pick a time',
    });
  });

  it('takes at most fifty agents, each chosen from the list', () => {
    expect(problems({ agentIds: [''] })).toEqual({ 'agentIds.0': 'Choose agents from the list' });
    const many = Array.from({ length: 51 }, (_, index) => `agent-${index}`);
    expect(problems({ agentIds: many })).toEqual({ agentIds: 'Choose at most 50 agents' });
  });
});
