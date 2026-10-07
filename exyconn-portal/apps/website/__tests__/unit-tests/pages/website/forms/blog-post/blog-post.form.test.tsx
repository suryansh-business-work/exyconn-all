import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { BlogPostForm, type BlogRow } from '../../../../../../src/pages/website/forms/blog-post';
import { renderWithProviders } from '../../../../test-utils';
import { renderInSite } from '../../../cms/cms-helpers';
import { blogRow } from '../../content-fixtures';
import { fillField, press } from '../content-form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateBlogPostMutation: () => [gql.create],
  useUpdateBlogPostMutation: () => [gql.update],
}));

/** The rich-text body has its own tests; here it only shows where its images go. */
vi.mock('../../../../../../src/pages/website/live-edit', () => ({
  ArticleBodyField: ({ folder }: Readonly<{ folder: string }>) => (
    <p>{`Body images in ${folder}`}</p>
  ),
}));

function renderForm(initial: BlogRow | null = null, inSite = true) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const form = <BlogPostForm initial={initial} onDone={onDone} onCancel={onCancel} />;
  if (inSite) {
    renderInSite(form);
  } else {
    renderWithProviders(form);
  }
  return { onDone, onCancel };
}

async function fillRequired() {
  await fillField('Slug', 'scaling-graphql');
  await fillField('Title', 'Scaling GraphQL');
  await fillField('Author name', 'Ada Lovelace');
}

const NEW_POST = {
  slug: 'scaling-graphql',
  title: 'Scaling GraphQL',
  summary: '',
  content: '',
  contentCss: '',
  author: { name: 'Ada Lovelace', role: '', initials: '' },
  readTime: '',
  tags: [],
  coverImage: '',
  featured: false,
  isActive: true,
  publishedAt: null,
};

describe('BlogPostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createBlogPost: { id: 'post-9' } } });
    gql.update.mockResolvedValue({ data: { updateBlogPost: { id: 'post-1' } } });
  });

  it('requires a slug, a title and an author name', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Slug is required')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Author name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a slug with spaces and a cover image that is not a link', async () => {
    renderForm();
    await fillRequired();
    await fillField('Slug', 'Scaling GraphQL');
    await fillField('Cover image URL', 'cover.png');

    await press('Create');

    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a full URL or a path starting with /')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('files a new post under the current site, with no publish date', async () => {
    const { onDone } = renderForm();
    expect(screen.getByText('Body images in website/blog')).toBeInTheDocument();
    await fillRequired();
    await fillField('Cover image URL', '/images/cover.png');

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { ...NEW_POST, coverImage: '/images/cover.png', siteId: 'site-1' } },
    });
    expect(await screen.findByText('Blog post created')).toBeInTheDocument();
  });

  it('creates a post with no site outside a site page', async () => {
    const { onDone } = renderForm(null, false);
    await fillRequired();

    await press('Create');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { ...NEW_POST, siteId: undefined } },
    });
  });

  it('updates an existing post with every field it was opened with', async () => {
    const row = blogRow({ id: 'post-1', featured: true, tags: ['ai'] });
    const { onDone } = renderForm(row);

    expect(screen.getByLabelText('Title')).toHaveValue('Scaling GraphQL');
    expect(screen.getByLabelText('Author role')).toHaveValue('Engineer');
    await fillField('Title', 'Scaling GraphQL, again');
    await press('Update');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'post-1',
        input: {
          slug: row.slug,
          title: 'Scaling GraphQL, again',
          summary: row.summary,
          content: row.content,
          contentCss: row.contentCss,
          author: { name: 'Ada Lovelace', role: 'Engineer', initials: 'AL' },
          readTime: row.readTime,
          tags: ['ai'],
          coverImage: row.coverImage,
          featured: true,
          isActive: true,
          publishedAt: row.publishedAt,
        },
      },
    });
    expect(await screen.findByText('Blog post updated')).toBeInTheDocument();
  });

  it('reports a failed save and stays open', async () => {
    gql.create.mockRejectedValue(new Error('That slug is taken'));
    const { onDone } = renderForm();
    await fillRequired();

    await press('Create');

    expect(await screen.findByText('That slug is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
