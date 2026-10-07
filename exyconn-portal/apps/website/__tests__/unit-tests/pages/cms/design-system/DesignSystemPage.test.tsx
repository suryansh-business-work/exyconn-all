import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignSystemPage } from '../../../../../src/pages/cms/design-system';
import { UrlProbe, queryResult, renderInSite, siteFixture } from '../cms-helpers';

const gql = vi.hoisted(() => ({
  designs: vi.fn(),
  create: vi.fn(),
  refetch: vi.fn(),
  creating: { loading: false },
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsDesignSystemsQuery: (options: unknown) => gql.designs(options),
  useCreateCmsDesignSystemMutation: () => [gql.create, gql.creating],
}));

vi.mock('../../../../../src/pages/website/forms/cms-design-system', () => ({
  DesignSystemForm: (
    props: Readonly<{
      design: { name: string };
      basePath: string;
      onCancel: () => void;
      onDone: () => void;
    }>,
  ) => (
    <div>
      <p>{`Editing ${props.design.name} at ${props.basePath}`}</p>
      <button type="button" onClick={props.onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={props.onDone}>
        Finish form
      </button>
    </div>
  ),
}));

const design = (id: string, name: string) => ({ id, name, siteId: 'site-1', tokens: {} });

const answer = (designs: unknown[] | undefined, extra: { loading?: boolean; error?: Error } = {}) =>
  gql.designs.mockReturnValue(
    queryResult(designs && { cmsDesignSystems: designs }, { ...extra, refetch: gql.refetch }),
  );

const renderPage = (site = siteFixture()) =>
  renderInSite(
    <>
      <DesignSystemPage />
      <UrlProbe />
    </>,
    { site, route: '/website/s/main/design-system' },
  );

describe('DesignSystemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.creating.loading = false;
    gql.refetch.mockResolvedValue({});
    gql.create.mockResolvedValue({ data: {} });
    answer([design('design-0', 'Old look'), design('design-1', 'Current look')]);
  });

  it("edits the design system the site wears, read for the site's id", () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Design System' })).toBeInTheDocument();
    expect(
      screen.getByText('Colours, type and shape of Exyconn, as CSS custom properties'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Editing Current look at /website/s/main/design-system'),
    ).toBeInTheDocument();
    expect(gql.designs).toHaveBeenCalledWith({
      variables: { siteId: 'site-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows the first design system of a site that points at none', () => {
    renderPage(siteFixture({ designSystemId: '' }));
    expect(screen.getByText(/Editing Old look/)).toBeInTheDocument();
  });

  it('goes back to the site overview on cancel and reloads when done', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.getByLabelText('current url')).toHaveTextContent(/^\/website\/s\/main$/);
  });

  it('reports a reload that failed after saving', async () => {
    gql.refetch.mockRejectedValueOnce('offline');
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(await screen.findByText('Reload failed')).toBeInTheDocument();
  });

  it('shows a spinner while loading and the reason when reading failed', () => {
    answer(undefined, { loading: true });
    const { unmount } = renderPage();
    expect(
      screen.getByRole('progressbar', { name: 'Loading the design system' }),
    ).toBeInTheDocument();
    unmount();

    answer(undefined, { error: new Error('Server down') });
    renderPage();
    expect(screen.getByText('Server down')).toBeInTheDocument();
  });

  it('creates a design system for a site that has none, then reloads', async () => {
    answer([]);
    renderPage();
    expect(screen.getByText('This site has no design system yet.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create one' }));

    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { siteId: 'site-1', name: 'Exyconn design system', tokens: {} } },
    });
    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });

  it('says why the design system could not be created', async () => {
    answer([]);
    gql.create.mockRejectedValueOnce(new Error('Name taken'));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Create one' }));
    expect(await screen.findByText('Name taken')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the create fails without a reason', async () => {
    answer([]);
    gql.create.mockRejectedValueOnce('offline');
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Create one' }));
    expect(await screen.findByText('Could not create the design system')).toBeInTheDocument();
  });

  it('disables Create one while the create is in flight', () => {
    answer([]);
    gql.creating.loading = true;
    renderPage();
    expect(screen.getByRole('button', { name: 'Create one' })).toBeDisabled();
  });
});
