import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaLanguage,
  useMaFollowUpQuery,
  useMaUpdateMeetingMutation,
} from '@exyconn/shell/graphql/generated';
import { OverviewTab } from '../../../src/detail/overview/OverviewTab';
import { STARTED, makeMeeting } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaFollowUpQuery: vi.fn(),
  useMaUpdateMeetingMutation: vi.fn(),
}));

const carried = (id: string, title: string, patch = {}) => ({
  id,
  title,
  assignedTo: 'Ravi',
  dueDate: '2026-10-25T00:00:00.000Z',
  ...patch,
});

const FOLLOW_UP = {
  maFollowUp: {
    previousMeeting: { id: 'meeting-0', title: 'Last week sync', startedAt: STARTED },
    previousSummary: 'We agreed the launch date.',
    pendingActions: [carried('a1', 'Draft the plan', { assignedTo: null, dueDate: null })],
    completedActions: [carried('a2', 'Book the venue')],
    overdueActions: [],
    unresolvedBlockers: ['Legal review'],
  },
};

const updateMeeting = vi.fn();

beforeEach(() => {
  updateMeeting.mockReset().mockResolvedValue({ data: { maUpdateMeeting: makeMeeting() } });
  vi.mocked(useMaUpdateMeetingMutation).mockReturnValue(mutationTuple(updateMeeting) as never);
  vi.mocked(useMaFollowUpQuery).mockReturnValue(queryResult(FOLLOW_UP) as never);
});

describe('OverviewTab', () => {
  it("lays out the call's facts in the viewer's timezone", () => {
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    expect(screen.getByText('Organizer').nextElementSibling).toHaveTextContent('Ravi Kumar');
    expect(screen.getByText('Duration').nextElementSibling).toHaveTextContent('45m');
    expect(screen.getByText('Call timezone').nextElementSibling).toHaveTextContent('Asia/Kolkata');
    expect(screen.getByText('Participants told').nextElementSibling).toHaveTextContent(/Confirmed/);
    expect(screen.getByText('Detected languages').nextElementSibling).toHaveTextContent(
      'en and hi',
    );
    expect(screen.getByRole('link', { name: 'abc-defg-hij' })).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij',
    );
  });

  it('says what is not known yet rather than leaving it blank', () => {
    renderWithProviders(
      <OverviewTab
        meeting={makeMeeting({
          endedAt: null,
          consentRecordedAt: null,
          detectedLanguages: [],
          organizerName: null,
        })}
        listPath="/ai/ma/meetings"
      />,
    );
    expect(screen.getByText('Ended').nextElementSibling).toHaveTextContent('Still in progress');
    expect(screen.getByText('Participants told').nextElementSibling).toHaveTextContent(
      'Not confirmed',
    );
    expect(screen.getByText('Detected languages').nextElementSibling).toHaveTextContent('None yet');
    expect(screen.getByText('Organizer').nextElementSibling).toHaveTextContent('Asha Rao');
  });

  it('follows up on the previous meeting in the series', () => {
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    expect(screen.getByRole('link', { name: 'Last week sync' })).toHaveAttribute(
      'href',
      '/ai/ma/meetings/meeting-0',
    );
    expect(screen.getByText('We agreed the launch date.')).toBeInTheDocument();
    expect(screen.getByText('Pending actions')).toBeInTheDocument();
    expect(screen.getByText('Unassigned · due no date')).toBeInTheDocument();
    expect(screen.getByText('Completed actions')).toBeInTheDocument();
    expect(screen.queryByText('Overdue actions')).not.toBeInTheDocument();
    expect(screen.getByText('Legal review')).toBeInTheDocument();
  });

  it('says when a meeting is the first of its series', () => {
    vi.mocked(useMaFollowUpQuery).mockReturnValue(
      queryResult({
        maFollowUp: {
          ...FOLLOW_UP.maFollowUp,
          previousMeeting: null,
        },
      }) as never,
    );
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    expect(
      screen.getByText(
        'This is the first meeting in its series, so there is nothing to follow up yet.',
      ),
    ).toBeInTheDocument();
  });

  it('leaves out a missing summary and blockers', () => {
    vi.mocked(useMaFollowUpQuery).mockReturnValue(
      queryResult({
        maFollowUp: { ...FOLLOW_UP.maFollowUp, previousSummary: null, unresolvedBlockers: [] },
      }) as never,
    );
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    expect(screen.queryByText('Unresolved blockers')).not.toBeInTheDocument();
  });

  it('shows the follow-up loading, and failing with Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaFollowUpQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Follow-up failed'), refetch }) as never,
    );
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('MeetingDetailsForm (through the overview)', () => {
  it('renames the meeting and corrects its language', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaFollowUpQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    const title = screen.getByRole('textbox', { name: 'Meeting title' });
    await user.clear(title);
    await user.type(title, 'Launch review');
    await user.click(screen.getByRole('combobox', { name: 'Spoken language' }));
    await user.click(await screen.findByRole('option', { name: 'Hinglish' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateMeeting).toHaveBeenCalledWith({
      variables: {
        id: 'meeting-1',
        input: { title: 'Launch review', language: MaLanguage.Hinglish },
      },
    });
    expect(await screen.findByText('Meeting updated')).toBeInTheDocument();
  });

  it('requires a title, and keeps what was typed when the save fails', async () => {
    const user = userEvent.setup();
    updateMeeting.mockRejectedValue(new Error('Not your meeting'));
    renderWithProviders(<OverviewTab meeting={makeMeeting()} listPath="/ai/ma/meetings" />);
    const title = screen.getByRole('textbox', { name: 'Meeting title' });
    await user.clear(title);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Meeting title is required')).toBeInTheDocument();
    expect(updateMeeting).not.toHaveBeenCalled();

    await user.type(title, 'Retitled');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Not your meeting')).toBeInTheDocument();
    expect(title).toHaveValue('Retitled');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(title).toHaveValue('Weekly sync');
  });
});
