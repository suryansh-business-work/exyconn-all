import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { CrmObject, SortDir } from '@exyconn/shell/graphql/generated';
import { EMPTY_QUERY } from '../../../../src/records/list/recordQuery';
import { useRecordQuery } from '../../../../src/records/list/useRecordQuery';
import { renderHookWithProviders, useCurrentUrl } from '../../test-utils';
import { crmView } from '../records-fixtures';

const views = vi.hoisted(() => ({ result: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmViewsQuery: (options: unknown) => views.result(options),
}));

const HOT = crmView();
const MINE = crmView({
  id: 'view-2',
  name: 'Mine',
  search: '',
  groups: [],
  sorts: [],
  columns: [],
});

function answered(list = [HOT, MINE]) {
  return { data: { crmViews: list }, loading: false, error: undefined, refetch: views.refetch };
}

function renderQuery(route = '/leads') {
  return renderHookWithProviders(
    () => ({ ...useRecordQuery(CrmObject.Lead), url: useCurrentUrl() }),
    {
      route,
    },
  );
}

describe('useRecordQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    views.result.mockReturnValue(answered());
  });

  it('starts on the default view with an empty query', () => {
    const { result } = renderQuery();
    expect(views.result).toHaveBeenCalledWith({ variables: { object: CrmObject.Lead } });
    expect(result.current.viewId).toBe('');
    expect(result.current.selectedView).toBeNull();
    expect(result.current.query).toEqual(EMPTY_QUERY);
    expect(result.current.dirty).toBe(false);
    expect(result.current.views).toEqual([HOT, MINE]);
    expect(result.current.refetchViews).toBe(views.refetch);
  });

  it('opens the view named in the URL and rebuilds the grid for it', async () => {
    const { result } = renderQuery('/leads?view=view-1');
    await waitFor(() => expect(result.current.query.search).toBe('acme'));
    expect(result.current.selectedView).toBe(HOT);
    expect(result.current.gridKey).toBe(1);
    expect(result.current.dirty).toBe(false);
  });

  it('waits for the views before deciding about the view in the URL', () => {
    views.result.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: views.refetch,
    });
    const { result, rerender } = renderQuery('/leads?view=view-1');
    expect(result.current.viewsLoading).toBe(true);
    expect(result.current.url).toBe('/leads?view=view-1');
    expect(result.current.query).toEqual(EMPTY_QUERY);

    views.result.mockReturnValue({
      data: { crmViews: [HOT] },
      loading: true,
      error: undefined,
      refetch: views.refetch,
    });
    rerender();
    expect(result.current.query.search).toBe('acme');
  });

  it('falls back to the default view when the URL names a view that is gone', async () => {
    const { result } = renderQuery('/leads?view=deleted&preview=x');
    await waitFor(() => expect(result.current.url).toBe('/leads?preview=x'));
    expect(result.current.query).toEqual(EMPTY_QUERY);
  });

  it('marks toolbar changes unsaved and reloads without rebuilding unless asked', async () => {
    const { result } = renderQuery('/leads?view=view-1');
    await waitFor(() => expect(result.current.gridKey).toBe(1));

    act(() => result.current.apply({ columns: ['name'] }));
    expect(result.current.dirty).toBe(true);
    expect(result.current.refreshSignal).toBe(1);
    expect(result.current.gridKey).toBe(1);

    act(() => result.current.apply({ sorts: [{ property: 'email', dir: SortDir.Desc }] }, true));
    expect(result.current.gridKey).toBe(2);
    expect(result.current.queryRef.current.sorts).toEqual([
      { property: 'email', dir: SortDir.Desc },
    ]);

    act(() => result.current.apply({ columns: ['name'] }));
    expect(result.current.refreshSignal).toBe(1);
  });

  it('throws away unsaved changes when the open view is chosen again', async () => {
    const { result } = renderQuery('/leads?view=view-1');
    await waitFor(() => expect(result.current.gridKey).toBe(1));
    act(() => result.current.apply({ search: 'globex' }));
    expect(result.current.dirty).toBe(true);

    act(() => result.current.chooseView('view-1'));
    expect(result.current.query.search).toBe('acme');
    expect(result.current.dirty).toBe(false);
    expect(result.current.gridKey).toBe(2);
  });

  it('switches to another view through the URL', async () => {
    const { result } = renderQuery('/leads?view=view-1');
    await waitFor(() => expect(result.current.gridKey).toBe(1));
    act(() => result.current.chooseView('view-2'));
    await waitFor(() => expect(result.current.url).toBe('/leads?view=view-2'));
    expect(result.current.selectedView).toBe(MINE);
    expect(result.current.query.search).toBe('');

    act(() => result.current.selectView(''));
    await waitFor(() => expect(result.current.url).toBe('/leads'));
  });

  it('records what the grid asked for without a reload', () => {
    const { result } = renderQuery();
    act(() => result.current.record({ ...EMPTY_QUERY, search: 'typed' }));
    expect(result.current.query.search).toBe('typed');
    expect(result.current.queryRef.current.search).toBe('typed');
    expect(result.current.refreshSignal).toBe(0);
    expect(result.current.gridKey).toBe(0);
  });

  it('has no views while the query has not answered', () => {
    views.result.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('x'),
      refetch: views.refetch,
    });
    const { result } = renderQuery();
    expect(result.current.views).toEqual([]);
    expect(result.current.viewsError).toEqual(new Error('x'));
  });
});
