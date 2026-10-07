import { CHAT_AGENT_ID } from './chat.fixtures';

/**
 * What the visitor socket tests stand in for the chat's services. Each suite declares the
 * jest.mock calls itself (they are hoisted per file); this holds the shared values.
 */
export const VISITOR_SESSION = CHAT_AGENT_ID;

export const openSession = (fields: Record<string, unknown> = {}) => ({
  _id: VISITOR_SESSION,
  name: 'Dana',
  status: 'OPEN',
  slackChannel: 'D1',
  slackThreadTs: '9.9',
  ...fields,
});

const day = (enabled: boolean) => (d: number) => ({
  day: d,
  enabled,
  start: '00:00',
  end: '00:00',
});

/** Settings whose hours are always on duty, or never. */
export const settingsFor = (online: boolean, fields: Record<string, unknown> = {}) => ({
  timezone: 'UTC',
  weeklyHours: [0, 1, 2, 3, 4, 5, 6].map(day(online)),
  allowUploads: true,
  maxUploadMb: 10,
  offlineMessage: 'We are away.',
  ...fields,
});

export const signedInResult = (token = 'pass-2') => ({
  token,
  session: { id: VISITOR_SESSION, name: 'Dana' },
  messages: [],
});
