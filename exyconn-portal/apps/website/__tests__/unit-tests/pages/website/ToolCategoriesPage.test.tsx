import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolCategoriesPage } from '../../../../src/pages/website/ToolCategoriesPage';
import { renderWithProviders } from '../../test-utils';
import { moduleDashboard, statTiles } from '../cms/cms-dashboard-stub';
import { pendingQuery } from './content-page-helpers';

const gql = vi.hoisted(() => ({ list: vi.fn(), refetch: vi.fn(), deleteCategory: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListToolCategoriesQuery: () => gql.list(),
  useDeleteToolCategoryMutation: () => [gql.deleteCategory],
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', async () => ({
  ModuleDashboard: (await import('../cms/cms-dashboard-stub')).ModuleDashboardStub,
}));

vi.mock('../../../../src/pages/website/forms/tool-category', async () => ({
  ToolCategoryForm: (await import('./content-form-stub')).ContentFormStub,
}));

const category = (overrides: Record<string, unknown> = {}) => ({
  id: 'cat-1',
  slug: 'developer',
  category: 'Developer',
  description: '',
  icon: 'code',
  color: 'blue',
  isActive: true,
  order: 1,
  ...overrides,
});

describe('ToolCategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteCategory.mockResolvedValue({ data: { deleteToolCategory: true } });
    gql.list.mockReturnValue({
      data: {
        listToolCategories: [
          category({ id: 'a' }),
          category({ id: 'b', slug: 'design', category: 'Design', isActive: false }),
        ],
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts and lists every category with its status', () => {
    renderWithProviders(<ToolCategoriesPage />);

    expect(statTiles()).toEqual({ Categories: '2', Active: '1' });
    expect(moduleDashboard.props?.statsLoading).toBe(false);
    const design = within(screen.getByRole('row', { name: /Design/ }));
    expect(design.getByText('INACTIVE')).toBeInTheDocument();
    const developer = within(screen.getByRole('row', { name: /Developer/ }));
    expect(developer.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('marks the tiles loading and counts nothing before the categories arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderWithProviders(<ToolCategoriesPage />);

    expect(moduleDashboard.props?.statsLoading).toBe(true);
    expect(statTiles()).toEqual({ Categories: '0', Active: '0' });
  });

  it('opens a blank form for a new category and goes back to the list', async () => {
    renderWithProviders(<ToolCategoriesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'New category' }));

    expect(screen.getByRole('heading', { name: 'New tool category' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Tool categories' }));
    expect(screen.getByRole('heading', { name: 'Tool categories' })).toBeInTheDocument();
  });

  it('edits a category and re-reads the list when the form is done', async () => {
    renderWithProviders(<ToolCategoriesPage />);

    const design = within(screen.getByRole('row', { name: /Design/ }));
    await userEvent.click(design.getByRole('button', { name: 'edit' }));

    expect(screen.getByRole('heading', { name: 'Edit tool category' })).toBeInTheDocument();
    expect(screen.getByText(/"category":"Design"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Tool categories' })).toBeInTheDocument();
  });

  it('deletes a category after confirming, by its id', async () => {
    renderWithProviders(<ToolCategoriesPage />);

    const developer = within(screen.getByRole('row', { name: /Developer/ }));
    await userEvent.click(developer.getByRole('button', { name: 'delete' }));
    expect(await screen.findByText('Delete tool category Developer?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Tool category deleted')).toBeInTheDocument();
    expect(gql.deleteCategory).toHaveBeenCalledWith({ variables: { id: 'a' } });
  });
});
