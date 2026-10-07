import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FragmentsPage } from '../../../../../src/pages/cms/fragments';
import { UrlProbe, queryResult, renderInSite } from '../cms-helpers';
import { FRAGMENTS } from './fragments.fixtures';

const gql = vi.hoisted(() => ({ fragments: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsFragmentsQuery: () => gql.fragments(),
  useDeleteCmsFragmentMutation: () => [vi.fn()],
  usePublishCmsFragmentMutation: () => [vi.fn()],
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

const renderPage = () =>
  renderInSite(
    <>
      <FragmentsPage />
      <UrlProbe />
    </>,
    { route: '/website/s/main/fragments' },
  );

describe('FragmentsPage forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.fragments.mockReturnValue(
      queryResult({ cmsFragments: FRAGMENTS }, { refetch: gql.refetch }),
    );
  });

  it('opens a blank form for the site and returns to the list on cancel', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New fragment' }));
    expect(screen.getByRole('heading', { name: 'New fragment' })).toBeInTheDocument();
    expect(screen.getByText('Blank form on site-1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.getByRole('heading', { name: 'Fragments' })).toBeInTheDocument();
  });

  it('opens a new fragment in the builder once it is created', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New fragment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create in form' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/website/s/main/fragments/created-1/edit',
    );
  });

  it('edits a fragment and reloads the list when done', async () => {
    renderPage();
    const row = screen.getByText('Main header').closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit fragment' })).toBeInTheDocument();
    expect(screen.getByText('Form for fragment-1 on site-1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.getByRole('heading', { name: 'Fragments' })).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('goes back to the list from the form header', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New fragment' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back to Fragments' }));

    expect(screen.queryByText('Blank form on site-1')).not.toBeInTheDocument();
  });
});
