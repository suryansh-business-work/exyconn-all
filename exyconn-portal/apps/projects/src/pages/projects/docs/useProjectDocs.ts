import { useCallback, useMemo, useState } from 'react';
import {
  useProjectDocPagesQuery,
  useCreateDocPageMutation,
  useUpdateDocPageMutation,
  useDeleteDocPageMutation,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { buildDocTree, trailOf } from './doc-tree';

/** A new page needs a name before it exists; this is the one it is born with. */
const NEW_PAGE_TITLE = 'Untitled page';

/**
 * A project's documentation space: the page list, the tree built from it, and the three
 * writes the sidebar performs. The open page's own body is loaded separately, by the editor,
 * so moving around the tree does not re-fetch every page's prose.
 */
export function useProjectDocs(projectId: string) {
  const notify = useNotify();
  const { data, loading, refetch } = useProjectDocPagesQuery({
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const [createPage] = useCreateDocPageMutation();
  const [updatePage] = useUpdateDocPageMutation();
  const [deletePage] = useDeleteDocPageMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pages = useMemo(() => data?.projectDocPages ?? [], [data]);
  const tree = useMemo(() => buildDocTree(pages), [pages]);
  const trail = useMemo(() => (selectedId ? trailOf(pages, selectedId) : []), [pages, selectedId]);

  const fail = useCallback(
    (error: unknown) => notify(error instanceof Error ? error.message : 'Action failed', 'error'),
    [notify],
  );

  const addPage = useCallback(
    async (parentId: string | null) => {
      try {
        const { data: created } = await createPage({
          variables: { projectId, parentId, title: NEW_PAGE_TITLE },
        });
        await refetch();
        if (created?.createDocPage.id) {
          setSelectedId(created.createDocPage.id);
        }
      } catch (error) {
        fail(error);
      }
    },
    [createPage, projectId, refetch, fail],
  );

  const savePage = useCallback(
    async (id: string, values: { title: string; body: string }) => {
      try {
        await updatePage({ variables: { id, ...values } });
        notify('Page saved');
        await refetch();
      } catch (error) {
        fail(error);
      }
    },
    [updatePage, notify, refetch, fail],
  );

  const removePage = useCallback(
    async (id: string) => {
      try {
        await deletePage({ variables: { id } });
        setSelectedId(null);
        await refetch();
      } catch (error) {
        fail(error);
      }
    },
    [deletePage, refetch, fail],
  );

  return {
    loading,
    pages,
    tree,
    trail,
    selectedId,
    setSelectedId,
    addPage,
    savePage,
    removePage,
  };
}
