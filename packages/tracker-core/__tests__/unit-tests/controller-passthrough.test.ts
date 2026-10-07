import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DayDetail,
  ManualEntry,
  ManualEntryDraft,
  TrackerMessage,
  TrackerTotals,
} from '../../src/types';
import { signedIn } from './controller-fixture';

const DRAFT: ManualEntryDraft = {
  projectId: 'global',
  taskId: '',
  startedAt: '2026-02-03T08:00:00.000Z',
  endedAt: '2026-02-03T09:00:00.000Z',
  note: 'Workshop',
};

describe('TrackerController portal reads and writes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hands the employee’s own figures straight through', async () => {
    const setup = await signedIn();
    const totals: TrackerTotals = { activeMs: 1, idleMs: 2, screenshots: 3, sessions: 4 };
    const day: DayDetail = {
      activeMs: 5,
      idleMs: 0,
      keyCount: 0,
      mouseCount: 0,
      sessions: 1,
      screenshots: [],
      intervals: [],
    };
    vi.mocked(setup.portal.fetchMyTotals).mockResolvedValue(totals);
    vi.mocked(setup.portal.fetchMyDay).mockResolvedValue(day);
    vi.mocked(setup.portal.fetchTasks).mockResolvedValue([]);

    await expect(setup.controller.getTotals()).resolves.toBe(totals);
    await expect(setup.controller.getDay('a', 'b')).resolves.toBe(day);
    await expect(setup.controller.getTasks('p2')).resolves.toEqual([]);
    expect(setup.portal.fetchMyDay).toHaveBeenCalledWith('a', 'b');
    expect(setup.portal.fetchTasks).toHaveBeenLastCalledWith('p2');
    // Browsing tickets for a claim must not re-point the session picker.
    expect(setup.controller.getState().selectedProjectId).toBe('global');
  });

  it('passes the catalogue requests through for the UI to own', async () => {
    const setup = await signedIn();
    vi.mocked(setup.portal.fetchTranslations).mockResolvedValue({ Hello: 'Namaste' });
    vi.mocked(setup.portal.translateMissing).mockResolvedValue({ Bye: 'Alvida' });

    await expect(setup.controller.getTranslations('hi')).resolves.toEqual({ Hello: 'Namaste' });
    await expect(setup.controller.translateMissing('hi', ['Bye'])).resolves.toEqual({
      Bye: 'Alvida',
    });
    await expect(setup.controller.getTimezones()).resolves.toEqual(['UTC']);
    expect(setup.portal.translateMissing).toHaveBeenCalledWith('hi', ['Bye']);
  });

  it('records consent and re-reads the portal rather than assuming it landed', async () => {
    const setup = await signedIn({ consentRequired: true });
    const reads = vi.mocked(setup.portal.trackerMe).mock.calls.length;

    await setup.controller.acceptConsent('Asha Rao');

    expect(setup.portal.acceptConsent).toHaveBeenCalledWith('Asha Rao');
    expect(setup.portal.trackerMe).toHaveBeenCalledTimes(reads + 1);
  });

  it('files, lists and withdraws off-computer claims', async () => {
    const setup = await signedIn();
    const entry: ManualEntry = {
      id: 'm1',
      projectName: 'Global Project',
      taskKey: '',
      taskTitle: '',
      startedAt: DRAFT.startedAt,
      endedAt: DRAFT.endedAt,
      durationMs: 3_600_000,
      note: DRAFT.note,
      status: 'PENDING',
      reviewNote: '',
    };
    vi.mocked(setup.portal.createManualEntry).mockResolvedValue(entry);
    vi.mocked(setup.portal.fetchManualEntries).mockResolvedValue([entry]);

    await expect(setup.controller.createManualEntry(DRAFT)).resolves.toBe(entry);
    await expect(setup.controller.getManualEntries('a', 'b')).resolves.toEqual([entry]);
    await setup.controller.withdrawManualEntry('m1');

    expect(setup.portal.createManualEntry).toHaveBeenCalledWith(DRAFT);
    expect(setup.portal.fetchManualEntries).toHaveBeenCalledWith('a', 'b');
    expect(setup.portal.withdrawManualEntry).toHaveBeenCalledWith('m1');
  });

  it('reads and posts on the employee’s own thread', async () => {
    const setup = await signedIn();
    const line: TrackerMessage = {
      id: 'c1',
      kind: 'CHAT',
      direction: 'TO_ADMIN',
      title: '',
      body: 'Hi',
      authorName: 'Asha Rao',
      readAt: null,
      createdAt: '2026-02-03T10:00:00.000Z',
    };
    vi.mocked(setup.portal.sendMessage).mockResolvedValue(line);
    vi.mocked(setup.portal.fetchMessages).mockResolvedValue([line]);

    await expect(setup.controller.sendMessage('Hi')).resolves.toBe(line);
    await expect(setup.controller.getMessages('CHAT')).resolves.toEqual([line]);
    expect(setup.portal.fetchMessages).toHaveBeenCalledWith('CHAT');
  });

  it('re-reads OS grants and asks for one on request', async () => {
    const setup = await signedIn();

    expect(setup.controller.refreshPermissions()).toEqual({ camera: false });
    await setup.controller.requestPermission('screen');

    expect(setup.deps.permissions.request).toHaveBeenCalledWith('screen');
  });

  it('saves this install’s preferences and re-renders with them', async () => {
    const setup = await signedIn();

    expect(setup.controller.setPreferences({ theme: 'dark' })).toEqual({ theme: 'dark' });
    expect(setup.latest().preferences).toEqual({ theme: 'dark' });
  });
});
