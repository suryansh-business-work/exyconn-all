import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { ListPromptsPagedDocument } from '@exyconn/shell/graphql/generated';
import { PromptLibraryPage } from '../../../../src/pages/ai/PromptLibraryPage';
import { PROMPT_COLUMNS } from '../../../../src/pages/ai/prompts-grid';
import { PromptForm } from '../../../../src/pages/ai/forms/prompt';
import { renderWithProviders } from '../../test-utils';
import { crud, crudOptions, dashboardProps, paged, rowAction } from './crud-stub';
import { pagedPrompt, tableStats } from './ai-fixtures';

const gql = vi.hoisted(() => ({
  stats: { loading: false } as { data?: unknown; loading: boolean },
  refetchStats: vi.fn(),
  deletePrompt: vi.fn(),
}));

vi.mock('@exyconn/crud', async (orig) => ({
  ...(await orig<typeof import('@exyconn/crud')>()),
  ...(await import('./crud-stub')).crudMocks,
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPromptsStatsQuery: () => ({ ...gql.stats, refetch: gql.refetchStats }),
  useDeletePromptMutation: () => [gql.deletePrompt],
}));

const ROW = pagedPrompt();
const tiles = () => dashboardProps().stats.map((s) => [s.label, s.value]);

function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

async function copy() {
  await act(async () => {
    await rowAction('copy')(ROW);
  });
}

describe('PromptLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.stats = { loading: false };
  });

  it('lays out the library with category tiles from the stats aggregation', () => {
    gql.stats = {
      data: {
        listPromptsStats: tableStats(9, { category: { CODING: 4, WRITING: 3, MARKETING: 1 } }),
      },
      loading: false,
    };
    renderWithProviders(<PromptLibraryPage />);
    expect(dashboardProps()).toMatchObject({
      exportFileName: 'prompts',
      title: 'Prompt Library',
      subtitle: 'Reusable AI prompts',
      entityLabel: 'prompt',
      searchPlaceholder: 'Search prompts…',
      statsLoading: false,
      columnDefs: PROMPT_COLUMNS,
      fetchRows: paged.fetchRows,
      crud: crud.resource,
    });
    expect(tiles()).toEqual([
      ['Prompts', '9'],
      ['Coding', '4'],
      ['Writing', '3'],
      ['Marketing', '1'],
    ]);
  });

  it('shows placeholders, not zeros, until the stats first answer', () => {
    gql.stats = { loading: true };
    renderWithProviders(<PromptLibraryPage />);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(tiles().map(([, value]) => value)).toEqual(['0', '0', '0', '0']);
  });

  it('pages the grid through the paged prompts query', () => {
    renderWithProviders(<PromptLibraryPage />);
    const page = { rows: [ROW], totalCount: 1 };
    expect(paged.document).toBe(ListPromptsPagedDocument);
    expect(paged.select?.({ listPromptsPaged: page })).toBe(page);
  });

  it('deletes a prompt by id after a confirm that names it, then re-reads the stats', async () => {
    gql.deletePrompt.mockResolvedValue({ data: { deletePrompt: true } });
    renderWithProviders(<PromptLibraryPage />);
    const options = crudOptions();
    expect(options.label).toBe('Prompt');
    expect(options.refetch).toBe(gql.refetchStats);
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete prompt "{title}"?',
      values: { title: 'Weekly digest' },
    });
    await options.onDelete(ROW);
    expect(gql.deletePrompt).toHaveBeenCalledWith({ variables: { id: 'prompt-1' } });
  });

  it('hands edit and delete to the resource and renders the prompt form', () => {
    renderWithProviders(<PromptLibraryPage />);
    expect(rowAction('edit')).toBe(crud.resource.openEdit);
    expect(rowAction('delete')).toBe(crud.resource.remove);
    const form = dashboardProps().renderForm(null) as ReactElement<object>;
    expect(form.type).toBe(PromptForm);
    expect(form.props).toEqual({
      initial: null,
      onCancel: crud.resource.close,
      onDone: crud.resource.onDone,
    });
  });

  it('copies the prompt body to the clipboard and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderWithProviders(<PromptLibraryPage />);
    await copy();
    expect(writeText).toHaveBeenCalledWith(ROW.content);
    expect(await screen.findByText('Prompt copied to clipboard')).toBeInTheDocument();
  });

  it('says the copy failed when the clipboard refuses', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    renderWithProviders(<PromptLibraryPage />);
    await copy();
    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
  });
});
