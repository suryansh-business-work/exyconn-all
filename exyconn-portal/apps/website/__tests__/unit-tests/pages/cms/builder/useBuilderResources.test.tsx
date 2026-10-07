import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBuilderResources } from '../../../../../src/pages/cms/builder/useBuilderResources';
import { WEBSITE_FONT_STYLESHEET } from '../../../../../src/pages/cms/builder/canvas-css';
import { renderHookInSite, siteFixture } from '../cms-helpers';

const gql = vi.hoisted(() => ({
  components: vi.fn(),
  fragments: vi.fn(),
  design: vi.fn(),
  assets: vi.fn(),
}));

vi.mock('@exyconn/live-editor', () => ({ PLACEHOLDER_CSS: '.placeholder {}' }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsComponentsQuery: (options: unknown) => gql.components(options),
  useCmsFragmentsQuery: (options: unknown) => gql.fragments(options),
  useCmsDesignSystemQuery: (options: unknown) => gql.design(options),
  useCmsAssetsQuery: (options: unknown) => gql.assets(options),
}));

const component = { key: 'hero', label: 'Hero', category: 'Marketing', description: '' };
const fragment = (id: string, name: string) => ({ id, name, kind: 'HEADER', status: 'DRAFT' });
const asset = (id: string, mime: string) => ({ id, mime, url: `https://cdn/${id}` });

const answer = (
  mock: ReturnType<typeof vi.fn>,
  data: unknown,
  extra: { loading?: boolean; error?: Error } = {},
) => mock.mockReturnValue({ data, loading: extra.loading ?? false, error: extra.error });

const site = siteFixture({ globalCss: '.site-global {}' });
const mount = (exclude?: string, current = site) =>
  renderHookInSite(() => useBuilderResources(exclude), { site: current });

describe('useBuilderResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answer(gql.components, {
      cmsComponents: [
        { ...component, defaultProps: { title: 'Hi' }, acceptsChildren: false },
        { ...component, key: 'grid', defaultProps: null, acceptsChildren: true },
      ],
    });
    answer(gql.fragments, {
      cmsFragments: [fragment('fragment-1', 'Header'), fragment('fragment-2', 'Footer')],
    });
    answer(gql.design, {
      cmsDesignSystem: {
        tokens: { fontSources: [{ provider: 'GOOGLE', family: 'Lora', variants: [] }] },
        extraCss: '.design-extra {}',
      },
    });
    answer(gql.assets, {
      cmsAssets: { rows: [asset('a.png', 'image/png'), asset('b.pdf', 'application/pdf')] },
    });
  });

  it("gathers the catalogue, the site's other fragments, its canvas and its images", () => {
    const { result } = mount('fragment-1');
    const { resources, loading, error } = result.current;

    expect(loading).toBe(false);
    expect(error).toBeUndefined();
    expect(resources?.components.map((entry) => entry.defaultProps)).toEqual([{ title: 'Hi' }, {}]);
    expect(resources?.fragments).toEqual([{ id: 'fragment-2', name: 'Footer', kind: 'HEADER' }]);
    expect(resources?.canvasCss).toContain('.design-extra {}');
    expect(resources?.canvasCss).toContain('.site-global {}');
    expect(resources?.canvasStyles).toHaveLength(2);
    expect(resources?.assets).toEqual(['https://cdn/a.png']);
  });

  it("reads the site's fragments, design system and newest media", () => {
    mount();

    expect(gql.components).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
    expect(gql.fragments).toHaveBeenCalledWith({
      variables: { siteId: 'site-1' },
      fetchPolicy: 'network-only',
    });
    expect(gql.design).toHaveBeenCalledWith({ variables: { id: 'design-1' }, skip: false });
    expect(gql.assets).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', page: 0, pageSize: 200 },
      fetchPolicy: 'network-only',
    });
  });

  it('keeps every fragment when none is excluded', () => {
    const { result } = mount();
    expect(result.current.resources?.fragments).toHaveLength(2);
  });

  it('builds a plain canvas for a site with no design system', () => {
    answer(gql.design, undefined);
    const { result } = mount(undefined, siteFixture({ designSystemId: '' }));

    expect(gql.design).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    expect(result.current.resources?.canvasStyles).toEqual([WEBSITE_FONT_STYLESHEET]);
  });

  it('is not ready until the catalogue, fragments and media have answered', () => {
    answer(gql.assets, undefined, { loading: true });
    const { result } = mount();

    expect(result.current.resources).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('waits for the design system before the canvas mounts, but not for a refetch', () => {
    answer(gql.design, undefined, { loading: true });
    const { result, rerender } = mount();
    expect(result.current.resources).toBeNull();

    answer(gql.design, { cmsDesignSystem: { tokens: {}, extraCss: '' } }, { loading: true });
    rerender();
    expect(result.current.resources).not.toBeNull();
  });

  it('reports the first error among its queries', () => {
    answer(gql.fragments, undefined, { error: new Error('Fragments failed') });
    answer(gql.assets, undefined, { error: new Error('Assets failed') });
    const { result } = mount();

    expect(result.current.error?.message).toBe('Fragments failed');
    expect(result.current.resources).toBeNull();
  });

  it('reports the catalogue, design or media error when the others are fine', () => {
    answer(gql.assets, undefined, { error: new Error('Assets failed') });
    const { result, rerender } = mount();
    expect(result.current.error?.message).toBe('Assets failed');

    answer(gql.design, undefined, { error: new Error('Design failed') });
    rerender();
    expect(result.current.error?.message).toBe('Design failed');

    answer(gql.components, undefined, { error: new Error('Catalogue failed') });
    rerender();
    expect(result.current.error?.message).toBe('Catalogue failed');
  });
});
