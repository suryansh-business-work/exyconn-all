import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FragmentsPage } from '../../../../../src/pages/cms/fragments';
import { moduleDashboard, statTiles } from '../cms-dashboard-stub';
import { UrlProbe, queryResult, renderInSite } from '../cms-helpers';
import { FRAGMENTS } from './fragments.fixtures';

const gql = vi.hoisted(() => ({
  fragments: vi.fn(),
  refetch: vi.fn(),
  deleteFragment: vi.fn(),
  publish: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsFragmentsQuery: (options: unknown) => gql.fragments(options),
  useDeleteCmsFragmentMutation: () => [gql.deleteFragment],
  usePublishCmsFragmentMutation: () => [gql.publish],
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../cms-settings.mock')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', async () => ({
  ModuleDashboard: (await import('../cms-dashboard-stub')).ModuleDashboardStub,
}));
vi.mock('../../../../../src/pages/website/forms/cms-fragment', async () => ({
  CmsFragmentForm: (await import('../cms-form-stub')).CmsFormStub,
}));

const answer = (rows: unknown[] | undefined, loading = false) =>
  gql.fragments.mockReturnValue(
    queryResult(rows && { cmsFragments: rows }, { loading, refetch: gql.refetch }),
  );

const renderPage = () =>
  renderInSite(
    <>
      <FragmentsPage />
      <UrlProbe />
    </>,
    { route: '/website/s/main/fragments' },
  );

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
const url = () => screen.getByLabelText('current url');

describe('FragmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteFragment.mockResolvedValue({ data: { deleteCmsFragment: true } });
    gql.publish.mockResolvedValue({ data: {} });
    answer(FRAGMENTS);
  });

  it("counts the site's fragments and those with unpublished changes", () => {
    renderPage();

    expect(gql.fragments).toHaveBeenCalledWith({
      variables: { siteId: 'site-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(statTiles()).toEqual({ Fragments: '3', 'Unpublished changes': '2' });
    expect(moduleDashboard.props).toMatchObject({
      title: 'Fragments',
      subtitleValues: { site: 'Exyconn' },
      statsLoading: false,
    });
  });

  it('marks the tiles loading until the first answer', () => {
    answer(undefined, true);
    renderPage();

    expect(statTiles()).toEqual({ Fragments: '0', 'Unpublished changes': '0' });
    expect(moduleDashboard.props?.statsLoading).toBe(true);
  });

  it('lists each fragment with its kind, status, author and date', () => {
    renderPage();
    const footer = rowOf('Site footer');

    expect(within(rowOf('Main header')).getByText('Header')).toBeInTheDocument();
    expect(within(rowOf('Main header')).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(footer).getByText('Footer')).toBeInTheDocument();
    expect(within(footer).getByText('DRAFT')).toBeInTheDocument();
    expect(within(footer).getByText('—')).toBeInTheDocument();
    expect(within(footer).getByText('on 2026-03-04')).toBeInTheDocument();
  });

  it('filters the list by kind and back to every kind', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(
      screen.getByRole('option', { name: 'Footer — the bottom of every page' }),
    );
    expect(screen.getByText('Site footer')).toBeInTheDocument();
    expect(screen.queryByText('Main header')).not.toBeInTheDocument();

    // The menu closes before the page is reachable again.
    await userEvent.click(await screen.findByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Every kind' }));
    expect(screen.getByText('Main header')).toBeInTheDocument();
  });

  it('opens a fragment in the builder from its row or its builder action', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Pricing band'));
    expect(url()).toHaveTextContent('/website/s/main/fragments/fragment-3/edit');

    await userEvent.click(
      within(rowOf('Site footer')).getByRole('button', { name: 'Edit in the builder' }),
    );
    expect(url()).toHaveTextContent('/website/s/main/fragments/fragment-2/edit');
  });

  it('offers publishing only for unpublished work and publishes it', async () => {
    renderPage();

    expect(
      within(rowOf('Main header')).queryByRole('button', { name: 'Publish fragment' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      within(rowOf('Site footer')).getByRole('button', { name: 'Publish fragment' }),
    );

    expect(gql.publish).toHaveBeenCalledWith({ variables: { id: 'fragment-2' } });
    expect(
      await screen.findByText('Site footer is live on every page that uses it'),
    ).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a fragment after confirming', async () => {
    renderPage();

    await userEvent.click(within(rowOf('Pricing band')).getByRole('button', { name: 'delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete the fragment Pricing band?')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(gql.deleteFragment).toHaveBeenCalledWith({ variables: { id: 'fragment-3' } });
    expect(await screen.findByText('Fragment deleted')).toBeInTheDocument();
  });
});
