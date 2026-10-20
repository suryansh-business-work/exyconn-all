import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMaRecordingDownloadLinkMutation,
  useMaRecordingQuery,
} from '@exyconn/shell/graphql/generated';
import { RecordingTab } from '../../../src/detail/recording/RecordingTab';
import { mutationTuple, queryResult, renderWithProviders, stubLocationAssign } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaRecordingQuery: vi.fn(),
  useMaRecordingDownloadLinkMutation: vi.fn(),
}));

const createLink = vi.fn();
const LINK = {
  url: 'https://files.example.com/tab.wav?sig=1',
  expiresAt: '',
  fileName: 'tab.wav',
  sha256: '',
};

beforeEach(() => {
  createLink.mockReset().mockResolvedValue({ data: { maRecordingDownloadLink: LINK } });
  vi.mocked(useMaRecordingDownloadLinkMutation).mockReturnValue(mutationTuple(createLink) as never);
  vi.mocked(useMaRecordingQuery).mockReturnValue(
    queryResult({
      maRecording: [
        { stream: 'TAB', chunkCount: 10, seconds: 2700, sizeBytes: 2048 },
        { stream: 'MIC', chunkCount: 10, seconds: 60, sizeBytes: 1024 },
        { stream: 'OTHER', chunkCount: 1, seconds: 5, sizeBytes: 10 },
      ],
    }) as never,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RecordingTab', () => {
  it('lists each saved stream with its length and size', () => {
    renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    expect(screen.getByText('Meeting audio')).toBeInTheDocument();
    expect(screen.getByText('Your microphone')).toBeInTheDocument();
    expect(screen.getByText('OTHER')).toBeInTheDocument();
    expect(screen.getByText('45m · 2.0 KB')).toBeInTheDocument();
  });

  it('downloads a stream as WAV through its signed link', async () => {
    const assign = stubLocationAssign();
    renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Download WAV' })[0]);
    expect(createLink).toHaveBeenCalledWith({
      variables: { meetingId: 'meeting-1', stream: 'TAB' },
    });
    expect(assign).toHaveBeenCalledWith(LINK.url);
  });

  it('plays a stream from the same signed link, labelled for screen readers', async () => {
    renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Listen' })[1]);
    const player = await screen.findByLabelText('Play Your microphone');
    expect(player).toHaveAttribute('src', LINK.url);
  });

  it('says why a link could not be had, and does not navigate without one', async () => {
    const assign = stubLocationAssign();
    createLink.mockRejectedValueOnce(new Error('Recording expired'));
    renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Download WAV' })[0]);
    expect(await screen.findByText('Recording expired')).toBeInTheDocument();
    createLink.mockResolvedValueOnce({ data: undefined });
    await userEvent.click(screen.getAllByRole('button', { name: 'Download WAV' })[0]);
    expect(assign).not.toHaveBeenCalled();
  });

  it('says when no recording was saved, and shows loading and errors', async () => {
    vi.mocked(useMaRecordingQuery).mockReturnValue(queryResult({ maRecording: [] }) as never);
    const first = renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    expect(screen.getByText('No recording saved')).toBeInTheDocument();
    first.unmount();
    vi.mocked(useMaRecordingQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const second = renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    expect(screen.queryByText('No recording saved')).not.toBeInTheDocument();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaRecordingQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Audio store offline'), refetch }) as never,
    );
    renderWithProviders(<RecordingTab meetingId="meeting-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});
