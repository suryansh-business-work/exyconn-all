import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useProjectDocs } from '../../../../../src/pages/projects/docs/useProjectDocs';
import { renderHookWithProviders } from '../../../test-utils';
import { docPage } from '../../../fixtures';

const gql = vi.hoisted(() => ({
  pages: vi.fn(),
  refetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  move: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectDocPagesQuery: (options: unknown) => gql.pages(options),
  useCreateDocPageMutation: () => [gql.create],
  useUpdateDocPageMutation: () => [gql.update],
  useDeleteDocPageMutation: () => [gql.remove],
  useMoveDocPageMutation: () => [gql.move],
}));

const PAGES = [
  docPage('runbooks', null, 'Runbooks'),
  docPage('releasing', 'runbooks', 'Releasing'),
  docPage('decisions', null, 'Decisions'),
];
const DATA = { projectDocPages: PAGES };

const setup = () => renderHookWithProviders(() => useProjectDocs('proj-1'));

describe('useProjectDocs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.pages.mockReturnValue({ data: DATA, loading: false, refetch: gql.refetch });
    gql.create.mockResolvedValue({ data: { createDocPage: { id: 'new-page' } } });
    gql.update.mockResolvedValue({ data: {} });
    gql.remove.mockResolvedValue({ data: {} });
    gql.move.mockResolvedValue({ data: {} });
  });

  it('loads the space fresh and builds its tree, with nothing open yet', () => {
    const { result } = setup();

    expect(gql.pages).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(result.current.pages).toBe(PAGES);
    expect(result.current.tree.map((node) => node.page.id)).toEqual(['runbooks', 'decisions']);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.trail).toEqual([]);
  });

  it('has an empty space before the pages arrive', () => {
    gql.pages.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { result } = setup();

    expect(result.current.pages).toEqual([]);
    expect(result.current.tree).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('follows the open page up to its root for the breadcrumb', () => {
    const { result } = setup();

    act(() => result.current.setSelectedId('releasing'));

    expect(result.current.trail.map((page) => page.title)).toEqual(['Runbooks', 'Releasing']);
  });

  it('creates an untitled page under a parent, reloads, and opens it', async () => {
    const { result } = setup();

    await act(() => result.current.addPage('runbooks'));

    expect(gql.create).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', parentId: 'runbooks', title: 'Untitled page' },
    });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(result.current.selectedId).toBe('new-page');
  });

  it('keeps the selection when the server does not say which page it made', async () => {
    gql.create.mockResolvedValueOnce({ data: undefined });
    const { result } = setup();

    await act(() => result.current.addPage(null));

    expect(result.current.selectedId).toBeNull();
  });

  it('reports a page that could not be created', async () => {
    gql.create.mockRejectedValueOnce(new Error('Space is read-only'));
    const { result } = setup();

    await act(() => result.current.addPage(null));

    expect(await screen.findByText('Space is read-only')).toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('saves a page, says so, and reloads', async () => {
    const { result } = setup();

    await act(() => result.current.savePage('releasing', { title: 'Release', body: '<p>Go</p>' }));

    expect(gql.update).toHaveBeenCalledWith({
      variables: { id: 'releasing', title: 'Release', body: '<p>Go</p>' },
    });
    expect(await screen.findByText('Page saved')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports a save that failed, in general terms when the error says nothing', async () => {
    gql.update.mockRejectedValueOnce('offline');
    const { result } = setup();

    await act(() => result.current.savePage('releasing', { title: 'Release', body: '' }));

    expect(await screen.findByText('Action failed')).toBeInTheDocument();
  });

  it('deletes the open page, closes it and reloads', async () => {
    const { result } = setup();
    act(() => result.current.setSelectedId('releasing'));

    await act(() => result.current.removePage('releasing'));

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'releasing' } });
    expect(result.current.selectedId).toBeNull();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the page open when it could not be deleted', async () => {
    gql.remove.mockRejectedValueOnce(new Error('Page is locked'));
    const { result } = setup();
    act(() => result.current.setSelectedId('releasing'));

    await act(() => result.current.removePage('releasing'));

    expect(await screen.findByText('Page is locked')).toBeInTheDocument();
    expect(result.current.selectedId).toBe('releasing');
  });

  it('files a dropped page under the page it landed on, then reloads', async () => {
    const { result } = setup();

    await act(() => result.current.reorderPage('decisions', 'releasing'));

    expect(gql.move).toHaveBeenCalledWith({
      variables: { id: 'decisions', parentId: 'releasing', toIndex: 0 },
    });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('does nothing for a drop that would put a page inside its own branch', async () => {
    const { result } = setup();

    await act(() => result.current.reorderPage('runbooks', 'releasing'));

    expect(gql.move).not.toHaveBeenCalled();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reports a move that failed', async () => {
    gql.move.mockRejectedValueOnce(new Error('Move refused'));
    const { result } = setup();

    await act(() => result.current.reorderPage('decisions', 'runbooks'));

    expect(await screen.findByText('Move refused')).toBeInTheDocument();
  });
});
