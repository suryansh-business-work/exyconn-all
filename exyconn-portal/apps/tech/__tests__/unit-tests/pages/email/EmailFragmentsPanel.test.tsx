import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListEmailFragmentsPagedDocument } from '@exyconn/shell/graphql/generated';
import { EmailFragmentsPanel } from '../../../../src/pages/email/EmailFragmentsPanel';
import { FRAGMENT_COLUMNS, type PagedFragmentRow } from '../../../../src/pages/email/email-grids';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  crudState,
  fetchRows,
  forms,
  propsOf,
  recorded,
  resetHarness,
  resourceOptions,
} from '../environment-variables/panel.harness';

const gql = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteEmailFragmentMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () =>
  (await import('../environment-variables/panel.harness')).crudModule(),
);
vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () =>
  (await import('../environment-variables/panel.harness')).propsModule('ServerDataGrid'),
);
vi.mock('../../../../src/pages/email/forms/email-fragment', async () =>
  (await import('../environment-variables/panel.harness')).formModule('EmailFragmentForm'),
);

const ROW: PagedFragmentRow = {
  id: 'frag-1',
  key: 'footer',
  name: 'Footer',
  description: 'Address and unsubscribe',
  mjml: '<mj-section></mj-section>',
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

interface GridContext {
  actions: Record<string, unknown>;
  formatDate: (value: string) => string;
}

describe('EmailFragmentsPanel', () => {
  beforeEach(() => {
    resetHarness();
    gql.remove.mockReset();
  });

  it('lists fragments on the paged grid with edit and delete wired', () => {
    renderWithProviders(<EmailFragmentsPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Fragments' })).toBeInTheDocument();
    const grid = propsOf('ServerDataGrid');
    expect(grid).toMatchObject({
      columnDefs: FRAGMENT_COLUMNS,
      fetchRows,
      refreshSignal: crud.refreshSignal,
      searchPlaceholder: 'Search by key, name or description…',
    });
    const context = grid.context as GridContext;
    expect(context.actions).toEqual({ edit: crud.openEdit, delete: crud.remove });
    expect(context.formatDate('2026-09-01')).toBe('2026-09-01');
  });

  it('reads its rows from the paged fragments query', () => {
    renderWithProviders(<EmailFragmentsPanel />);
    const page = { rows: [ROW], totalCount: 1 };
    expect(recorded.fetcher?.document).toBe(ListEmailFragmentsPagedDocument);
    expect(recorded.fetcher?.select({ listEmailFragmentsPaged: page })).toBe(page);
  });

  it('deletes by id after naming the include every template will lose', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<EmailFragmentsPanel />);
    const options = resourceOptions();
    expect(options.label).toBe('Fragment');
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete "{name}"? Every template that includes {include} will stop sending.',
      values: { name: 'Footer', include: '{{> footer }}' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'frag-1' } });
  });

  it('starts a new fragment from the header', async () => {
    renderWithProviders(<EmailFragmentsPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'New fragment' }));
    expect(crud.openCreate).toHaveBeenCalledTimes(1);
  });

  it('swaps the grid for a blank form when creating', async () => {
    crudState.open = true;
    renderWithProviders(<EmailFragmentsPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'New fragment' })).toBeInTheDocument();
    expect(screen.queryByTestId('ServerDataGrid')).not.toBeInTheDocument();
    expect(forms.EmailFragmentForm).toMatchObject({
      initial: null,
      onCancel: crud.close,
      onDone: crud.onDone,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Back to Fragments' }));
    expect(crud.close).toHaveBeenCalledTimes(1);
  });

  it('opens the form on the fragment being edited', () => {
    crudState.open = true;
    crudState.editing = { ...ROW };
    renderWithProviders(<EmailFragmentsPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Edit fragment' })).toBeInTheDocument();
    expect(forms.EmailFragmentForm?.initial).toEqual(ROW);
  });
});
