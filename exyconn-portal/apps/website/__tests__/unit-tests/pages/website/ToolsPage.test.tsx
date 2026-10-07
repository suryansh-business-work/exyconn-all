import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListToolsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ToolsPage } from '../../../../src/pages/website/ToolsPage';
import { TOOL_COLUMNS } from '../../../../src/pages/website/tools-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, paged, statValues } from './content-dashboard-stub';
import { confirmRowDelete, pendingQuery, runRowAction } from './content-page-helpers';
import { toolRow } from './content-fixtures';

const gql = vi.hoisted(() => ({ list: vi.fn(), deleteTool: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListToolsQuery: () => gql.list(),
  useDeleteToolMutation: () => [gql.deleteTool],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('./content-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/website/forms/tool', async () => ({
  ToolForm: (await import('./content-form-stub')).ContentFormStub,
}));

describe('ToolsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.deleteTool.mockResolvedValue({ data: { deleteTool: true } });
    gql.list.mockReturnValue({
      data: {
        listTools: [
          toolRow({ id: 'a', isMVP: true }),
          toolRow({ id: 'b', isActive: false, categorySlug: 'design' }),
          toolRow({ id: 'c' }),
        ],
      },
      loading: false,
    });
  });

  it('counts every tool, the active and MVP ones and their categories', () => {
    renderWithProviders(<ToolsPage />);

    expect(statValues()).toEqual({ Tools: '3', Active: '2', MVP: '1', Categories: '2' });
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the tools arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderWithProviders(<ToolsPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statValues().Tools).toBe('0');
  });

  it('drives the server grid with the paged tools query, across every site', () => {
    renderWithProviders(<ToolsPage />);
    const page = { totalCount: 1, rows: [toolRow()] };

    expect(paged.document).toBe(ListToolsPagedDocument);
    expect(paged.select?.({ listToolsPaged: page } as never)).toBe(page);
    expect(paged.extraFilters).toBeUndefined();
    expect(dashboardProps().columnDefs).toBe(TOOL_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Tools', exportFileName: 'tools' });
  });

  it('opens the form for a new and an existing tool', async () => {
    renderWithProviders(<ToolsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', toolRow({ name: 'Edited tool' }));
    expect(screen.getByText(/"name":"Edited tool"/)).toBeInTheDocument();
  });

  it('deletes a tool after confirming, by its id', async () => {
    renderWithProviders(<ToolsPage />);

    await confirmRowDelete(toolRow({ id: 'tool-4' }), 'Delete tool JSON formatter?');

    expect(gql.deleteTool).toHaveBeenCalledWith({ variables: { id: 'tool-4' } });
    expect(await screen.findByText('Tool deleted')).toBeInTheDocument();
  });
});
