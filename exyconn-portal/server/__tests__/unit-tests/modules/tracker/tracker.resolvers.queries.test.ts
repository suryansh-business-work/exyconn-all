import { admin, as, billing, FROM, manual, messages, timeLog, TO } from './resolverMocks';
import { ROLES } from '../../../../src/constants/roles';
import { trackerResolvers } from '../../../../src/modules/tracker/tracker.resolvers';
import { getTrackerSettings } from '../../../../src/modules/tracker/tracker.settings.service';
import { codeOf } from '../codeOf';

const Query = trackerResolvers.Query;

describe('portal reads guarded by the TRACKER role', () => {
  it('refuses an employee and an anonymous caller', async () => {
    await expect(codeOf(Query.trackerSettings(null, {}, as(ROLES.EMPLOYEE)))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(Query.trackerAccessList(null, {}, { user: null }))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    expect(getTrackerSettings).not.toHaveBeenCalled();
  });

  it('serializes settings, grants and devices with GraphQL ids', async () => {
    jest.mocked(getTrackerSettings).mockResolvedValue({ _id: 'settings-1' } as never);
    admin.listAccess.mockResolvedValue([{ _id: 'grant-1', userId: 'u1' }]);
    admin.listDevices.mockResolvedValue([{ _id: 'row-1', deviceId: 'laptop-1' }]);

    const settings = await Query.trackerSettings(null, {}, as(ROLES.TRACKER));
    const grants = await Query.trackerAccessList(null, {}, as(ROLES.TRACKER));
    const devices = await Query.trackerDevices(null, { userId: 'u1' }, as(ROLES.ADMIN));

    expect(settings).toMatchObject({ id: 'settings-1' });
    expect(grants).toEqual([{ _id: 'grant-1', id: 'grant-1', userId: 'u1' }]);
    expect(devices).toEqual([{ _id: 'row-1', id: 'row-1', deviceId: 'laptop-1' }]);
    expect(admin.listDevices).toHaveBeenCalledWith('u1');
  });

  it('hands calendar, day, totals and billing to their services', async () => {
    admin.calendar.mockResolvedValue([{ date: '2026-09-04' }]);
    admin.day.mockResolvedValue({
      intervals: [{ _id: 'i1' }],
      screenshots: [{ _id: 's1' }],
      sessions: [{ _id: 'x1' }],
      appUsage: [{ appName: 'Code', durationMs: 5 }],
    });
    admin.totals.mockResolvedValue({ activeMs: 9 });
    billing.billing.mockResolvedValue({ rows: [] });
    const ctx = as(ROLES.TRACKER);

    await expect(
      Query.trackerCalendar(null, { userId: 'u1', from: FROM, to: TO, timezone: 'UTC' }, ctx),
    ).resolves.toEqual([{ date: '2026-09-04' }]);
    await expect(
      Query.trackerDay(null, { userId: 'u1', start: FROM, end: TO }, ctx),
    ).resolves.toEqual({
      intervals: [{ _id: 'i1', id: 'i1' }],
      screenshots: [{ _id: 's1', id: 's1' }],
      sessions: [{ _id: 'x1', id: 'x1' }],
      appUsage: [{ appName: 'Code', durationMs: 5 }],
    });
    await expect(Query.trackerTotals(null, { userId: 'u1' }, ctx)).resolves.toEqual({
      activeMs: 9,
    });
    await expect(Query.trackerBilling(null, { from: FROM, to: TO }, ctx)).resolves.toEqual({
      rows: [],
    });
    expect(admin.calendar).toHaveBeenCalledWith('u1', FROM, TO, 'UTC');
    expect(billing.billing).toHaveBeenCalledWith(FROM, TO);
  });

  it('opens billing by project to Finance and Projects, not to every employee', async () => {
    billing.billingByProject.mockResolvedValue([]);
    const args = { from: FROM, to: TO, projectId: 'p1' };

    await expect(
      codeOf(Query.trackerBillingByProject(null, args, as(ROLES.FINANCE))),
    ).resolves.toBe('OK');
    await expect(
      codeOf(Query.trackerBillingByProject(null, args, as(ROLES.PROJECTS))),
    ).resolves.toBe('OK');
    await expect(
      codeOf(Query.trackerBillingByProject(null, args, as(ROLES.EMPLOYEE))),
    ).resolves.toBe('FORBIDDEN');
    expect(billing.billingByProject).toHaveBeenCalledWith(FROM, TO, 'p1');
  });

  it('lists manual entries, the review queue and the message inbox', async () => {
    manual.list.mockResolvedValue([{ _id: 'm1' }]);
    manual.listPending.mockResolvedValue([{ _id: 'm2' }]);
    messages.threads.mockResolvedValue([{ userId: 'u1' }]);
    messages.thread.mockResolvedValue([{ _id: 'c1' }]);
    const ctx = as(ROLES.TRACKER);

    const entries = await Query.trackerManualEntries(
      null,
      { userId: 'u1', from: FROM, to: TO },
      ctx,
    );
    const pending = await Query.trackerPendingManualEntries(null, {}, ctx);
    const threads = await Query.trackerMessageThreads(null, {}, ctx);
    const thread = await Query.trackerMessageThread(null, { userId: 'u1' }, ctx);

    expect(entries).toEqual([{ _id: 'm1', id: 'm1' }]);
    expect(pending).toEqual([{ _id: 'm2', id: 'm2' }]);
    expect(threads).toEqual([{ userId: 'u1' }]);
    expect(thread).toEqual([{ _id: 'c1', id: 'c1' }]);
    expect(manual.list).toHaveBeenCalledWith('u1', FROM, TO);
    expect(messages.thread).toHaveBeenCalledWith('u1');
  });
});

describe('the project time log', () => {
  const rows = [
    { activeMs: 3, manualMs: 1 },
    { activeMs: 4, manualMs: 2 },
  ];

  it('totals the rows and says whether the caller may open screenshots', async () => {
    timeLog.summary.mockResolvedValue(rows);
    const args = { projectId: 'p1', from: FROM, to: TO };

    const forBoard = await Query.projectTimeLog(null, args, as(ROLES.PROJECTS));
    const forMonitor = await Query.projectTimeLog(null, args, as(ROLES.TRACKER));
    const forAdmin = await Query.projectTimeLog(null, args, as(ROLES.ADMIN));

    expect(forBoard).toEqual({
      rows,
      totalActiveMs: 7,
      totalManualMs: 3,
      canViewScreenshots: false,
    });
    expect(forMonitor.canViewScreenshots).toBe(true);
    expect(forAdmin.canViewScreenshots).toBe(true);
  });

  it('lists sessions to a board role but keeps screenshots to the tracker role', async () => {
    timeLog.sessions.mockResolvedValue([{ id: 's1' }]);
    timeLog.screenshots.mockResolvedValue([{ id: 'shot-1' }]);
    const board = as(ROLES.PROJECTS);
    const sessionArgs = { projectId: 'p1', from: FROM, to: TO, userId: 'u1', taskId: '' };

    await expect(Query.projectTimeLogSessions(null, sessionArgs, board)).resolves.toEqual([
      { id: 's1' },
    ]);
    await expect(
      codeOf(Query.projectTimeLogScreenshots(null, { projectId: 'p1', sessionId: 's1' }, board)),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      Query.projectTimeLogScreenshots(
        null,
        { projectId: 'p1', sessionId: 's1' },
        as(ROLES.TRACKER),
      ),
    ).resolves.toEqual([{ id: 'shot-1' }]);
    expect(timeLog.sessions).toHaveBeenCalledWith('p1', FROM, TO, 'u1', '');
    expect(timeLog.screenshots).toHaveBeenCalledTimes(1);
  });
});
