import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { MaScope, MaTranscriptSource } from '@exyconn/shell/graphql/generated';
import { TranscriptsPage } from '../../../src/transcripts/TranscriptsPage';
import { ParticipantsPage } from '../../../src/participants/ParticipantsPage';
import { TRANSCRIPT_HIT_COLUMNS } from '../../../src/transcripts/transcript-hits-grid';
import { PARTICIPANT_COLUMNS } from '../../../src/participants/participants-grid';
import { makeParticipant } from '../fixtures';
import { gridProps } from '../grid-stubs';
import { readsPageFrom } from '../fetcher-spy';
import { renderWithProviders } from '../test-utils';

vi.mock('../../../src/lib/useScopedFetcher', async (orig) =>
  (await import('../fetcher-spy')).spyOnFetcher(orig),
);

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('../grid-stubs')).GridStub,
}));

const location = () => screen.getByRole('status', { name: 'location', hidden: true });

describe('TranscriptsPage', () => {
  it("searches every line in scope and opens a hit at its meeting's transcript", () => {
    renderWithProviders(<TranscriptsPage scope="ALL" basePath="/ai/ma" />);
    expect(screen.getByRole('heading', { name: 'Transcripts', level: 1 })).toBeInTheDocument();
    const grid = gridProps();
    expect(grid.columnDefs).toBe(TRANSCRIPT_HIT_COLUMNS);
    expect(grid.fetchRows.list).toBe('maTranscriptSearch');
    expect(readsPageFrom('maTranscriptSearch')).toBe(true);
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 10 })).toMatchObject({
      scope: MaScope.All,
    });
    expect(grid.context.formatDateTime?.('2026-10-20T09:00:00.000Z')).toMatch(/2026/);
    act(() =>
      grid.onRowClick?.({ id: 'h1', meetingId: 'meeting-9', source: MaTranscriptSource.Ai }),
    );
    expect(location()).toHaveTextContent('/ai/ma/meetings/meeting-9/transcript');
  });
});

describe('ParticipantsPage', () => {
  it("lists the people in one's own meetings and opens the meeting's participants", () => {
    renderWithProviders(<ParticipantsPage scope="MINE" basePath="/me/meetings" />);
    const grid = gridProps();
    expect(grid.columnDefs).toBe(PARTICIPANT_COLUMNS);
    expect(grid.fetchRows.list).toBe('maParticipantsPaged');
    expect(readsPageFrom('maParticipantsPaged')).toBe(true);
    expect(grid.fetchRows.variablesFor?.({ page: 0, pageSize: 10 })).toMatchObject({
      scope: MaScope.Mine,
    });
    expect(grid.context.formatDateTime?.('2026-10-20T09:00:00.000Z')).toMatch(/2026/);
    act(() => grid.onRowClick?.(makeParticipant()));
    expect(location()).toHaveTextContent('/me/meetings/meetings/meeting-1/participants');
  });
});
