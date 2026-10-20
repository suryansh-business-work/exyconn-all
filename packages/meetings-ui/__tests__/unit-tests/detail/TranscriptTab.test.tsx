import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaTranscriptSource,
  useListEmployeeOptionsQuery,
  useMaConfirmSpeakerMutation,
  useMaImportOfficialTranscriptMutation,
  useMaTranscriptQuery,
  type MaTranscriptQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { TranscriptTab } from '../../../src/detail/transcript/TranscriptTab';
import { TRANSCRIPT_PAGE_SIZE } from '../../../src/detail/transcript/TranscriptPage';
import { EMPLOYEES, STARTED, makeMeeting, makeSegment, type Segment } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaTranscriptQuery: vi.fn(),
  useMaImportOfficialTranscriptMutation: vi.fn(),
  useMaConfirmSpeakerMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
}));

/** The slices the server holds, keyed `<source>:<afterMs>`. */
let slices: Record<string, Segment[] | 'loading' | Error> = {};

function answer({ variables }: { variables: MaTranscriptQueryVariables }) {
  const slice = slices[`${variables.source}:${variables.afterMs ?? 'start'}`] ?? [];
  if (slice === 'loading') {
    return queryResult(undefined, { loading: true });
  }
  if (slice instanceof Error) {
    return queryResult(undefined, { error: slice });
  }
  return queryResult({ maTranscript: slice });
}

const fullPage = () =>
  Array.from({ length: TRANSCRIPT_PAGE_SIZE }, (_, index) =>
    makeSegment({
      id: `seg-${index}`,
      startMs: index * 1000,
      text: `line ${index}`,
      speakerConfirmed: true,
      speakerName: 'Ravi',
    }),
  );

const importTranscript = vi.fn();
const confirmSpeaker = vi.fn();

beforeEach(() => {
  slices = {};
  vi.mocked(useMaTranscriptQuery).mockImplementation(answer as never);
  importTranscript.mockReset().mockResolvedValue({});
  confirmSpeaker.mockReset().mockResolvedValue({});
  vi.mocked(useMaImportOfficialTranscriptMutation).mockReturnValue(
    mutationTuple(importTranscript) as never,
  );
  vi.mocked(useMaConfirmSpeakerMutation).mockReturnValue(mutationTuple(confirmSpeaker) as never);
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(EMPLOYEES) as never);
});

describe('TranscriptTab', () => {
  it('shows each line with when it was said and an honest speaker label', () => {
    slices['AI:start'] = [
      makeSegment(),
      makeSegment({
        id: 'seg-2',
        speakerLabel: 'Speaker 2',
        speakerName: 'Ravi',
        speakerConfirmed: true,
      }),
      makeSegment({ id: 'seg-3', speakerLabel: null, text: 'Hello?' }),
    ];
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    const lines = screen.getAllByRole('listitem');
    expect(lines[0]).toHaveTextContent('1:01Unknown Speaker 1');
    expect(within(lines[1]).getByText('Ravi')).toBeInTheDocument();
    expect(within(lines[1]).getByText('(Speaker 2)')).toBeInTheDocument();
    expect(within(lines[2]).getByText('Unknown speaker')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Confirm who/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('loads the next slice after the last line when a slice comes back full', async () => {
    slices['AI:start'] = fullPage();
    slices[`AI:${(TRANSCRIPT_PAGE_SIZE - 1) * 1000}`] = [
      makeSegment({ id: 'seg-last', text: 'The end' }),
    ];
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('The end')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows nothing more when a later slice is empty', async () => {
    slices['AI:start'] = fullPage();
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(TRANSCRIPT_PAGE_SIZE);
  });

  it("switches to Google Meet's own transcript and explains an empty one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    expect(
      screen.getByText('No transcript was captured by the extension for this call.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Google Meet' }));
    expect(
      screen.getByText(
        'No Google Meet transcript has been imported. Transcription must have been on in Meet.',
      ),
    ).toBeInTheDocument();
    expect(vi.mocked(useMaTranscriptQuery).mock.lastCall?.[0]).toMatchObject({
      variables: { source: MaTranscriptSource.GoogleMeet, afterMs: null },
    });
    await user.click(screen.getByRole('button', { name: 'Google Meet' }));
    expect(screen.getByRole('button', { name: 'Google Meet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows a slice loading, and failing with Retry', async () => {
    slices['AI:start'] = new Error('Transcript unavailable');
    const { unmount } = renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    expect(screen.getByText('Transcript unavailable')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    unmount();
    slices['AI:start'] = 'loading';
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('imports the official Google Meet transcript again', async () => {
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Import from Google Meet' }));
    expect(importTranscript).toHaveBeenCalledWith({ variables: { meetingId: 'meeting-1' } });
    expect(await screen.findByText('Google Meet transcript import started')).toBeInTheDocument();
  });

  it('lists the speakers people have confirmed', () => {
    renderWithProviders(
      <TranscriptTab
        meeting={makeMeeting({
          speakerMappings: [
            {
              label: 'Speaker 2',
              name: 'Ravi',
              userId: 'user-2',
              confirmedByName: 'Asha Rao',
              confirmedAt: STARTED,
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('Speaker 2 → Ravi')).toBeInTheDocument();
  });

  it('confirms who a speaker label is, linking a portal user', async () => {
    const user = userEvent.setup();
    slices['AI:start'] = [makeSegment()];
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Confirm who Unknown Speaker 1 is' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Every line labelled Unknown Speaker 1 will show this name.'),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Confirm speaker' }));
    expect(await within(dialog).findByText('Name is required')).toBeInTheDocument();

    await user.type(within(dialog).getByRole('textbox', { name: 'Speaker name' }), 'Ravi Kumar');
    await user.click(within(dialog).getByRole('combobox', { name: 'Portal user (optional)' }));
    await user.click(await screen.findByRole('option', { name: 'Ravi Kumar (ravi@example.com)' }));
    await user.click(within(dialog).getByRole('button', { name: 'Confirm speaker' }));
    expect(confirmSpeaker).toHaveBeenCalledWith({
      variables: {
        meetingId: 'meeting-1',
        input: { label: 'Unknown Speaker 1', name: 'Ravi Kumar', userId: 'user-2' },
      },
    });
    expect(await screen.findByText('Speaker confirmed')).toBeInTheDocument();
  });

  it('keeps the speaker form open when the server refuses, and closes on Cancel or Close', async () => {
    const user = userEvent.setup();
    confirmSpeaker.mockRejectedValue(new Error('Label not found'));
    vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(undefined) as never);
    slices['AI:start'] = [makeSegment()];
    renderWithProviders(<TranscriptTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Confirm who Unknown Speaker 1 is' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox', { name: 'Speaker name' }), 'Ravi');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm speaker' }));
    expect(await screen.findByText('Label not found')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Confirm who Unknown Speaker 1 is' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
