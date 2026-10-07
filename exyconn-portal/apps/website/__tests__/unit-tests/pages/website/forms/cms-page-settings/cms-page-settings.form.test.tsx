import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsDocumentStatus, CmsPageKind, CmsPageLayout } from '@exyconn/shell/graphql/generated';
import {
  CmsPageSettingsForm,
  type CmsPageDetail,
} from '../../../../../../src/pages/website/forms/cms-page-settings';
import { renderWithProviders } from '../../../../test-utils';
import { field, pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCmsPageMutation: () => [gql.create],
  useUpdateCmsPageSettingsMutation: () => [gql.update],
}));

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const { BoundFieldStub } = await import('../form-stubs');
  return { RhfMediaField: BoundFieldStub };
});

const page: CmsPageDetail = {
  id: 'page-1',
  siteId: 'site-1',
  path: '/about-us',
  kind: CmsPageKind.Page,
  title: 'About us',
  layout: CmsPageLayout.Default,
  status: CmsDocumentStatus.Draft,
  updatedByName: 'Asha',
  updatedAt: '2026-01-02T00:00:00.000Z',
  seo: {
    title: '',
    description: '',
    keywords: '',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: null,
  },
  draft: null,
  published: null,
};

const emptySeo = {
  title: '',
  description: '',
  keywords: '',
  ogImageUrl: '',
  canonical: '',
  noindex: false,
  jsonLd: null,
};

interface Setup {
  initial?: CmsPageDetail | null;
  onCreated?: (id: string) => void;
}

function setup({ initial = null, onCreated }: Readonly<Setup> = {}) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <CmsPageSettingsForm
      siteId="site-1"
      initial={initial}
      onDone={onDone}
      onCancel={onCancel}
      onCreated={onCreated}
    />,
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

describe('CmsPageSettingsForm', () => {
  beforeEach(() => {
    gql.create.mockReset();
    gql.update.mockReset();
  });

  it('creates a page from its address, title, kind and layout only', async () => {
    gql.create.mockResolvedValue({ data: { createCmsPage: { id: 'page-9' } } });
    const onCreated = vi.fn();
    const { user, onDone } = setup({ onCreated });

    expect(screen.queryByRole('textbox', { name: 'SEO title' })).not.toBeInTheDocument();
    await user.clear(field('Path'));
    await user.type(field('Path'), '/landing');
    await user.type(field('Title'), 'Landing');
    await pickOption(user, 'Layout', 'Bare — no header or footer');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        siteId: 'site-1',
        input: {
          path: '/landing',
          title: 'Landing',
          kind: CmsPageKind.Page,
          layout: CmsPageLayout.Bare,
          seo: emptySeo,
        },
      },
    });
    expect(onCreated).toHaveBeenCalledWith('page-9');
    expect(await screen.findByText('Page created')).toBeInTheDocument();
  });

  it('finishes without an id when the server returns no data', async () => {
    gql.create.mockResolvedValue({ data: undefined });
    const onCreated = vi.fn();
    const { user, onDone } = setup({ onCreated });

    await user.type(field('Title'), 'Home');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('asks a template for a parameter in its path', async () => {
    const { user } = setup();

    await user.type(field('Title'), 'Posts');
    await user.clear(field('Path'));
    await user.type(field('Path'), '/blog');
    await pickOption(user, 'Kind', 'Template — a family, like /blog/:slug');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('A template needs a parameter in its path, like /blog/:slug'),
    ).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('edits the search settings of an existing page', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup({ initial: page });

    expect(screen.getByText('Search and sharing')).toBeInTheDocument();
    expect(field('Share image')).toHaveAttribute('data-site', 'site-1');
    await user.type(field('SEO title'), 'About Exyconn');
    await user.click(screen.getByLabelText('Hide from search engines (noindex)'));
    await user.click(field('Structured data (JSON-LD)'));
    await user.paste('{"@type":"AboutPage"}');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'page-1',
        input: {
          path: '/about-us',
          title: 'About us',
          kind: CmsPageKind.Page,
          layout: CmsPageLayout.Default,
          seo: {
            ...emptySeo,
            title: 'About Exyconn',
            noindex: true,
            jsonLd: { '@type': 'AboutPage' },
          },
        },
      },
    });
    expect(await screen.findByText('Page updated')).toBeInTheDocument();
  });

  it('rejects structured data that is not a JSON object', async () => {
    const { user } = setup({ initial: page });

    await user.click(field('Structured data (JSON-LD)'));
    await user.paste('not json');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Enter a JSON object or array, or leave it empty'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('shows the server refusal', async () => {
    gql.update.mockRejectedValue(new Error('Another page uses /about-us'));
    const { user, onDone } = setup({ initial: page });

    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Another page uses /about-us')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
