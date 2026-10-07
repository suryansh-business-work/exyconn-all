import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  ingestLogBatch,
  recordServerErrors,
  resetLogIngestLimits,
  type LogBatchInput,
  type LogEntryInput,
} from '../../../../src/modules/logs/logs.ingest';
import { AppLogGroupModel } from '../../../../src/modules/logs/app-log-group.model';
import { AppLogEventModel } from '../../../../src/modules/logs/app-log-event.model';
import { FIELD_LIMITS, MAX_BREADCRUMBS } from '../../../../src/modules/logs/logs.constants';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';

const entry = (overrides: Partial<LogEntryInput> = {}): LogEntryInput => ({
  level: 'ERROR',
  message: 'Sync failed',
  occurredAt: new Date('2026-09-11T10:00:00Z'),
  ...overrides,
});

const batch = (
  entries: LogEntryInput[],
  overrides: Partial<LogBatchInput> = {},
): LogBatchInput => ({
  source: 'DESKTOP',
  app: 'tracker-desktop',
  entries,
  ...overrides,
});

const crumb = (index: number) => ({
  at: new Date('2026-09-11T09:00:00Z'),
  level: 'INFO' as const,
  message: `crumb ${index}`,
});

beforeEach(() => resetLogIngestLimits());

describe('cleaning an entry', () => {
  it('names an empty message and stores absent device fields as empty text', async () => {
    await ingestLogBatch(batch([entry({ message: '   ', errorName: null })]), { user: null });

    const group = await AppLogGroupModel.findOne().lean();
    const event = await AppLogEventModel.findOne().lean();
    expect(group).toMatchObject({ message: '(no message)', errorName: '', count: 1, platform: '' });
    expect(event).toMatchObject({
      platform: '',
      osVersion: '',
      deviceModel: '',
      deviceId: '',
      sessionId: '',
      userAgent: '',
      ip: '',
      userId: '',
      userVerified: false,
    });
  });

  it('keeps a folded count between one and a hundred thousand', async () => {
    await ingestLogBatch(
      batch([entry({ count: 0 }), entry({ count: 5_000_000 }), entry({ count: -4 })]),
      { user: null, ip: '10.0.0.2' },
    );

    const counts = (await AppLogEventModel.find().sort({ _id: 1 }).lean()).map((row) => row.count);
    expect(counts).toEqual([1, 100_000, 1]);
    expect((await AppLogGroupModel.findOne().lean())?.count).toBe(100_002);
  });

  it('cuts long text and keeps only the latest breadcrumbs', async () => {
    const breadcrumbs = Array.from({ length: MAX_BREADCRUMBS + 5 }, (_, index) => crumb(index));
    breadcrumbs[breadcrumbs.length - 1].message = 'y'.repeat(FIELD_LIMITS.breadcrumb + 50);

    await ingestLogBatch(
      batch([entry({ message: 'm'.repeat(FIELD_LIMITS.message + 10), breadcrumbs })], {
        app: `  ${'a'.repeat(FIELD_LIMITS.short + 10)}  `,
      }),
      { user: null, ip: '10.0.0.3' },
    );

    const group = await AppLogGroupModel.findOne().lean();
    const event = await AppLogEventModel.findOne().lean();
    expect(group?.message).toHaveLength(FIELD_LIMITS.message);
    expect(group?.app).toHaveLength(FIELD_LIMITS.short);
    expect(event?.breadcrumbs).toHaveLength(MAX_BREADCRUMBS);
    expect(event?.breadcrumbs[0].message).toBe('crumb 5');
    expect(event?.breadcrumbs[MAX_BREADCRUMBS - 1].message).toHaveLength(FIELD_LIMITS.breadcrumb);
  });
});

describe('who sent it', () => {
  it('trusts a session whose id is not an account id, keeping the token’s email', async () => {
    const user = { id: 'api-key-7', roles: [ROLES.TECH], email: 'bot@exyconn.com' };

    await ingestLogBatch(batch([entry()]), { user, userAgent: 'curl/8' });

    const event = await AppLogEventModel.findOne().lean();
    expect(event).toMatchObject({
      userId: 'api-key-7',
      userName: '',
      userEmail: 'bot@exyconn.com',
      userVerified: true,
      userAgent: 'curl/8',
    });
  });

  it('falls back to the token when the account has been deleted', async () => {
    const id = String(new Types.ObjectId());

    await ingestLogBatch(batch([entry()]), {
      user: { id, roles: [ROLES.EMPLOYEE], email: 'gone@exyconn.com' },
    });

    expect(await AppLogEventModel.findOne().lean()).toMatchObject({
      userId: id,
      userName: '',
      userEmail: 'gone@exyconn.com',
    });
  });

  it('reads the name from the account and ignores what the client claims', async () => {
    const account = await seedUser(`${randomUUID()}@exyconn.com`, randomUUID(), [ROLES.EMPLOYEE]);

    await ingestLogBatch(
      batch([entry()], { user: { id: 'someone-else', name: 'Mallory', email: 'm@evil.test' } }),
      { user: { id: account.id, roles: [ROLES.EMPLOYEE], email: account.email } },
    );

    expect(await AppLogEventModel.findOne().lean()).toMatchObject({
      userId: account.id,
      userName: account.name,
      userVerified: true,
    });
  });

  it('stores nobody when the client claims a user without an id', async () => {
    await ingestLogBatch(batch([entry()], { user: { id: '', name: 'Nobody', email: '' } }), {
      user: null,
    });

    const group = await AppLogGroupModel.findOne().lean();
    expect(await AppLogEventModel.findOne().lean()).toMatchObject({ userId: '', userName: '' });
    expect(group).toMatchObject({ userCount: 0, lastUserName: '' });
  });

  it('counts the same person once however often they hit it', async () => {
    const claimed = { id: 'device-user', name: ' Asha ', email: ' asha@exyconn.com ' };

    await ingestLogBatch(batch([entry(), entry()], { user: claimed }), { user: null });

    const group = await AppLogGroupModel.findOne().lean();
    expect(group).toMatchObject({ count: 2, userCount: 1, lastUserName: 'Asha' });
    expect(group?.lastUserEmail).toBe('asha@exyconn.com');
  });
});

describe('recordServerErrors', () => {
  it('stores the API’s own errors under the server source', async () => {
    await recordServerErrors([entry({ route: 'listBugs' })], { user: null, ip: '10.0.0.8' });

    const group = await AppLogGroupModel.findOne().lean();
    expect(group).toMatchObject({ source: 'SERVER', app: 'portal-server', route: 'listBugs' });
    expect(group?.platform.startsWith('node ')).toBe(true);
    expect((await AppLogEventModel.findOne().lean())?.ip).toBe('10.0.0.8');
  });

  it('writes nothing for an empty list', async () => {
    await recordServerErrors([], { user: null });

    expect(await AppLogGroupModel.countDocuments()).toBe(0);
  });
});
