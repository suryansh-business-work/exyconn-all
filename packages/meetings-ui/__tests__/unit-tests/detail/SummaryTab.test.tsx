import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaStepStatus,
  MaSummaryStyle,
  useMaNotesQuery,
  useMaRegenerateNotesMutation,
  useMaUpdateNotesMutation,
} from '@exyconn/shell/graphql/generated';
import { useRichTextExport } from '@exyconn/shell/hooks/useRichTextExport';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { SummaryTab } from '../../../src/detail/summary/SummaryTab';
import { makeContent, makeMeeting, makeNotes } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaNotesQuery: vi.fn(),
  useMaUpdateNotesMutation: vi.fn(),
  useMaRegenerateNotesMutation: vi.fn(),
}));
vi.mock('@exyconn/shell/hooks/useRichTextExport', () => ({ useRichTextExport: vi.fn() }));

const updateNotes = vi.fn();
const regenerate = vi.fn();
const exportRichText = vi.fn();
const refetch = vi.fn();

function withNotes(notes: ReturnType<typeof makeNotes> | null) {
  vi.mocked(useMaNotesQuery).mockReturnValue(queryResult({ maNotes: notes }, { refetch }) as never);
}

beforeEach(() => {
  updateNotes.mockReset().mockResolvedValue({});
  regenerate.mockReset().mockResolvedValue({});
  exportRichText.mockReset().mockResolvedValue(undefined);
  refetch.mockReset().mockResolvedValue({});
  vi.mocked(useMaUpdateNotesMutation).mockReturnValue(mutationTuple(updateNotes) as never);
  vi.mocked(useMaRegenerateNotesMutation).mockReturnValue(mutationTuple(regenerate) as never);
  vi.mocked(useRichTextExport).mockReturnValue(exportRichText);
  withNotes(makeNotes());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SummaryTab — reading', () => {
  it('shows the current notes, how they were made, and every revision newest first', () => {
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    expect(screen.getByText(/^Version 2 · Detailed · gpt-test · written /)).toBeInTheDocument();
    expect(screen.getByText('We reviewed the launch.')).toBeInTheDocument();
    expect(screen.getByText('Legal review')).toBeInTheDocument();
    expect(screen.queryByText('Risks')).not.toBeInTheDocument();
    const versions = screen.getAllByText(/^Version \d$/).map((item) => item.textContent);
    expect(versions).toEqual(['Version 2', 'Version 1']);
  });

  it('switches to the version the AI wrote, and stays put when the active one is pressed', async () => {
    const user = userEvent.setup();
    withNotes(makeNotes({ edited: true, revisions: [] }));
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    expect(screen.getByText(/· edited since$/)).toBeInTheDocument();
    expect(screen.queryByText('Revision history')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'As the AI wrote it' }));
    expect(screen.getByText('Original overview.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'As the AI wrote it' }));
    expect(screen.getByText('Original overview.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Current' }));
    expect(screen.getByText('We reviewed the launch.')).toBeInTheDocument();
  });

  it('shows loading, and a failure with Retry', async () => {
    vi.mocked(useMaNotesQuery).mockReturnValue(queryResult(undefined, { loading: true }) as never);
    const { unmount } = renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    expect(screen.queryByText('Edit notes')).not.toBeInTheDocument();
    unmount();
    vi.mocked(useMaNotesQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Notes unavailable'), refetch }) as never,
    );
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('SummaryTab — without notes', () => {
  it('says the AI is still writing them', () => {
    withNotes(null);
    renderWithProviders(
      <SummaryTab meeting={makeMeeting({ summaryStatus: MaStepStatus.Running })} />,
    );
    expect(screen.getByText('The AI is writing the notes')).toBeInTheDocument();
  });

  it('gives the reason they failed and lets them be tried again', async () => {
    withNotes(null);
    renderWithProviders(
      <SummaryTab
        meeting={makeMeeting({
          summaryStatus: MaStepStatus.Failed,
          summaryError: 'Transcript too short',
        })}
      />,
    );
    expect(screen.getByText('The analysis failed: Transcript too short')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('generates them in the chosen style', async () => {
    const user = userEvent.setup();
    withNotes(null);
    renderWithProviders(
      <SummaryTab meeting={makeMeeting({ summaryStatus: MaStepStatus.NotStarted })} />,
    );
    await user.click(screen.getByRole('button', { name: 'Generate notes' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('combobox', { name: 'Summary style' }));
    await user.click(await screen.findByRole('option', { name: 'Executive' }));
    await user.click(within(dialog).getByRole('button', { name: 'Regenerate' }));
    expect(regenerate).toHaveBeenCalledWith({
      variables: { meetingId: 'meeting-1', style: MaSummaryStyle.Executive },
    });
    expect(await screen.findByText('New notes are being written')).toBeInTheDocument();
  });
});

describe('SummaryTab — regenerating', () => {
  it('offers the current style, keeps the dialog open on failure, and cancels', async () => {
    const user = userEvent.setup();
    regenerate.mockRejectedValue(new Error('Budget reached'));
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('combobox', { name: 'Summary style' })).toHaveTextContent(
      'Detailed',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Regenerate' }));
    expect(await screen.findByText('Budget reached')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes from the drawer close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' }),
    );
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('SummaryTab — editing', () => {
  it('saves the edited notes against the version they started from', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Edit notes' }));
    const risks = screen.getByRole('textbox', { name: 'Risks' });
    await user.type(risks, 'Budget{enter}Hiring');
    await user.click(screen.getByRole('button', { name: 'Save notes' }));
    expect(updateNotes).toHaveBeenCalledWith({
      variables: {
        meetingId: 'meeting-1',
        content: makeContent({ risks: ['Budget', 'Hiring'] }),
        expectedVersion: 2,
      },
    });
    expect(await screen.findByText('Notes saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit notes' })).toBeInTheDocument();
  });

  it('cancels back to reading', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Edit notes' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Edit notes' })).toBeInTheDocument();
  });

  it("explains a refused save and reloads someone else's newer version", async () => {
    const user = userEvent.setup();
    updateNotes.mockRejectedValue(new Error('Someone else saved a newer version'));
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Edit notes' }));
    await user.click(screen.getByRole('button', { name: 'Save notes' }));
    expect(await screen.findByText('Someone else saved a newer version')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload notes' }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit notes' })).toBeInTheDocument();
  });

  it('logs a reload that fails, leaving the error state to the query', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    updateNotes.mockRejectedValue(new Error('Conflict'));
    refetch.mockRejectedValue(new Error('offline'));
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Edit notes' }));
    await user.click(screen.getByRole('button', { name: 'Save notes' }));
    await user.click(await screen.findByRole('button', { name: 'Reload notes' }));
    await vi.waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Could not reload the meeting notes', expect.any(Error)),
    );
  });
});

describe('SummaryTab — downloading', () => {
  it('exports PDF and Word through the rich-text exporter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Download' }));
    await user.click(await screen.findByRole('menuitem', { name: 'PDF' }));
    expect(exportRichText).toHaveBeenCalledWith(
      expect.stringContaining('<h1>Weekly sync</h1>'),
      'Weekly sync',
      'pdf',
    );
    await user.click(screen.getByRole('button', { name: 'Download' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Word document' }));
    expect(exportRichText).toHaveBeenLastCalledWith(expect.any(String), 'Weekly sync', 'docx');
    await user.click(screen.getByRole('button', { name: 'Download' }));
    await user.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it.each([
    ['Markdown', 'Weekly sync.md', 'text/markdown;charset=utf-8'],
    ['Plain text', 'Weekly sync.txt', 'text/plain;charset=utf-8'],
    ['JSON', 'Weekly sync.json', 'application/json;charset=utf-8'],
  ])('saves %s written here', async (format, file, type) => {
    const user = userEvent.setup();
    const createUrl = vi.fn().mockReturnValue('blob:notes');
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    renderWithProviders(<SummaryTab meeting={makeMeeting()} />);
    await user.click(screen.getByRole('button', { name: 'Download' }));
    await user.click(await screen.findByRole('menuitem', { name: format }));
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(file);
    expect((createUrl.mock.calls[0][0] as Blob).type).toBe(type);
  });
});
