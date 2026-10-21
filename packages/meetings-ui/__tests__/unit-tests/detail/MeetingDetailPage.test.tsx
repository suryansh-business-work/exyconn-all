import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMaMeetingQuery } from '@exyconn/shell/graphql/generated';
import { MeetingDetailPage } from '../../../src/detail/MeetingDetailPage';
import { makeMeeting } from '../fixtures';
import { queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaMeetingQuery: vi.fn(),
}));

// Each tab has its own tests; here they only say which one is showing.
vi.mock('../../../src/detail/overview/OverviewTab', () => ({
  OverviewTab: ({ listPath }: { listPath: string }) => <p>{`overview tab ${listPath}`}</p>,
}));
vi.mock('../../../src/detail/transcript/TranscriptTab', () => ({
  TranscriptTab: () => <p>transcript tab</p>,
}));
vi.mock('../../../src/detail/participants/ParticipantsTab', () => ({
  ParticipantsTab: () => <p>participants tab</p>,
}));
vi.mock('../../../src/detail/summary/SummaryTab', () => ({ SummaryTab: () => <p>summary tab</p> }));
vi.mock('../../../src/actions/ActionChecklist', () => ({
  ActionChecklist: ({ scope, meetingId }: { scope: string; meetingId: string }) => (
    <p>{`actions tab ${scope} ${meetingId}`}</p>
  ),
}));
vi.mock('../../../src/detail/decisions/DecisionsTab', () => ({
  DecisionsTab: () => <p>decisions tab</p>,
}));
vi.mock('../../../src/detail/email/EmailTab', () => ({ EmailTab: () => <p>email tab</p> }));
vi.mock('../../../src/detail/recording/RecordingTab', () => ({
  RecordingTab: () => <p>recording tab</p>,
}));
vi.mock('../../../src/events/MeetingEvents', () => ({
  MeetingEvents: ({
    meetingId,
    meetingHref,
  }: {
    meetingId: string;
    meetingHref: (id: string) => string;
  }) => <p>{`activity tab ${meetingId} ${meetingHref('other')}`}</p>,
}));

const PATH = '/ai/ma/meetings/:id/:tab?';
const location = () => screen.getByRole('status', { name: 'location', hidden: true });

function renderAt(route: string) {
  renderWithProviders(<MeetingDetailPage scope="ALL" basePath="/ai/ma" />, { route, path: PATH });
}

beforeEach(() => {
  vi.mocked(useMaMeetingQuery).mockReturnValue(queryResult({ maMeeting: makeMeeting() }) as never);
});

describe('MeetingDetailPage', () => {
  it('loads the meeting in the URL and opens on its overview', async () => {
    renderAt('/ai/ma/meetings/meeting-1');
    expect(vi.mocked(useMaMeetingQuery).mock.lastCall?.[0]).toMatchObject({
      variables: { id: 'meeting-1' },
    });
    expect(screen.getByRole('heading', { name: 'Weekly sync', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/recorded by Asha Rao/)).toBeInTheDocument();
    expect(await screen.findByText('overview tab /ai/ma/meetings')).toBeInTheDocument();
    expect(location()).toHaveTextContent('/ai/ma/meetings/meeting-1/overview');
    expect(screen.getByRole('link', { name: 'Back to meetings' })).toHaveAttribute(
      'href',
      '/ai/ma/meetings',
    );
  });

  it.each([
    ['Participants', 'participants tab'],
    ['AI Notes', 'summary tab'],
    ['Action Items', 'actions tab ALL meeting-1'],
    ['Decisions', 'decisions tab'],
    ['Email', 'email tab'],
    ['Recording', 'recording tab'],
    ['Activity', 'activity tab meeting-1 /ai/ma/meetings/other'],
  ])('opens the %s tab by its slug', async (tab, content) => {
    const user = userEvent.setup();
    renderAt('/ai/ma/meetings/meeting-1/transcript');
    expect(await screen.findByText('transcript tab')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: tab }));
    expect(await screen.findByText(content)).toBeInTheDocument();
  });

  it('shows a skeleton until the meeting arrives', () => {
    vi.mocked(useMaMeetingQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderAt('/ai/ma/meetings/meeting-1');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows why the meeting could not be loaded, with Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaMeetingQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Meeting not found'), refetch }) as never,
    );
    renderAt('/ai/ma/meetings/missing');
    expect(screen.getByText('Meeting not found')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('asks for no id when the route has none', () => {
    renderWithProviders(<MeetingDetailPage scope="MINE" basePath="/me/meetings" />);
    expect(vi.mocked(useMaMeetingQuery).mock.lastCall?.[0]).toMatchObject({
      variables: { id: '' },
    });
  });
});
