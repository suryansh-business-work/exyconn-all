import { describe, expect, it } from 'vitest';
import {
  assertCapturable,
  captureBlocker,
  captureExpired,
  uploadFailureMessage,
} from '../../../src/background/logic/capture-rules';
import {
  EVENT_FLUSH_INTERVAL_MS,
  applyReport,
  readyToFinalize,
  resumeSession,
  shouldFlushEvents,
} from '../../../src/background/logic/report';
import { toTabSnapshot } from '../../../src/background/logic/snapshot';
import { newTabSession, type TabSession } from '../../../src/storage/session-registry';
import type { MeetReport, OrgContext } from '../../../src/types/messages';

const AT = '2026-10-20T10:00:00.000Z';
const CODE = 'abc-defg-hij';
const fresh = (tabId = 1): TabSession =>
  newTabSession(tabId, `key-${tabId}`, { meetingCode: CODE, url: 'u', title: 't' });
const live = (overrides: Partial<TabSession> = {}): TabSession => ({
  ...fresh(),
  meetingId: 'm1',
  meetingStartedAt: AT,
  meetingState: 'IN_MEETING',
  ...overrides,
});
const report = (overrides: Partial<MeetReport> = {}): MeetReport => ({
  meetingCode: CODE,
  url: 'u2',
  title: 'Sync',
  meetingState: 'IN_MEETING',
  transcriptionState: 'OFF',
  participants: [],
  participantsComplete: false,
  ...overrides,
});
const org: OrgContext = {
  userId: 'u',
  name: 'Asha',
  email: 'a@x.test',
  organizationName: 'Acme',
  enabled: true,
  remindersEnabled: true,
  reminderIntervalMinutes: 2,
  maxRemindersPerMeeting: 3,
  participantTracking: true,
  liveTranscript: true,
  maxMeetingMinutes: 60,
  portalUrl: 'https://employee.test',
  saveRecordings: false,
};

describe('applyReport', () => {
  it('asks for a server session once the call is live', () => {
    const result = applyReport({ ...fresh(), meetingState: 'JOINING' }, report(), AT);
    expect(result.needsServerSession).toBe(true);
    expect(result.session).toMatchObject({
      meetingState: 'IN_MEETING',
      transcriptionState: 'OFF',
      title: 'Sync',
      url: 'u2',
    });
  });

  it('does not reopen an existing server session', () => {
    expect(applyReport(live(), report(), AT).needsServerSession).toBe(false);
  });

  it('queues participant events only while in the call with a server session', () => {
    const people = [{ key: 'ravi', displayName: 'Ravi', isSelf: false }];
    const inCall = applyReport(
      live(),
      report({ participants: people, participantsComplete: true }),
      AT,
    );
    expect(inCall.session.pendingEvents).toEqual([{ ...people[0], event: 'JOINED', at: AT }]);
    expect(inCall.session.roster).toEqual(people);
    const before = applyReport(
      { ...fresh(), meetingState: 'JOINING' },
      report({ participants: people }),
      AT,
    );
    expect(before.session.pendingEvents).toEqual([]);
  });

  it('reports departures against the existing roster', () => {
    const ravi = { key: 'ravi', displayName: 'Ravi', isSelf: false };
    const result = applyReport(
      live({ roster: [ravi] }),
      report({ participantsComplete: true }),
      AT,
    );
    expect(result.session.pendingEvents).toEqual([{ ...ravi, event: 'LEFT', at: AT }]);
    expect(result.session.roster).toEqual([]);
  });

  it('flags the end once, and forgets transcription state outside the call', () => {
    const ended = applyReport(live(), report({ meetingState: 'ENDED' }), AT);
    expect(ended.ended).toBe(true);
    expect(ended.session.transcriptionState).toBe('UNKNOWN');
    expect(applyReport(ended.session, report({ meetingState: 'ENDED' }), AT).ended).toBe(false);
  });

  it('ignores an impossible state from a confused page', () => {
    const result = applyReport(live(), report({ meetingState: 'WAITING' }), AT);
    expect(result.session.meetingState).toBe('IN_MEETING');
  });
});

describe('participant event flushing', () => {
  const events = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      key: `p${i}`,
      displayName: `P${i}`,
      isSelf: false,
      event: 'JOINED' as const,
      at: AT,
    }));

  it('waits for a full batch or the throttle interval', () => {
    const session = live({ pendingEvents: events(2), eventsFlushedAt: 1000 });
    expect(shouldFlushEvents(session, 50, 1000 + EVENT_FLUSH_INTERVAL_MS - 1, false)).toBe(false);
    expect(shouldFlushEvents(session, 50, 1000 + EVENT_FLUSH_INTERVAL_MS, false)).toBe(true);
    expect(
      shouldFlushEvents(
        live({ pendingEvents: events(50), eventsFlushedAt: 1000 }),
        50,
        1001,
        false,
      ),
    ).toBe(true);
    expect(shouldFlushEvents(session, 50, 1001, true)).toBe(true);
  });

  it('never flushes without a meeting or events', () => {
    expect(shouldFlushEvents(live(), 50, 1e9, true)).toBe(false);
    expect(shouldFlushEvents({ ...fresh(), pendingEvents: events(1) }, 50, 1e9, true)).toBe(false);
  });
});

describe('finalize readiness', () => {
  it('waits for the recorder to flush and every upload to finish', () => {
    const ending = live({ finalizePending: true });
    expect(readyToFinalize(ending)).toBe(true);
    expect(readyToFinalize({ ...ending, recorderActive: true })).toBe(false);
    expect(readyToFinalize({ ...ending, pendingUploads: 1 })).toBe(false);
    expect(readyToFinalize(live())).toBe(false);
    expect(readyToFinalize({ ...fresh(), finalizePending: true })).toBe(false);
  });
});

describe('resumeSession', () => {
  it('keeps the meeting, consent and reminders across a reload of the same call', () => {
    const previous = live({
      consentRecorded: true,
      captureState: 'STOPPED',
      pendingUploads: 2,
      videoPart: 3,
    });
    const resumed = resumeSession(
      previous,
      newTabSession(1, 'new-key', { meetingCode: CODE, url: 'u', title: 't' }),
    );
    expect(resumed).toMatchObject({
      sessionKey: 'new-key',
      meetingState: 'PAGE_OPENED',
      meetingId: 'm1',
      consentRecorded: true,
      captureState: 'STOPPED',
      pendingUploads: 2,
      videoPart: 3,
    });
  });

  it('starts over for another call, a finishing call or no previous session', () => {
    const next = newTabSession(1, 'k', { meetingCode: 'zzz-zzzz-zzz', url: 'u', title: 't' });
    expect(resumeSession(live(), next)).toBe(next);
    const same = fresh();
    expect(resumeSession(live({ finalizePending: true }), same)).toBe(same);
    expect(resumeSession(null, same)).toBe(same);
  });
});

describe('captureBlocker', () => {
  const ready = live({ consentRecorded: true });

  it('allows a consented call that nobody else is capturing', () => {
    expect(captureBlocker(ready, org, null)).toBeNull();
    expect(() => assertCapturable(ready, org, null)).not.toThrow();
    expect(() => assertCapturable(null, org, null)).toThrow('Join the call');
    expect(captureBlocker({ ...ready, meetingStartedAt: null }, org, null)).toMatch(
      /Join the call/,
    );
  });

  it('explains every reason capture may not start', () => {
    expect(captureBlocker(ready, null, null)).toMatch(/Sign in/);
    expect(captureBlocker(ready, { ...org, enabled: false }, null)).toMatch(/turned off/);
    expect(captureBlocker(null, org, null)).toMatch(/Join the call/);
    expect(captureBlocker({ ...ready, meetingState: 'WAITING' }, org, null)).toMatch(
      /Join the call/,
    );
    expect(captureBlocker(ready, org, live({ tabId: 2 }))).toMatch(/another tab/);
    expect(captureBlocker({ ...ready, consentRecorded: false }, org, null)).toMatch(/Confirm/);
    expect(captureBlocker({ ...ready, captureState: 'RECORDING' }, org, null)).toMatch(
      /already running/,
    );
  });
});

describe('captureExpired', () => {
  it('stops at the company maximum length', () => {
    const capturing = live({ captureState: 'RECORDING', captureStartedAt: 0 });
    expect(captureExpired(capturing, 60, 59 * 60_000)).toBe(false);
    expect(captureExpired(capturing, 60, 60 * 60_000)).toBe(true);
    expect(captureExpired(capturing, 0, 1e12)).toBe(false);
    expect(captureExpired({ ...capturing, captureStartedAt: null }, 60, 1e12)).toBe(false);
    expect(captureExpired({ ...capturing, captureState: 'STOPPED' }, 60, 1e12)).toBe(false);
  });
});

describe('uploadFailureMessage', () => {
  it('has a specific message for known reasons and a general one otherwise', () => {
    expect(uploadFailureMessage('budget_exceeded')).toMatch(/budget/);
    expect(uploadFailureMessage('unsupported_audio')).toMatch(/audio format/);
    expect(uploadFailureMessage('max_attempts')).toMatch(/connection/);
  });
});

describe('toTabSnapshot', () => {
  it('exposes state but no names, tokens or transcript', () => {
    const session = live({
      roster: [{ key: 'ravi', displayName: 'Ravi', isSelf: false }],
      captureState: 'RECORDING',
    });
    const snapshot = toTabSnapshot(session, true);
    expect(snapshot).toMatchObject({
      tabId: 1,
      meetingId: 'm1',
      participantCount: 1,
      captureElsewhere: true,
      iconStatus: 'ACTIVE',
      reminderBanner: false,
    });
    expect(JSON.stringify(snapshot)).not.toContain('Ravi');
  });
});
