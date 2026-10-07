import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavLinksPage } from '../../../../src/pages/website/NavLinksPage';
import { renderInSite } from '../cms/cms-helpers';
import { moduleDashboard, statTiles } from '../cms/cms-dashboard-stub';
import { pendingQuery } from './content-page-helpers';

const gql = vi.hoisted(() => ({ list: vi.fn(), refetch: vi.fn(), deleteLink: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListNavLinksQuery: () => gql.list(),
  useDeleteNavLinkMutation: () => [gql.deleteLink],
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', async () => ({
  ModuleDashboard: (await import('../cms/cms-dashboard-stub')).ModuleDashboardStub,
}));

vi.mock('../../../../src/pages/website/forms/nav-link', async () => ({
  NavLinkForm: (await import('./content-form-stub')).ContentFormStub,
}));

const link = (overrides: Record<string, unknown> = {}) => ({
  id: 'link-1',
  siteId: 'site-1',
  label: 'Pricing',
  href: '/pricing',
  description: '',
  category: 'General',
  keywords: '',
  isActive: true,
  order: 1,
  ...overrides,
});

describe('NavLinksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteLink.mockResolvedValue({ data: { deleteNavLink: true } });
    gql.list.mockReturnValue({
      data: {
        listNavLinks: [
          link({ id: 'a' }),
          link({ id: 'b', label: 'Careers', category: 'Company', isActive: false, order: 2 }),
          link({ id: 'c', siteId: 'site-2', label: 'Elsewhere' }),
        ],
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts and lists the current site’s links with their status', () => {
    renderInSite(<NavLinksPage />);

    expect(statTiles()).toEqual({ Links: '2', Active: '1', Categories: '2' });
    expect(moduleDashboard.props?.subtitleValues).toEqual({ site: 'Exyconn' });
    expect(moduleDashboard.props?.statsLoading).toBe(false);
    const careers = within(screen.getByRole('row', { name: /Careers/ }));
    expect(careers.getByText('INACTIVE')).toBeInTheDocument();
    const pricing = within(screen.getByRole('row', { name: /Pricing/ }));
    expect(pricing.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.queryByText('Elsewhere')).not.toBeInTheDocument();
  });

  it('marks the tiles loading and counts nothing before the links arrive', () => {
    gql.list.mockReturnValue(pendingQuery());
    renderInSite(<NavLinksPage />);

    expect(moduleDashboard.props?.statsLoading).toBe(true);
    expect(statTiles()).toEqual({ Links: '0', Active: '0', Categories: '0' });
  });

  it('opens a blank form for a new link and goes back to the list', async () => {
    renderInSite(<NavLinksPage />);

    await userEvent.click(screen.getByRole('button', { name: 'New nav link' }));

    expect(screen.getByRole('heading', { name: 'New nav link' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Back to Navigation links' }));
    expect(screen.getByRole('heading', { name: 'Navigation links' })).toBeInTheDocument();
  });

  it('edits a link and re-reads the list when the form is done', async () => {
    renderInSite(<NavLinksPage />);

    const careers = within(screen.getByRole('row', { name: /Careers/ }));
    await userEvent.click(careers.getByRole('button', { name: 'edit' }));

    expect(screen.getByRole('heading', { name: 'Edit nav link' })).toBeInTheDocument();
    expect(screen.getByText(/"label":"Careers"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Navigation links' })).toBeInTheDocument();
  });

  it('deletes a link after confirming, by its id', async () => {
    renderInSite(<NavLinksPage />);

    const pricing = within(screen.getByRole('row', { name: /Pricing/ }));
    await userEvent.click(pricing.getByRole('button', { name: 'delete' }));
    expect(await screen.findByText('Delete nav link "Pricing"?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Nav link deleted')).toBeInTheDocument();
    expect(gql.deleteLink).toHaveBeenCalledWith({ variables: { id: 'a' } });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
