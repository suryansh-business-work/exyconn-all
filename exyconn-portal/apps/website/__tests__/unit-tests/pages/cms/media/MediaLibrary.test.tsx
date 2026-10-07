import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaLibrary } from '../../../../../src/pages/cms/media/MediaLibrary';
import { renderWithProviders } from '../../../test-utils';
import { mediaAsset } from './media.fixtures';

const spies = vi.hoisted(() => ({ assets: vi.fn(), refetch: vi.fn(), onPick: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsAssetsQuery: (options: unknown) => spies.assets(options),
  useDeleteCmsAssetMutation: () => [vi.fn()],
}));
vi.mock('../../../../../src/pages/cms/media/MediaUploadButton', () => ({
  MediaUploadButton: (
    props: Readonly<{ siteId: string; onUploaded: (urls: string[]) => void }>,
  ) => (
    <>
      <button
        type="button"
        onClick={() => props.onUploaded(['https://cdn/new.png', 'https://cdn/2.png'])}
      >
        {`Upload to ${props.siteId}`}
      </button>
      <button type="button" onClick={() => props.onUploaded([])}>
        Upload nothing
      </button>
    </>
  ),
}));
vi.mock('../../../../../src/pages/website/forms/cms-asset-alt', () => ({
  AssetAltForm: (props: Readonly<{ asset: { name: string } | null; onClose: () => void }>) =>
    props.asset && (
      <button type="button" onClick={props.onClose}>
        {`Close alt text of ${props.asset.name}`}
      </button>
    ),
}));

const ASSETS = [
  mediaAsset(),
  mediaAsset({ id: 'asset-2', name: 'hero.jpg', url: 'https://cdn/hero.jpg' }),
];

const answer = (
  rows: unknown[] | undefined,
  extra: { totalCount?: number; loading?: boolean; error?: Error } = {},
) =>
  spies.assets.mockReturnValue({
    data: rows && { cmsAssets: { rows, totalCount: extra.totalCount ?? rows.length } },
    loading: extra.loading ?? false,
    error: extra.error,
    refetch: spies.refetch,
  });

const lastVariables = () => spies.assets.mock.calls.at(-1)?.[0].variables;

describe('MediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.refetch.mockResolvedValue({});
    answer(ASSETS);
  });

  it("manages the site's files: each card with its actions", async () => {
    renderWithProviders(<MediaLibrary siteId="site-1" />);

    expect(screen.getByRole('button', { name: 'Upload to site-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete hero.jpg' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit alt text' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Close alt text of logo.png' }));
    expect(screen.queryByRole('button', { name: /Close alt text/ })).not.toBeInTheDocument();
  });

  it('searches the library by what is typed', async () => {
    renderWithProviders(<MediaLibrary siteId="site-1" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Search media' }), 'hero');

    expect(lastVariables()).toMatchObject({ search: 'hero', page: 0 });
  });

  it('pages through a library longer than one page', async () => {
    answer(ASSETS, { totalCount: 50 });
    renderWithProviders(<MediaLibrary siteId="site-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(lastVariables()).toMatchObject({ page: 1 });
  });

  it('shows loading, the reason a read failed, and an empty library', () => {
    answer(undefined, { loading: true });
    const { unmount } = renderWithProviders(<MediaLibrary siteId="site-1" />);
    expect(screen.getByRole('progressbar', { name: 'Loading media' })).toBeInTheDocument();
    expect(screen.queryByText('No files yet')).not.toBeInTheDocument();
    unmount();

    answer(undefined, { error: new Error('Server down') });
    renderWithProviders(<MediaLibrary siteId="site-1" />);
    expect(screen.getByText('Could not load the media: Server down')).toBeInTheDocument();
    expect(screen.getByText('No files yet')).toBeInTheDocument();
  });

  it('reloads after an upload in library mode', async () => {
    renderWithProviders(<MediaLibrary siteId="site-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Upload to site-1' }));
    expect(spies.refetch).toHaveBeenCalledTimes(1);
  });

  it('chooses a file, or the first new upload, in picker mode', async () => {
    renderWithProviders(<MediaLibrary siteId="site-1" onPick={spies.onPick} />);
    expect(screen.queryByRole('button', { name: 'Copy URL' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Use hero.jpg' }));
    expect(spies.onPick).toHaveBeenLastCalledWith('https://cdn/hero.jpg');

    await userEvent.click(screen.getByRole('button', { name: 'Upload to site-1' }));
    expect(spies.onPick).toHaveBeenLastCalledWith('https://cdn/new.png');

    await userEvent.click(screen.getByRole('button', { name: 'Upload nothing' }));
    expect(spies.onPick).toHaveBeenCalledTimes(2);
  });

  it('reports a reload that failed after an upload', async () => {
    spies.refetch.mockRejectedValueOnce('offline');
    renderWithProviders(<MediaLibrary siteId="site-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Upload nothing' }));

    expect(await screen.findByText('Could not reload the media')).toBeInTheDocument();
  });
});
