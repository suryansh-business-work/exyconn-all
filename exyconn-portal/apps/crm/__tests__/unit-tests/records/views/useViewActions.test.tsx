import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrmObject, CrmOp, SortDir } from '@exyconn/shell/graphql/generated';
import { EMPTY_QUERY } from '../../../../src/records/list/recordQuery';
import type { RecordQuery } from '../../../../src/records/list/useRecordQuery';
import { useViewActions } from '../../../../src/records/views/useViewActions';
import { renderHookWithProviders } from '../../test-utils';
import { crmView } from '../records-fixtures';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  loading: { create: false, update: false, remove: false },
  logError: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCrmViewMutation: () => [gql.create, { loading: gql.loading.create }],
  useUpdateCrmViewMutation: () => [gql.update, { loading: gql.loading.update }],
  useDeleteCrmViewMutation: () => [gql.remove, { loading: gql.loading.remove }],
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { error: (...args: unknown[]) => gql.logError(...args) },
}));

const MINE = crmView();
const THEIRS = crmView({ id: 'view-9', mine: false, shared: true, name: 'Team view' });
const QUERY = {
  ...EMPTY_QUERY,
  search: ' globex ',
  sorts: [{ property: 'email', dir: SortDir.Desc }],
  groups: [
    { id: 'g', conditions: [{ id: 'c', property: 'name', op: CrmOp.Contains, values: ['x'] }] },
  ],
};
const SNAPSHOT = {
  search: 'globex',
  groups: [{ conditions: [{ property: 'name', op: CrmOp.Contains, values: ['x'] }] }],
  sorts: [{ property: 'email', dir: SortDir.Desc }],
  columns: [],
};

function listWith(selectedView: RecordQuery['selectedView']) {
  return {
    query: QUERY,
    selectedView,
    refetchViews: vi.fn().mockResolvedValue({}),
    selectView: vi.fn(),
  } as unknown as RecordQuery;
}

function renderActions(list: RecordQuery) {
  return renderHookWithProviders(() => useViewActions(CrmObject.Lead, list));
}

describe('useViewActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = { create: false, update: false, remove: false };
    gql.update.mockResolvedValue({ data: {} });
    gql.remove.mockResolvedValue({ data: {} });
  });

  it('saves the working query over the viewer’s own open view', async () => {
    const { result } = renderActions(listWith(MINE));
    await act(() => result.current.saveOver());
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'view-1',
        input: { object: CrmObject.Lead, name: 'Hot leads', shared: false, ...SNAPSHOT },
      },
    });
    expect(await screen.findByText('View "Hot leads" saved')).toBeInTheDocument();
  });

  it('does not save over a view that is not the viewer’s, or no view', async () => {
    const { result: theirs } = renderActions(listWith(THEIRS));
    await act(() => theirs.current.saveOver());
    const { result: none } = renderActions(listWith(null));
    await act(() => none.current.saveOver());
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('shows and logs a failed save', async () => {
    const failure = new Error('Name taken');
    gql.update.mockRejectedValue(failure);
    const { result } = renderActions(listWith(MINE));
    await act(() => result.current.saveOver());
    expect(await screen.findByText('Name taken')).toBeInTheDocument();
    expect(gql.logError).toHaveBeenCalledWith('Could not save the view', failure, {
      object: CrmObject.Lead,
    });
  });

  it('saves a new view, reloads the views and opens it', async () => {
    gql.create.mockResolvedValue({ data: { createCrmView: { id: 'view-new' } } });
    const list = listWith(null);
    const { result } = renderActions(list);
    let saved = false;
    await act(async () => {
      saved = await result.current.saveAsNew({ name: 'Mine', shared: true });
    });
    expect(saved).toBe(true);
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { object: CrmObject.Lead, name: 'Mine', shared: true, ...SNAPSHOT } },
    });
    expect(list.refetchViews).toHaveBeenCalled();
    expect(list.selectView).toHaveBeenCalledWith('view-new');
    expect(await screen.findByText('View "Mine" saved')).toBeInTheDocument();
  });

  it('does not open anything when the new view came back without an id', async () => {
    gql.create.mockResolvedValue({ data: undefined });
    const list = listWith(null);
    const { result } = renderActions(list);
    await act(async () => {
      await result.current.saveAsNew({ name: 'Mine', shared: false });
    });
    expect(list.selectView).not.toHaveBeenCalled();
  });

  it('reports a failed new view and resolves false', async () => {
    gql.create.mockRejectedValue(new Error('Too many views'));
    const { result } = renderActions(listWith(null));
    let saved = true;
    await act(async () => {
      saved = await result.current.saveAsNew({ name: 'Mine', shared: false });
    });
    expect(saved).toBe(false);
    expect(await screen.findByText('Too many views')).toBeInTheDocument();
  });

  it('renames a view keeping what it filters', async () => {
    const { result } = renderActions(listWith(null));
    let ok = false;
    await act(async () => {
      ok = await result.current.changeDetails(MINE, { name: 'Hotter', shared: true });
    });
    expect(ok).toBe(true);
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'view-1',
        input: {
          object: CrmObject.Lead,
          name: 'Hotter',
          shared: true,
          search: 'acme',
          groups: [{ conditions: [{ property: 'stage', op: CrmOp.In, values: ['HOT'] }] }],
          sorts: [{ property: 'name', dir: SortDir.Asc }],
          columns: ['name', 'email'],
        },
      },
    });
  });

  it('reports a failed rename and resolves false', async () => {
    gql.update.mockRejectedValue(new Error('Forbidden'));
    const { result } = renderActions(listWith(null));
    let ok = true;
    await act(async () => {
      ok = await result.current.changeDetails(MINE, { name: 'x', shared: false });
    });
    expect(ok).toBe(false);
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });

  it('deletes the open view after confirming and goes back to the default view', async () => {
    const list = listWith(MINE);
    const { result } = renderActions(list);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.remove(MINE);
    });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(
      'Delete the view "Hot leads"? The records in it are not affected.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await act(() => done);
    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'view-1' } });
    expect(list.selectView).toHaveBeenCalledWith('');
    expect(list.refetchViews).toHaveBeenCalled();
    expect(await screen.findByText('View "Hot leads" deleted')).toBeInTheDocument();
  });

  it('deletes another view without leaving the open one', async () => {
    const list = listWith(THEIRS);
    const { result } = renderActions(list);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.remove(MINE);
    });
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    await act(() => done);
    expect(list.selectView).not.toHaveBeenCalled();
  });

  it('keeps the view when the delete is cancelled', async () => {
    const { result } = renderActions(listWith(MINE));
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.remove(MINE);
    });
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    await act(() => done);
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('reports a failed delete', async () => {
    gql.remove.mockRejectedValue(new Error('Gone already'));
    const { result } = renderActions(listWith(null));
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.remove(MINE);
    });
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    await act(() => done);
    await waitFor(() => expect(screen.getByText('Gone already')).toBeInTheDocument());
  });

  it('is busy while any change is on its way', () => {
    gql.loading = { create: false, update: false, remove: true };
    expect(renderActions(listWith(null)).result.current.busy).toBe(true);
    gql.loading = { create: false, update: true, remove: false };
    expect(renderActions(listWith(null)).result.current.busy).toBe(true);
    gql.loading = { create: true, update: false, remove: false };
    expect(renderActions(listWith(null)).result.current.busy).toBe(true);
    gql.loading = { create: false, update: false, remove: false };
    expect(renderActions(listWith(null)).result.current.busy).toBe(false);
  });
});
