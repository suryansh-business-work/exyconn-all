import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaParticipantSource,
  MaParticipantStatus,
  useMaDecisionsQuery,
  useMaParticipantsQuery,
} from '@exyconn/shell/graphql/generated';
import { ParticipantsTab } from '../../../src/detail/participants/ParticipantsTab';
import { DecisionsTab } from '../../../src/detail/decisions/DecisionsTab';
import { STARTED, makeParticipant } from '../fixtures';
import { queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaParticipantsQuery: vi.fn(),
  useMaDecisionsQuery: vi.fn(),
}));

describe('ParticipantsTab', () => {
  beforeEach(() => {
    vi.mocked(useMaParticipantsQuery).mockReturnValue(
      queryResult({
        maParticipants: [
          makeParticipant(),
          makeParticipant({
            id: 'p-2',
            displayName: 'Guest 1',
            email: null,
            status: MaParticipantStatus.Joined,
            source: MaParticipantSource.MeetUi,
            confidence: 0.6,
            sessions: [{ joinedAt: STARTED, leftAt: null }],
            rejoinCount: 2,
          }),
          makeParticipant({ id: 'p-3', displayName: 'Ghost', sessions: [] }),
        ],
      }) as never,
    );
  });

  it('lists who joined, for how long, and how sure we are of each name', () => {
    renderWithProviders(<ParticipantsTab meetingId="meeting-1" />);
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('Not verified')).toBeInTheDocument();
    expect(screen.getByText('Still in the call')).toBeInTheDocument();
    expect(screen.getAllByText('Not seen')).toHaveLength(2);
    expect(screen.getByText('Best effort · 60%')).toBeInTheDocument();
    expect(screen.getAllByText('40m')).toHaveLength(3);
  });

  it('shows the participants loading', () => {
    vi.mocked(useMaParticipantsQuery).mockReturnValue(queryResult(undefined, { loading: true }) as never);
    renderWithProviders(<ParticipantsTab meetingId="meeting-1" />);
    expect(screen.queryByText('No participants were recorded for this call.')).not.toBeInTheDocument();
  });

  it('shows a failed load with Retry', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaParticipantsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('No access'), refetch }) as never,
    );
    renderWithProviders(<ParticipantsTab meetingId="meeting-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('says when nobody was recorded, and re-reads on Refresh', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaParticipantsQuery).mockReturnValue(
      queryResult({ maParticipants: [] }, { refetch }) as never,
    );
    renderWithProviders(<ParticipantsTab meetingId="meeting-1" />);
    expect(screen.getByText('No participants were recorded for this call.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('DecisionsTab', () => {
  it('lists each decision with its confidence and the quotes behind it', () => {
    vi.mocked(useMaDecisionsQuery).mockReturnValue(
      queryResult({
        maDecisions: [
          {
            id: 'd1',
            text: 'Launch on 1 November',
            confidence: 0.91,
            evidence: [
              {
                segmentId: 's1',
                quote: "Let's go with the first",
                startMs: 125_000,
                speakerLabel: 'Speaker 1',
              },
            ],
          },
        ],
      }) as never,
    );
    renderWithProviders(<DecisionsTab meetingId="meeting-1" />);
    expect(screen.getByText('Launch on 1 November')).toBeInTheDocument();
    expect(screen.getByText('91% confident')).toBeInTheDocument();
    expect(screen.getByText('Speaker 1 at 2:05')).toBeInTheDocument();
  });

  it('says when no decisions were recorded', () => {
    vi.mocked(useMaDecisionsQuery).mockReturnValue(queryResult({ maDecisions: [] }) as never);
    renderWithProviders(<DecisionsTab meetingId="meeting-1" />);
    expect(screen.getByText('No decisions were recorded')).toBeInTheDocument();
  });

  it('shows loading, and a failure with Retry', async () => {
    vi.mocked(useMaDecisionsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const { unmount } = renderWithProviders(<DecisionsTab meetingId="meeting-1" />);
    expect(screen.queryByText('No decisions were recorded')).not.toBeInTheDocument();
    unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaDecisionsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Decisions failed'), refetch }) as never,
    );
    renderWithProviders(<DecisionsTab meetingId="meeting-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
