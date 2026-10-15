import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCrmViewsQuery, type CrmObject } from '@exyconn/shell/graphql/generated';
import {
  EMPTY_QUERY,
  queryOfView,
  sameQuery,
  type CrmViewRow,
  type RecordQueryState,
} from './recordQuery';

/** The URL query parameter holding the selected saved view, so a link opens on that view. */
export const VIEW_PARAM = 'view';

/**
 * A list's working query and the saved views it starts from.
 *
 * The selected view lives in the URL (`?view=<id>`); choosing one replaces the working query
 * with what it saved. Every change after that is "unsaved" until it is saved over the view or
 * as a new one. `gridKey` changes when the grid has to be rebuilt to show the new query in its
 * own controls (the search box and the header sort); `refreshSignal` bumps for every other
 * change, which only needs the rows read again.
 */
export function useRecordQuery(object: CrmObject) {
  const [params, setParams] = useSearchParams();
  const viewId = params.get(VIEW_PARAM) ?? '';
  const views = useCrmViewsQuery({ variables: { object } });
  const list = useMemo(() => views.data?.crmViews ?? [], [views.data]);
  const selectedView: CrmViewRow | null = list.find((view) => view.id === viewId) ?? null;

  const [query, setQuery] = useState<RecordQueryState>(EMPTY_QUERY);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [gridKey, setGridKey] = useState(0);
  const queryRef = useRef(query);
  queryRef.current = query;
  // The view whose saved query was last put in place, so a re-render does not undo edits.
  const appliedRef = useRef<string | null>(null);

  const replace = useCallback((next: RecordQueryState, rebuild: boolean) => {
    const changed = !sameQuery(queryRef.current, next);
    queryRef.current = next;
    setQuery(next);
    if (!changed) {
      return;
    }
    if (rebuild) {
      setGridKey((key) => key + 1);
    } else {
      setRefreshSignal((signal) => signal + 1);
    }
  }, []);

  const selectView = useCallback(
    (id: string) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (id) {
          next.set(VIEW_PARAM, id);
        } else {
          next.delete(VIEW_PARAM);
        }
        return next;
      });
    },
    [setParams],
  );

  const savedQuery = useMemo(
    () => (selectedView ? queryOfView(selectedView) : EMPTY_QUERY),
    [selectedView],
  );

  useEffect(() => {
    const waiting = viewId !== '' && (!views.data || views.loading) && !selectedView;
    if (waiting || appliedRef.current === viewId) {
      return;
    }
    if (viewId && !selectedView) {
      // A deleted or unshared view: fall back to the list's own default view.
      selectView('');
      return;
    }
    appliedRef.current = viewId;
    replace(savedQuery, true);
  }, [viewId, views.data, views.loading, selectedView, savedQuery, replace, selectView]);

  /** Choosing the view already open throws away its unsaved changes. */
  const chooseView = useCallback(
    (id: string) => {
      if (id === viewId) {
        replace(savedQuery, true);
      } else {
        selectView(id);
      }
    },
    [viewId, savedQuery, replace, selectView],
  );

  /** A change made in the toolbar. */
  const apply = useCallback(
    (patch: Partial<RecordQueryState>, rebuild = false) =>
      replace({ ...queryRef.current, ...patch }, rebuild),
    [replace],
  );

  /** What the grid itself asked for (search box, header sort) — already being loaded. */
  const record = useCallback((next: RecordQueryState) => {
    queryRef.current = next;
    setQuery(next);
  }, []);

  return {
    viewId,
    views: list,
    viewsLoading: views.loading,
    viewsError: views.error,
    refetchViews: views.refetch,
    selectedView,
    query,
    queryRef,
    dirty: !sameQuery(query, savedQuery),
    chooseView,
    selectView,
    apply,
    record,
    refreshSignal,
    gridKey,
  };
}

export type RecordQuery = ReturnType<typeof useRecordQuery>;
