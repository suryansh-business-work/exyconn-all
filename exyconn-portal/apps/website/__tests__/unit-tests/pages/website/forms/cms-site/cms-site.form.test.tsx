import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsFragmentKind } from '@exyconn/shell/graphql/generated';
import { CmsSiteForm, type CmsSiteRow } from '../../../../../../src/pages/website/forms/cms-site';
import { toSiteFormValues } from '../../../../../../src/pages/website/forms/cms-site/cms-site.types';
import { renderWithProviders } from '../../../../test-utils';
import { field } from '../form-helpers';
import { siteFixture } from '../../../cms/cms-helpers';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  mutationOptions: vi.fn(),
  fragments: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCmsSiteMutation: (options: unknown) => {
    gql.mutationOptions(options);
    return [gql.create];
  },
  useUpdateCmsSiteMutation: (options: unknown) => {
    gql.mutationOptions(options);
    return [gql.update];
  },
  useCmsFragmentsQuery: () => gql.fragments(),
  useCmsDesignSystemsQuery: () => ({ data: { cmsDesignSystems: [] } }),
  useCmsPagesQuery: () => ({ data: { cmsPages: { rows: [] } } }),
}));

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const { BoundFieldStub } = await import('../form-stubs');
  return { RhfMediaField: BoundFieldStub };
});

const SAVE_FIRST = 'Available once the site is saved.';

interface Setup {
  initial?: CmsSiteRow | null;
  onSaved?: (site: CmsSiteRow) => void;
}

function setup({ initial = null, onSaved }: Readonly<Setup> = {}) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CmsSiteForm initial={initial} onDone={onDone} onCancel={onCancel} onSaved={onSaved} />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('CmsSiteForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
    gql.mutationOptions.mockReset();
    gql.fragments.mockReset().mockReturnValue({
      data: {
        cmsFragments: [{ id: 'frag-h', name: 'Main header', kind: CmsFragmentKind.Header }],
      },
    });
  });

  it('creates a draft site with its domains, refreshing the site list', async () => {
    gql.create.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    expect(gql.mutationOptions).toHaveBeenCalledWith({ refetchQueries: ['CmsSites'] });
    expect(screen.getAllByText(SAVE_FIRST)).toHaveLength(4);
    expect(field('Favicon')).toHaveAttribute('data-site', '');
    await user.type(field('Name'), 'Docs');
    await user.type(field('Key'), 'docs');
    await user.type(screen.getByRole('combobox', { name: 'Domains' }), 'Docs.Example.com{Enter}');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          ...toSiteFormValues(null),
          name: 'Docs',
          slug: 'docs',
          domains: ['docs.example.com'],
        },
      },
    });
    expect(await screen.findByText('Website created')).toBeInTheDocument();
  });

  it('needs a name and a key before saving', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('The key needs at least 2 characters')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('updates a site with the header picked and hands the saved site back', async () => {
    const site = siteFixture();
    const saved = siteFixture({ headerFragmentId: 'frag-h' });
    gql.update.mockResolvedValue({ data: { updateCmsSite: saved } });
    const onSaved = vi.fn();
    const { user, onDone } = setup({ initial: site, onSaved });

    expect(screen.queryByText(SAVE_FIRST)).not.toBeInTheDocument();
    expect(screen.getByText('Its colours, fonts and radii style every page.')).toBeInTheDocument();
    expect(field('Default share image')).toHaveAttribute('data-site', 'site-1');
    await user.click(screen.getByRole('combobox', { name: 'Header fragment' }));
    await user.click(screen.getByRole('option', { name: 'Main header' }));
    await user.click(field('Global CSS'));
    await user.paste('body { margin: 0; }');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'site-1',
        input: {
          ...toSiteFormValues(site),
          headerFragmentId: 'frag-h',
          globalCss: 'body { margin: 0; }',
        },
      },
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(await screen.findByText('Website updated')).toBeInTheDocument();
  });

  it('does not report a saved site when the server returns no data', async () => {
    gql.update.mockResolvedValue({ data: undefined });
    const onSaved = vi.fn();
    const { user, onDone } = setup({ initial: siteFixture(), onSaved });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves without a saved-site callback', async () => {
    gql.update.mockResolvedValue({ data: { updateCmsSite: siteFixture() } });
    const { user, onDone } = setup({ initial: siteFixture() });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("shows the server's refusal", async () => {
    gql.update.mockRejectedValue(new Error('Domain exyconn.com belongs to another site'));
    const { user, onDone } = setup({ initial: siteFixture() });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Domain exyconn.com belongs to another site'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
