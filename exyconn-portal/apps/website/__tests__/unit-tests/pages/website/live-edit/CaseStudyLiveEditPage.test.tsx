import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { GetCaseStudyQuery } from '@exyconn/shell/graphql/generated';
import { CaseStudyLiveEditPage } from '../../../../../src/pages/website/live-edit/CaseStudyLiveEditPage';
import { renderWithProviders } from '../../../test-utils';
import { liveEditScreen, screenProps } from './live-edit-screen-stub';

const gql = vi.hoisted(() => ({
  result: { data: undefined, loading: true, error: undefined } as {
    data?: unknown;
    loading: boolean;
    error?: Error;
  },
  options: null as unknown,
  update: vi.fn(() => Promise.resolve({ data: {} })),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useGetCaseStudyQuery: (options: unknown) => {
      gql.options = options;
      return gql.result;
    },
    useUpdateCaseStudyMutation: () => [gql.update],
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

const STUDY: GetCaseStudyQuery['getCaseStudy'] = {
  id: 'study-1',
  siteId: 'site-1',
  slug: 'acme-support',
  title: 'Acme cut support costs',
  excerpt: 'Support costs down by a third',
  content: '<p>Body</p>',
  contentCss: '.x{color:red}',
  coverImage: '',
  category: 'Support',
  author: 'Asha Rao',
  tags: ['ai'],
  pdfUrl: '',
  featured: false,
  isActive: true,
  publishedAt: '2026-10-01T00:00:00.000Z',
};

function renderPage(route = '/website/s/main/case-studies/study-1/live-edit') {
  renderWithProviders(<CaseStudyLiveEditPage />, {
    route,
    path: '/website/s/:siteSlug/case-studies/:id?/live-edit',
  });
}

beforeEach(() => {
  liveEditScreen.props = null;
  gql.result = { data: undefined, loading: true, error: undefined };
  gql.update.mockClear();
});

describe('CaseStudyLiveEditPage', () => {
  it('reads the case study fresh from the server by its id', () => {
    renderPage();
    expect(gql.options).toEqual({
      variables: { id: 'study-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(screen.getByRole('progressbar', { name: 'Loading the case study' })).toBeInTheDocument();
  });

  it('asks for nothing without an id, and says the case study is gone', () => {
    gql.result = { data: undefined, loading: false, error: undefined };
    renderPage('/website/s/main/case-studies/live-edit');
    expect(gql.options).toEqual({ variables: { id: '' }, skip: true, fetchPolicy: 'network-only' });
    expect(screen.getByRole('alert')).toHaveTextContent('That case study no longer exists.');
  });

  it('says why the case study could not be loaded', () => {
    gql.result = { data: undefined, loading: false, error: new Error('Forbidden') };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the case study: Forbidden');
    expect(liveEditScreen.props).toBeNull();
  });

  it('opens the study’s body in the live editor', () => {
    gql.result = { data: { getCaseStudy: STUDY }, loading: false };
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Editing Acme cut support costs' }),
    ).toBeInTheDocument();
    const props = screenProps();
    expect(props.pageUrl).toBe('https://exyconn.com/case-studies/acme-support');
    expect(props.backPath).toBe('/website/s/main/case-studies');
    expect(props.folder).toBe('website/case-studies');
    expect(props.initial).toEqual({ html: '<p>Body</p>', css: '.x{color:red}' });
  });

  it('saves only the body, carrying the study’s identity along', async () => {
    gql.result = { data: { getCaseStudy: STUDY }, loading: false };
    renderPage();
    await screenProps().onSave({ html: '<p>New</p>', css: 'p{margin:0}' });
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'study-1',
        input: {
          slug: 'acme-support',
          title: 'Acme cut support costs',
          content: '<p>New</p>',
          contentCss: 'p{margin:0}',
        },
      },
    });
  });
});
