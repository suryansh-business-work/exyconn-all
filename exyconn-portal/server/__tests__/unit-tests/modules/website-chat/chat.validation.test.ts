import {
  helloSchema,
  identitySchema,
  parseInput,
  settingsSchema,
  staffFrameSchema,
  visitorFrameSchema,
} from '../../../../src/modules/website-chat/chat.validation';
import { codeOf } from '../codeOf';
import { CHAT_AGENT_ID, validSettings } from './chat.fixtures';

const SESSION = CHAT_AGENT_ID;

const identity = (overrides: Record<string, unknown> = {}) => ({
  name: ' Dana Reyes ',
  email: ' Dana@Acme.TEST ',
  site: 'WEBSITE',
  ...overrides,
});

const parse = (schema: Parameters<typeof parseInput>[0], value: unknown) =>
  codeOf(Promise.resolve().then(() => parseInput(schema, value)));

describe('identitySchema', () => {
  it('trims the name, lower-cases the email and defaults phone and page', () => {
    expect(parseInput(identitySchema, identity())).toEqual({
      name: 'Dana Reyes',
      email: 'dana@acme.test',
      phone: '',
      pageUrl: '',
      site: 'WEBSITE',
    });
    expect(parseInput(identitySchema, identity({ phone: '+1 555 0100' })).phone).toBe(
      '+1 555 0100',
    );
  });

  it('refuses a name carrying a link or an address, with words the visitor can act on', () => {
    for (const name of ['dana@acme.test', 'www.spam', 'Visit spam.com', 'a/b']) {
      expect(() => parseInput(identitySchema, identity({ name }))).toThrow(
        'Enter your name without links or email addresses.',
      );
    }
  });

  it('refuses a missing or overlong name, a bad email and a bad phone', () => {
    expect(() => parseInput(identitySchema, identity({ name: '  ' }))).toThrow('Enter your name.');
    expect(() => parseInput(identitySchema, identity({ name: 'n'.repeat(121) }))).toThrow(
      'Keep your name shorter.',
    );
    expect(() => parseInput(identitySchema, identity({ email: 'nope' }))).toThrow(
      'Enter a valid email address.',
    );
    expect(() => parseInput(identitySchema, identity({ phone: 'call me' }))).toThrow(
      'Enter a valid phone number.',
    );
  });
});

describe('helloSchema', () => {
  it('tells a visitor from a staff console', () => {
    expect(parseInput(helloSchema, { t: 'hello', role: 'visitor', site: 'TOOLS' })).toEqual({
      t: 'hello',
      role: 'visitor',
      site: 'TOOLS',
    });
    expect(parseInput(helloSchema, { t: 'hello', role: 'staff', token: 'jwt' }).role).toBe('staff');
  });

  it('refuses a staff hello without a token and an unknown role', async () => {
    expect(await parse(helloSchema, { t: 'hello', role: 'staff', token: '' })).toBe(
      'BAD_USER_INPUT',
    );
    expect(await parse(helloSchema, { t: 'hello', role: 'admin' })).toBe('BAD_USER_INPUT');
  });
});

describe('visitorFrameSchema', () => {
  it('accepts a code request and a six-digit code', () => {
    const base = { name: 'Dana', email: 'dana@acme.test' };
    expect(parseInput(visitorFrameSchema, { t: 'requestCode', ...base }).t).toBe('requestCode');
    const verify = parseInput(visitorFrameSchema, { t: 'verifyCode', ...base, code: ' 123456 ' });
    expect(verify).toMatchObject({ t: 'verifyCode', code: '123456' });
    expect(() =>
      parseInput(visitorFrameSchema, { t: 'verifyCode', ...base, code: '12ab56' }),
    ).toThrow('Enter the 6-digit code from the email.');
  });

  it('defaults a message to no files and caps its length and file count', () => {
    const send = { t: 'send', clientId: 'c1', channel: 'LIVE', body: ' hi ' };
    expect(parseInput(visitorFrameSchema, send)).toEqual({ ...send, body: 'hi', files: [] });
    expect(() => parseInput(visitorFrameSchema, { ...send, body: 'x'.repeat(2001) })).toThrow(
      'Keep the message under 2000 characters.',
    );
    const file = { name: 'a.png', data: 'data:image/png;base64,AAAA' };
    expect(() =>
      parseInput(visitorFrameSchema, { ...send, files: [file, file, file, file, file] }),
    ).toThrow('Send at most four files at a time.');
  });

  it('checks the rated message is an id', async () => {
    const feedback = { t: 'feedback', messageId: SESSION, helpful: true };
    expect(parseInput(visitorFrameSchema, feedback)).toEqual(feedback);
    expect(() => parseInput(visitorFrameSchema, { ...feedback, messageId: 'x' })).toThrow(
      'Unknown message.',
    );
    expect(await parse(visitorFrameSchema, { t: 'shout' })).toBe('BAD_USER_INPUT');
  });
});

describe('staffFrameSchema', () => {
  it('lets a console stop watching and refuses an unknown session', () => {
    expect(parseInput(staffFrameSchema, { t: 'watch', sessionId: null })).toEqual({
      t: 'watch',
      sessionId: null,
    });
    expect(() => parseInput(staffFrameSchema, { t: 'read', sessionId: 'nope' })).toThrow(
      'Unknown chat.',
    );
  });
});

describe('settingsSchema', () => {
  it('accepts valid settings', () => {
    expect(parseInput(settingsSchema, validSettings())).toEqual(validSettings());
  });

  it('refuses a bad timezone, bad hours, a missing day and a repeated one', () => {
    const settings = validSettings();
    const hours = settings.weeklyHours;
    const check = (patch: Record<string, unknown>) => () =>
      parseInput(settingsSchema, { ...settings, ...patch });
    expect(check({ timezone: 'Mars/Base' })).toThrow('Choose a valid timezone.');
    expect(check({ weeklyHours: [{ ...hours[0], start: '24:00' }, ...hours.slice(1)] })).toThrow(
      'Use 24-hour HH:mm.',
    );
    expect(check({ weeklyHours: [{ ...hours[0], end: '09:00' }, ...hours.slice(1)] })).toThrow(
      'Opening and closing time cannot be the same.',
    );
    expect(check({ weeklyHours: hours.slice(1) })).toThrow('Give hours for all seven days.');
    expect(check({ weeklyHours: [hours[1], ...hours.slice(1)] })).toThrow('Each day appears once.');
    expect(check({ agentIds: ['not-an-id'] })).toThrow('Choose agents from the list.');
    expect(check({ maxUploadMb: 11 })).toThrow();
  });
});
