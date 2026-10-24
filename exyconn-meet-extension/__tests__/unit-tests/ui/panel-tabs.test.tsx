import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PanelState } from '../../../src/content/app/PanelState';
import { ActionItemsTab } from '../../../src/content/app/tabs/ActionItemsTab';
import { FollowUpCard } from '../../../src/content/app/tabs/FollowUpCard';
import { NotesTab } from '../../../src/content/app/tabs/NotesTab';
import { OverviewTab } from '../../../src/content/app/tabs/OverviewTab';
import { ParticipantsTab } from '../../../src/content/app/tabs/ParticipantsTab';
import { SettingsTab } from '../../../src/content/app/tabs/SettingsTab';
import { TranscriptTab } from '../../../src/content/app/tabs/TranscriptTab';
import type { TabProps } from '../../../src/content/app/tabs/types';
import { DEFAULT_PREFS } from '../../../src/storage/prefs';
import { ORG } from '../fake-portal';
import { IN_CALL, IN_CALL_TRANSCRIPT_OFF, render as renderMeet } from '../fixtures/meet-dom';
import {
  SIGNED_IN,
  SIGNED_OUT,
  TAB_SNAPSHOT,
  installBrowserGaps,
  testLogger,
  workerAnswering,
} from '../ui-helpers';

beforeEach(() => {
  installBrowserGaps();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function props(overrides: Partial<TabProps> = {}): TabProps {
  return {
    state: SIGNED_IN,
    tab: TAB_SNAPSHOT,
    prefs: DEFAULT_PREFS,
    logger: testLogger(),
    ...overrides,
  };
}

const followUp = (pending: number, overdue: number, blockers: string[]) => ({
  previousMeeting: { id: 'p1', title: 'Last sync', startedAt: '2026-10-13T10:00:00Z' },
  pendingActions: Array.from({ length: pending }, (_, i) => ({ id: `a${i}`, title: `A${i}` })),
  overdueActions: Array.from({ length: overdue }, (_, i) => ({ id: `o${i}` })),
  unresolvedBlockers: blockers,
  carriedTopics: [],
});

describe('PanelState', () => {
  it('shows the error with Retry, the loader, the empty text or the content', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <PanelState loading={false} error="Down" empty emptyText="Nothing" onRetry={onRetry}>
        x
      </PanelState>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(
      <PanelState loading error={null} empty emptyText="Nothing" onRetry={onRetry}>
        x
      </PanelState>,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    rerender(
      <PanelState loading={false} error={null} empty emptyText="Nothing" onRetry={onRetry}>
        x
      </PanelState>,
    );
    expect(screen.getByText('Nothing')).toBeInTheDocument();
    rerender(
      <PanelState loading error={null} empty={false} emptyText="Nothing" onRetry={onRetry}>
        content
      </PanelState>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});

describe('OverviewTab', () => {
  it('asks a signed-out user to sign in right in the panel, and signs in there', async () => {
    const chrome = workerAnswering({ 'auth/sign-in': { mfaChallenge: null } });
    render(<OverviewTab {...props({ state: SIGNED_OUT })} />);
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('type', 'password');
    await userEvent.type(screen.getByLabelText(/^Email/), 'ravi@exyconn.com');
    await userEvent.type(screen.getByLabelText(/^Password/), `pw-${Date.now()}`);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth/sign-in', email: 'ravi@exyconn.com' }),
      ),
    );
  });

  it("offers Meet's own transcription controls while they are off, and the follow-up", async () => {
    workerAnswering({ 'panel:followUp': followUp(3, 1, ['Budget']) });
    const doc = renderMeet(IN_CALL_TRANSCRIPT_OFF);
    const logger = testLogger();
    // Recording, so the panel's own "Start transcription" button is not on the page (in Meet the
    // panel lives in a shadow root the adapter never searches).
    render(
      <OverviewTab
        {...props({
          tab: { ...TAB_SNAPSHOT, transcriptionState: 'OFF', captureState: 'RECORDING' },
          logger,
        })}
      />,
    );
    expect(
      await screen.findByText(
        '3 action items from the previous meeting are still pending (1 overdue).',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('1 blockers are still unresolved.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open transcription controls' }));
    expect(doc.activeElement?.textContent).toBe('Start transcription');
    document.querySelector('aside')?.remove();
    document.querySelector('[aria-label="Activities"]')?.remove();
    await userEvent.click(screen.getByRole('button', { name: 'Open transcription controls' }));
    expect(logger.info).toHaveBeenCalledWith('Meet transcription controls not found on the page');
  });

  it('hides the controls hint when Meet transcribes', () => {
    workerAnswering({});
    renderMeet(IN_CALL);
    render(<OverviewTab {...props()} />);
    expect(screen.queryByRole('button', { name: 'Open transcription controls' })).toBeNull();
  });
});

describe('FollowUpCard', () => {
  it('says when everything from last time is done, and renders nothing without a previous meeting', async () => {
    workerAnswering({ 'panel:followUp': followUp(0, 0, []) });
    const { unmount } = render(<FollowUpCard enabled logger={testLogger()} />);
    expect(
      await screen.findByText('Every action item from the previous meeting is done.'),
    ).toBeInTheDocument();
    unmount();
    workerAnswering({ 'panel:followUp': { ...followUp(0, 0, []), previousMeeting: null } });
    const { container } = render(<FollowUpCard enabled logger={testLogger()} />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe('TranscriptTab', () => {
  it('merges local and portal lines in time order', async () => {
    workerAnswering({
      'panel:liveSegments': [
        { id: 'b', startMs: 65_000, endMs: 66_000, text: 'Second', speakerLabel: null },
      ],
      'panel:transcript': [
        { id: 'a', startMs: 1000, endMs: 2000, text: 'First', speakerLabel: 'Ravi' },
      ],
    });
    render(<TranscriptTab {...props()} />);
    expect(await screen.findByText('Second')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual(['First0:01 · Ravi', 'Second1:05']);
  });

  it('shows an empty state, an error with retry, and the off state', async () => {
    workerAnswering({ 'panel:transcript': new Error('Live transcript is turned off') });
    const { unmount } = render(<TranscriptTab {...props()} />);
    expect(await screen.findByText('Live transcript is turned off')).toBeInTheDocument();
    unmount();
    workerAnswering({ 'panel:transcript': [], 'panel:liveSegments': [] });
    const second = render(<TranscriptTab {...props()} />);
    expect(await screen.findByText(/No transcript yet/)).toBeInTheDocument();
    second.unmount();
    render(<TranscriptTab {...props({ prefs: { ...DEFAULT_PREFS, liveTranscript: false } })} />);
    expect(screen.getByText(/turned off in your settings or by your company/)).toBeInTheDocument();
  });
});

describe('ParticipantsTab', () => {
  it('lists people with their status and rejoins', async () => {
    workerAnswering({
      'panel:participants': [
        { id: 'p1', displayName: 'Ravi', status: 'JOINED', rejoinCount: 2 },
        { id: 'p2', displayName: 'Meera', status: 'LEFT', rejoinCount: 0 },
      ],
    });
    render(<ParticipantsTab {...props()} />);
    expect(await screen.findByText('Ravi')).toBeInTheDocument();
    expect(screen.getByText('Rejoined 2 times')).toBeInTheDocument();
    expect(screen.getByText('In the call')).toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
  });

  it('explains an empty list, tracked or not', async () => {
    workerAnswering({ 'panel:participants': [] });
    const { unmount } = render(<ParticipantsTab {...props()} />);
    expect(await screen.findByText(/Open Meet's People panel/)).toBeInTheDocument();
    unmount();
    render(
      <ParticipantsTab
        {...props({
          state: {
            ...SIGNED_IN,
            auth: { signedIn: true, org: { ...ORG, participantTracking: false } },
          },
        })}
      />,
    );
    expect(screen.getByText(/Participant tracking is turned off/)).toBeInTheDocument();
  });
});

describe('NotesTab', () => {
  it('shows the notes, decisions and a link to the meeting', async () => {
    workerAnswering({
      'panel:notes': {
        maMeeting: { id: 'm1', summaryStatus: 'READY' },
        maNotes: {
          id: 'n1',
          generatedAt: '2026-10-20T11:00:00Z',
          content: { overview: 'We agreed the plan.', discussionPoints: ['Budget'], followUps: [] },
        },
        maDecisions: [{ id: 'd1', text: 'Ship Friday' }],
      },
    });
    render(<NotesTab {...props()} />);
    expect(await screen.findByText('We agreed the plan.')).toBeInTheDocument();
    expect(screen.getByText('Ship Friday')).toBeInTheDocument();
    expect(screen.queryByText('Follow-ups')).toBeNull();
    expect(screen.getByRole('link', { name: 'Open the meeting in the portal' })).toHaveAttribute(
      'href',
      'https://employee.test/me/meetings/m1',
    );
  });

  it('says where the notes are in the pipeline, and has no link before the meeting', async () => {
    workerAnswering({
      'panel:notes': {
        maMeeting: { id: 'm1', summaryStatus: 'RUNNING' },
        maNotes: null,
        maDecisions: [],
      },
    });
    const { unmount } = render(
      <NotesTab {...props({ state: { ...SIGNED_OUT, tab: TAB_SNAPSHOT } })} />,
    );
    expect(await screen.findByText('The notes are being written…')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'http://localhost:4021/me/meetings/m1',
    );
    unmount();
    render(<NotesTab {...props({ tab: { ...TAB_SNAPSHOT, meetingId: null } })} />);
    expect(screen.getByText('Notes are written after the meeting ends.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('ActionItemsTab', () => {
  const rows = [
    {
      id: 'a1',
      title: 'Send deck',
      status: 'PENDING',
      assignedTo: 'Ravi',
      dueDate: null,
      overdue: true,
    },
    {
      id: 'a2',
      title: 'Book room',
      status: 'COMPLETED',
      assignedTo: null,
      dueDate: null,
      overdue: false,
    },
  ];

  it('ticks an item complete and unticks it back to pending, and pages', async () => {
    const chrome = workerAnswering({
      'panel:actions': { rows, totalCount: 45 },
      'panel:setActionStatus': { id: 'a1', status: 'COMPLETED' },
    });
    render(<ActionItemsTab {...props()} />);
    expect(await screen.findByText('Ravi · Overdue')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /Send deck/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Book room/ }));
    const statuses = chrome.runtime.sendMessage.mock.calls
      .map(([m]) => (m as { request?: { op: string; status?: string } }).request)
      .filter((r) => r?.op === 'setActionStatus')
      .map((r) => r?.status);
    expect(statuses).toEqual(['COMPLETED', 'PENDING']);
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await waitFor(() =>
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'panel/request',
        request: { op: 'actions', page: 1 },
      }),
    );
  });

  it('shows an update failure and the empty state', async () => {
    workerAnswering({
      'panel:actions': { rows, totalCount: 2 },
      'panel:setActionStatus': new Error('Not allowed'),
    });
    const { unmount } = render(<ActionItemsTab {...props()} />);
    await userEvent.click(await screen.findByRole('checkbox', { name: /Send deck/ }));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
    unmount();
    workerAnswering({ 'panel:actions': { rows: [], totalCount: 0 } });
    render(<ActionItemsTab {...props()} />);
    expect(await screen.findByText(/No action items yet/)).toBeInTheDocument();
  });
});

describe('SettingsTab', () => {
  it('saves a quick toggle to sync storage and opens all settings', async () => {
    const chrome = workerAnswering({});
    render(<SettingsTab {...props()} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Desktop notifications' }));
    await waitFor(() =>
      expect(chrome.storage.sync.data.get('prefs')).toMatchObject({ desktopNotifications: false }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'All settings' }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'options/open' });
  });
});
