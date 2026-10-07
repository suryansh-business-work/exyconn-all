import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListEmailTemplatesPagedDocument } from '@exyconn/shell/graphql/generated';
import { EmailTemplatesPanel } from '../../../../src/pages/email/EmailTemplatesPanel';
import { TEMPLATE_COLUMNS, type PagedTemplateRow } from '../../../../src/pages/email/email-grids';
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
  useDeleteEmailTemplateMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () =>
  (await import('../environment-variables/panel.harness')).crudModule(),
);
vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () =>
  (await import('../environment-variables/panel.harness')).propsModule('ServerDataGrid'),
);
vi.mock('../../../../src/pages/email/EmailPreviewDialog', async () =>
  (await import('../environment-variables/panel.harness')).dialogModule('EmailPreviewDialog'),
);
vi.mock('../../../../src/pages/email/forms/email-template', async () =>
  (await import('../environment-variables/panel.harness')).formModule('EmailTemplateForm'),
);

const ROW: PagedTemplateRow = {
  id: 'tpl-1',
  key: 'welcome',
  name: 'Welcome',
  description: '',
  subject: 'Hello {{name}}',
  mjml: '<mjml></mjml>',
  isActive: true,
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
  variables: ['name'],
  fragments: ['footer'],
};

interface GridContext {
  actions: Record<string, (row: PagedTemplateRow) => void>;
  formatDate: (value: string) => string;
}

describe('EmailTemplatesPanel', () => {
  beforeEach(() => {
    resetHarness();
    gql.remove.mockReset();
  });

  it('lists templates on the paged grid with preview, edit and delete wired', () => {
    renderWithProviders(<EmailTemplatesPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Templates' })).toBeInTheDocument();
    const grid = propsOf('ServerDataGrid');
    expect(grid).toMatchObject({
      columnDefs: TEMPLATE_COLUMNS,
      fetchRows,
      refreshSignal: crud.refreshSignal,
      searchPlaceholder: 'Search by key, name or subject…',
    });
    const context = grid.context as GridContext;
    expect(context.actions.edit).toBe(crud.openEdit);
    expect(context.actions.delete).toBe(crud.remove);
    expect(context.formatDate('2026-09-01')).toBe('2026-09-01');
  });

  it('reads its rows from the paged templates query', () => {
    renderWithProviders(<EmailTemplatesPanel />);
    const page = { rows: [ROW], totalCount: 1 };
    expect(recorded.fetcher?.document).toBe(ListEmailTemplatesPagedDocument);
    expect(recorded.fetcher?.select({ listEmailTemplatesPaged: page })).toBe(page);
  });

  it('deletes by id after warning that anything sending it will fail', async () => {
    gql.remove.mockResolvedValue({ data: {} });
    renderWithProviders(<EmailTemplatesPanel />);
    const options = resourceOptions();
    expect(options.label).toBe('Template');
    expect(options.confirmMessage(ROW)).toEqual({
      message: 'Delete the "{name}" template? Anything sending it will fail.',
      values: { name: 'Welcome' },
    });
    await options.onDelete(ROW);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'tpl-1' } });
  });

  it('previews a row and closes the preview again', async () => {
    renderWithProviders(<EmailTemplatesPanel />);
    expect(propsOf('EmailPreviewDialog').template).toBeNull();
    const context = propsOf('ServerDataGrid').context as GridContext;
    act(() => context.actions.preview(ROW));
    expect(propsOf('EmailPreviewDialog').template).toBe(ROW);
    await userEvent.click(screen.getByRole('button', { name: 'stub close' }));
    expect(propsOf('EmailPreviewDialog').template).toBeNull();
  });

  it('starts a new template from the header', async () => {
    renderWithProviders(<EmailTemplatesPanel />);
    await userEvent.click(screen.getByRole('button', { name: 'New template' }));
    expect(crud.openCreate).toHaveBeenCalledTimes(1);
  });

  it('swaps the grid for a blank form when creating', async () => {
    crudState.open = true;
    renderWithProviders(<EmailTemplatesPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'New template' })).toBeInTheDocument();
    expect(screen.queryByTestId('ServerDataGrid')).not.toBeInTheDocument();
    expect(forms.EmailTemplateForm).toMatchObject({
      initial: null,
      onCancel: crud.close,
      onDone: crud.onDone,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Back to Templates' }));
    expect(crud.close).toHaveBeenCalledTimes(1);
  });

  it('opens the form on the template being edited', () => {
    crudState.open = true;
    crudState.editing = { ...ROW };
    renderWithProviders(<EmailTemplatesPanel />);
    expect(screen.getByRole('heading', { level: 1, name: 'Edit template' })).toBeInTheDocument();
    expect(forms.EmailTemplateForm?.initial).toEqual(ROW);
  });
});
