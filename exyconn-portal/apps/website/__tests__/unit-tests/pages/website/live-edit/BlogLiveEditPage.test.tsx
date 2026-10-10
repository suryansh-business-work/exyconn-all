import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { GetBlogPostQuery } from '@exyconn/shell/graphql/generated';
import { BlogLiveEditPage } from '../../../../../src/pages/website/live-edit/BlogLiveEditPage';
import { renderWithProviders } from '../../../test-utils';
import { liveEditScreen, screenProps } from './live-edit-screen-stub';

const gql = vi.hoisted(() => {
  const result: { data?: unknown; loading: boolean; error?: Error } = {
    data: undefined,
    loading: true,
    error: undefined,
  };
  return {
    result,
    options: null as unknown,
    update: vi.fn(() => Promise.resolve({ data: {} })),
  };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useGetBlogPostQuery: (options: unknown) => {
      gql.options = options;
      return gql.result;
    },
    useUpdateBlogPostMutation: () => [gql.update],
  };
});

vi.mock('../../../../../src/pages/cms/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../src/pages/cms/site')>();
  return {
    ...actual,
    useSitePath:
      () =>
      (rest = '') =>
        `/website/s/main/${rest}`,
  };
});

vi.mock('../../../../../src/pages/website/live-edit/LiveEditScreen', async () => {
  const stub = await import('./live-edit-screen-stub');
  return { LiveEditScreen: stub.LiveEditScreenStub };
});

const POST: GetBlogPostQuery['getBlogPost'] = {
  id: 'post-1',
  siteId: 'site-1',
  slug: 'why-agents-fail',
  title: 'Why agents fail',
  summary: 'A short read',
  content: '<p>Body</p>',
  contentCss: '.x{color:red}',
  readTime: '4 min',
  tags: ['ai'],
  coverImage: '',
  featured: false,
  isActive: true,
  publishedAt: '2026-10-01T00:00:00.000Z',
  author: { name: 'Asha Rao', role: 'Engineer', initials: 'AR' },
};

function renderPage(route = '/website/s/main/blog/post-1/live-edit') {
  renderWithProviders(<BlogLiveEditPage />, {
    route,
    path: '/website/s/:siteSlug/blog/:id?/live-edit',
  });
}

beforeEach(() => {
  liveEditScreen.props = null;
  gql.result = { data: undefined, loading: true, error: undefined };
  gql.update.mockClear();
});

describe('BlogLiveEditPage', () => {
  it('reads the post fresh from the server by its id', () => {
    renderPage();
    expect(gql.options).toEqual({
      variables: { id: 'post-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('progressbar', { name: 'Loading the blog post' })).toBeInTheDocument();
  });

  it('asks for nothing without an id, and says the post is gone', () => {
    gql.result = { data: undefined, loading: false, error: undefined };
    renderPage('/website/s/main/blog/live-edit');
    expect(gql.options).toEqual({ variables: { id: '' }, skip: true, fetchPolicy: 'network-only' });
    expect(screen.getByRole('alert')).toHaveTextContent('That blog post no longer exists.');
  });

  it('says why the post could not be loaded', () => {
    gql.result = { data: undefined, loading: false, error: new Error('Forbidden') };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the blog post: Forbidden');
    expect(liveEditScreen.props).toBeNull();
  });

  it('opens the post’s body in the live editor', () => {
    gql.result = { data: { getBlogPost: POST }, loading: false };
    renderPage();
    expect(screen.getByRole('heading', { name: 'Editing Why agents fail' })).toBeInTheDocument();
    const props = screenProps();
    expect(props.pageUrl).toBe('https://exyconn.com/blog/why-agents-fail');
    expect(props.backPath).toBe('/website/s/main/blog');
    expect(props.folder).toBe('website/blog');
    expect(props.initial).toEqual({ html: '<p>Body</p>', css: '.x{color:red}' });
  });

  it('saves only the body, carrying the post’s identity along', async () => {
    gql.result = { data: { getBlogPost: POST }, loading: false };
    renderPage();
    await screenProps().onSave({ html: '<p>New</p>', css: 'p{margin:0}' });
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'post-1',
        input: {
          slug: 'why-agents-fail',
          title: 'Why agents fail',
          author: { name: 'Asha Rao', role: 'Engineer', initials: 'AR' },
          content: '<p>New</p>',
          contentCss: 'p{margin:0}',
        },
      },
    });
  });
});
