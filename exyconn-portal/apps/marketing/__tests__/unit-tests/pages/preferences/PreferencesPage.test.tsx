import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListPreferenceCategoriesPagedDocument } from '@exyconn/shell/graphql/generated';
import { PreferencesPage } from '../../../../src/pages/preferences';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';
import { dashboardProps, paged, type DashboardProps } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction } from '../../crud-page-helpers';
import { columnIds, formatCell } from '../../grid-helpers';
import { categoryRow, FOOTER } from './preferences.fixtures';

const gql = vi.hoisted(() => ({ footer: vi.fn(), refetch: vi.fn(), deleteCategory: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingFooterQuery: (options: unknown) => gql.footer(options),
  useDeletePreferenceCategoryMutation: () => [gql.deleteCategory],
}));

/** The shared stand-in, plus the children (the footer card) the real dashboard renders below. */
vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: (props: Readonly<DashboardProps & { children?: ReactNode }>) => (
      <>
        <stub.CrudDashboardStub {...props} />
        {props.children}
      </>
    ),
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/preferences/forms/preference-category', async () => ({
  PreferenceCategoryForm: (await import('../../form-stub')).FormStub,
}));

/** The footer form has its own tests: this stand-in shows what it got and saves on demand. */
vi.mock('../../../../src/pages/preferences/forms/marketing-footer', () => ({
  MarketingFooterForm: ({
    initial,
    onSaved,
  }: Readonly<{ initial: { companyName: string }; onSaved: () => void }>) => (
    <div>
      <p>{`Footer form for ${initial.companyName}`}</p>
      <button type="button" onClick={onSaved}>
        Save footer stub
      </button>
    </div>
  ),
}));

describe('PreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteCategory.mockResolvedValue({ data: { deletePreferenceCategory: true } });
    gql.footer.mockReturnValue({
      ...answered({ marketingFooter: FOOTER }),
      refetch: gql.refetch,
    });
  });

  it('drives the category grid from the paged query, with no stat tiles', () => {
    renderWithProviders(<PreferencesPage />);
    const page = { totalCount: 1, rows: [categoryRow()] };

    expect(paged.document).toBe(ListPreferenceCategoriesPagedDocument);
    expect(paged.select?.({ listPreferenceCategoriesPaged: page } as never)).toBe(page);
    expect(dashboardProps().stats).toEqual([]);
    expect(dashboardProps()).toMatchObject({
      title: 'Email preferences',
      subtitle: 'What recipients can turn off, and the footer every email ends with',
      entityLabel: 'category',
      searchPlaceholder: 'Search categories…',
    });
    expect(Object.keys(dashboardProps().context.actions)).toEqual(['edit', 'delete']);
  });

  it('lists each category with its description, whether it is offered and its order', () => {
    renderWithProviders(<PreferencesPage />);
    const columns = dashboardProps().columnDefs;

    expect(columnIds(columns)).toEqual(['name', 'description', 'isActive', 'sortOrder', 'actions']);
    expect(formatCell(columns, 'description', categoryRow({ description: '' }))).toBe('—');
    expect(formatCell(columns, 'description', categoryRow())).toBe('Launches and new features');
    expect(formatCell(columns, 'sortOrder', categoryRow({ sortOrder: 7 }))).toBe('7');
  });

  it('opens a blank form for a new category and closes it once saved', async () => {
    renderWithProviders(<PreferencesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
  });

  it('opens the form on the row being edited, and Cancel closes it', async () => {
    renderWithProviders(<PreferencesPage />);
    const row = categoryRow({ id: 'cat-5', name: 'Events' });

    await runRowAction('edit', row);
    expect(screen.getByText(`Form for ${JSON.stringify(row)}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
  });

  it('deletes a category only after warning that its choices stop applying', async () => {
    renderWithProviders(<PreferencesPage />);

    await confirmRowDelete(
      categoryRow({ id: 'cat-2', name: 'Events' }),
      'Delete “Events”? Recipients’ choices for it are no longer applied.',
    );

    expect(gql.deleteCategory).toHaveBeenCalledWith({ variables: { id: 'cat-2' } });
    expect(await screen.findByText('Category deleted')).toBeInTheDocument();
  });

  it('loads the footer fresh and re-reads it once saved', async () => {
    renderWithProviders(<PreferencesPage />);

    expect(gql.footer).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });
    expect(screen.getByRole('heading', { name: 'Email footer' })).toBeInTheDocument();
    expect(screen.getByText('Footer form for Acme Corp')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save footer stub' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('shows a placeholder while the footer loads', () => {
    gql.footer.mockReturnValue(pending());
    const { container } = renderWithProviders(<PreferencesPage />);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByText(/^Footer form for/)).not.toBeInTheDocument();
  });

  it('shows why the footer could not be loaded', () => {
    gql.footer.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Not allowed'),
      refetch: gql.refetch,
    });
    const { container } = renderWithProviders(<PreferencesPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument();
  });
});
