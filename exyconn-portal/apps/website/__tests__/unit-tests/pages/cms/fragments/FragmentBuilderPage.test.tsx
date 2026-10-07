import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CmsDocumentStatus, CmsFragmentKind } from '@exyconn/shell/graphql/generated';
import { FragmentBuilderPage } from '../../../../../src/pages/cms/fragments/FragmentBuilderPage';
import { queryResult, renderInSite } from '../cms-helpers';

interface ScreenProps {
  title: string;
  caption: string;
  status: string;
  backPath: string;
  initial: { html: string; css: string };
  projectData: unknown;
  resources: unknown;
  saveDraft: (draft: unknown) => Promise<unknown>;
  publish: () => Promise<unknown>;
}

const spies = vi.hoisted(() => ({
  fragment: vi.fn(),
  resources: vi.fn(),
  saveDraft: vi.fn(),
  publish: vi.fn(),
  screen: null as ScreenProps | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsFragmentQuery: (options: unknown) => spies.fragment(options),
  useSaveCmsFragmentDraftMutation: () => [spies.saveDraft],
  usePublishCmsFragmentMutation: () => [spies.publish],
}));
vi.mock('../../../../../src/pages/cms/builder/useBuilderResources', () => ({
  useBuilderResources: (exclude?: string) => spies.resources(exclude),
}));
vi.mock('../../../../../src/pages/cms/builder/BuilderScreen', () => ({
  BuilderScreen: (props: Readonly<ScreenProps>) => {
    spies.screen = props;
    return <p>{`Builder for ${props.title}`}</p>;
  },
}));

const RESOURCES = { components: [], fragments: [], canvasCss: '', canvasStyles: [], assets: [] };
const doc = {
  id: 'fragment-1',
  name: 'Main header',
  kind: CmsFragmentKind.Header,
  status: CmsDocumentStatus.Changed,
  draft: { html: '<header></header>', css: 'header{}', projectData: { pages: [] } },
};

const recorded = () => {
  if (!spies.screen) throw new Error('BuilderScreen was not rendered');
  return spies.screen;
};

const renderAt = (route = '/website/s/main/fragments/fragment-1/edit') =>
  renderInSite(<FragmentBuilderPage />, {
    route,
    path: '/website/s/:siteSlug/fragments/:id?/edit',
  });

describe('FragmentBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.screen = null;
    spies.fragment.mockReturnValue(queryResult({ cmsFragment: doc }));
    spies.resources.mockReturnValue({ resources: RESOURCES, loading: false, error: undefined });
    spies.saveDraft.mockResolvedValue({ data: {} });
    spies.publish.mockResolvedValue({ data: {} });
  });

  it('opens the fragment in the builder, its own block left out', () => {
    renderAt();

    expect(screen.getByText('Builder for Main header')).toBeInTheDocument();
    expect(spies.fragment).toHaveBeenCalledWith({
      variables: { id: 'fragment-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(spies.resources).toHaveBeenCalledWith('fragment-1');
    expect(recorded()).toMatchObject({
      caption: 'Header fragment',
      status: 'CHANGED',
      backPath: '/website/s/main/fragments',
      initial: { html: '<header></header>', css: 'header{}' },
      projectData: { pages: [] },
      resources: RESOURCES,
    });
  });

  it("saves the fragment's draft and publishes it by id", async () => {
    renderAt();
    const draft = { html: '<p>x</p>', css: '', projectData: {} };

    await recorded().saveDraft(draft);
    await recorded().publish();

    expect(spies.saveDraft).toHaveBeenCalledWith({ variables: { id: 'fragment-1', draft } });
    expect(spies.publish).toHaveBeenCalledWith({ variables: { id: 'fragment-1' } });
  });

  it('starts an empty canvas for a fragment with no draft', () => {
    spies.fragment.mockReturnValue(
      queryResult({ cmsFragment: { ...doc, kind: CmsFragmentKind.Snippet, draft: null } }),
    );
    renderAt();

    expect(recorded()).toMatchObject({
      caption: 'Snippet fragment',
      initial: { html: '', css: '' },
      projectData: undefined,
    });
  });

  it('waits for the fragment and its resources', () => {
    spies.fragment.mockReturnValue(queryResult(undefined, { loading: true }));
    renderAt();

    expect(screen.getByRole('progressbar', { name: 'Opening the fragment' })).toBeInTheDocument();
  });

  it('waits for the resources even when the fragment is there', () => {
    spies.resources.mockReturnValue({ resources: null, loading: true, error: undefined });
    renderAt();

    expect(screen.getByRole('progressbar', { name: 'Opening the fragment' })).toBeInTheDocument();
    expect(spies.screen).toBeNull();
  });

  it('says why the fragment, or else its resources, could not be opened', () => {
    spies.fragment.mockReturnValue(queryResult(undefined, { error: new Error('Forbidden') }));
    spies.resources.mockReturnValue({ resources: null, loading: false, error: new Error('Nope') });
    const { unmount } = renderAt();
    expect(screen.getByText('Could not open the fragment: Forbidden')).toBeInTheDocument();
    unmount();

    spies.fragment.mockReturnValue(queryResult(undefined));
    renderAt();
    expect(screen.getByText('Could not open the fragment: Nope')).toBeInTheDocument();
  });

  it('skips the query and says the fragment is gone without an id', () => {
    spies.fragment.mockReturnValue(queryResult(undefined));
    renderAt('/website/s/main/fragments/edit');

    expect(spies.fragment).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    expect(screen.getByText('That fragment no longer exists.')).toBeInTheDocument();
  });
});
