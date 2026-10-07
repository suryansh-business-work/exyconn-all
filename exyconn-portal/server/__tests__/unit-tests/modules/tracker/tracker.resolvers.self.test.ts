import {
  admin,
  as,
  device,
  FROM,
  manual,
  ME,
  messages,
  signInAsTheEmployee,
  TO,
  workday,
} from './resolverMocks';
import { ROLES } from '../../../../src/constants/roles';
import { trackerResolvers } from '../../../../src/modules/tracker/tracker.resolvers';
import { assertEmployee, assertTrackerDevice } from '../../../../src/modules/tracker/tracker.auth';
import { githubActions } from '../../../../src/utils/github';
import { codeOf } from '../codeOf';

const Query = trackerResolvers.Query;
const employee = as(ROLES.EMPLOYEE);

/** The payload `trackerDeviceService.me` answers with, as lean documents. */
const deviceState = {
  user: { _id: ME, name: 'Asha' },
  consentRequired: false,
  settings: { _id: 'settings-1', intervalMinutes: 10 },
  timezone: 'Asia/Kolkata',
  locale: 'en',
  workProfile: { workHoursPerDay: 8 },
  workday: { date: '2026-09-04' },
  projects: [{ id: 'p1', name: 'Global Project', key: 'GLBL' }],
  consentPolicy: null,
  presence: { status: 'WORKING', note: '', since: null },
  notices: [{ _id: 'n1', title: 'Holiday' }],
  unreadMessages: 2,
};

beforeEach(() => {
  signInAsTheEmployee();
});

describe('the desktop app rehydrating its session', () => {
  it('answers the device token’s own state with GraphQL ids', async () => {
    device.me.mockResolvedValue(deviceState);

    const me = await Query.trackerMe(null, {}, { user: null });

    expect(device.me).toHaveBeenCalledWith(ME, 'laptop-1');
    expect(me).toEqual({
      ...deviceState,
      user: { _id: ME, id: ME, name: 'Asha' },
      settings: { _id: 'settings-1', id: 'settings-1', intervalMinutes: 10 },
      notices: [{ _id: 'n1', id: 'n1', title: 'Holiday' }],
    });
  });

  it('answers the device’s own all-time totals', async () => {
    admin.totals.mockResolvedValue({ activeMs: 42 });

    await expect(Query.myTrackerTotals(null, {}, { user: null })).resolves.toEqual({
      activeMs: 42,
    });
    expect(admin.totals).toHaveBeenCalledWith(ME);
  });

  it('refuses when the device guard does', async () => {
    jest.mocked(assertTrackerDevice).mockRejectedValue(new Error('This device has been revoked.'));

    await expect(Query.trackerMe(null, {}, { user: null })).rejects.toThrow('revoked');
    expect(device.me).not.toHaveBeenCalled();
  });
});

describe('an employee reading their own tracker', () => {
  it('finds their own grant among all of them, or answers null', async () => {
    admin.listAccess.mockResolvedValue([
      { _id: 'g1', userId: 'someone-else' },
      { _id: 'g2', userId: ME },
    ]);

    await expect(Query.myTrackerAccess(null, {}, employee)).resolves.toEqual({
      _id: 'g2',
      id: 'g2',
      userId: ME,
    });
    admin.listAccess.mockResolvedValue([{ _id: 'g1', userId: 'someone-else' }]);
    await expect(Query.myTrackerAccess(null, {}, employee)).resolves.toBeNull();
  });

  it('reads the calendar and the day for the signed-in user, never another', async () => {
    admin.calendar.mockResolvedValue([]);
    admin.day.mockResolvedValue({ intervals: [], screenshots: [], sessions: [], appUsage: [] });

    await Query.myTrackerCalendar(null, { from: FROM, to: TO, timezone: 'UTC' }, employee);
    const day = await Query.myTrackerDay(null, { start: FROM, end: TO }, employee);

    expect(admin.calendar).toHaveBeenCalledWith(ME, FROM, TO, 'UTC');
    expect(admin.day).toHaveBeenCalledWith(ME, FROM, TO);
    expect(day).toEqual({ intervals: [], screenshots: [], sessions: [], appUsage: [] });
  });

  it('refuses an anonymous caller', async () => {
    await expect(
      codeOf(Query.myTrackerDay(null, { start: FROM, end: TO }, { user: null })),
    ).resolves.toBe('UNAUTHENTICATED');
    expect(() => Query.trackerTimezones(null, {}, { user: null })).toThrow();
  });

  it('offers the zones, projects and tickets the pickers need', async () => {
    workday.projects.mockResolvedValue([{ id: 'p1' }]);
    workday.tasksFor.mockResolvedValue([{ id: 't1' }]);

    expect(Query.trackerTimezones(null, {}, employee)).toContain('UTC');
    await expect(Query.trackerProjectOptions(null, {}, employee)).resolves.toEqual([{ id: 'p1' }]);
    await expect(Query.trackerTaskOptions(null, { projectId: 'p1' }, employee)).resolves.toEqual([
      { id: 't1' },
    ]);
    // A board can hold thousands of tickets; the desktop menu offers at most a hundred.
    expect(workday.tasksFor).toHaveBeenCalledWith(ME, 'p1', 100);
  });

  it('asks GitHub for the installer of the platform the app runs on', async () => {
    jest.mocked(githubActions.latestTrackerRelease).mockResolvedValue(null);

    await expect(
      Query.trackerLatestRelease(null, { platform: 'android' }, employee),
    ).resolves.toBeNull();
    expect(githubActions.latestTrackerRelease).toHaveBeenCalledWith('android');
    await expect(
      codeOf(Query.trackerLatestRelease(null, { platform: null }, { user: null })),
    ).resolves.toBe('UNAUTHENTICATED');
  });

  it('lists their own manual entries and messages, chat by default', async () => {
    manual.list.mockResolvedValue([{ _id: 'm1' }]);
    messages.thread.mockResolvedValue([{ _id: 'c1' }]);

    const entries = await Query.myTrackerManualEntries(null, { from: FROM, to: TO }, employee);
    const chat = await Query.myTrackerMessages(null, {}, employee);
    await Query.myTrackerMessages(null, { kind: 'NOTICE' }, employee);

    expect(assertEmployee).toHaveBeenCalledWith(employee);
    expect(manual.list).toHaveBeenCalledWith(ME, FROM, TO);
    expect(entries).toEqual([{ _id: 'm1', id: 'm1' }]);
    expect(chat).toEqual([{ _id: 'c1', id: 'c1' }]);
    expect(messages.thread).toHaveBeenNthCalledWith(1, ME, 'CHAT');
    expect(messages.thread).toHaveBeenNthCalledWith(2, ME, 'NOTICE');
  });
});
