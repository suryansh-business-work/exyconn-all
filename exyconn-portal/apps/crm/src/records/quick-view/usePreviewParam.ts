import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** The URL query parameter holding the record shown in a list's quick view. */
export const PREVIEW_PARAM = 'preview';

/**
 * The record a list is previewing, kept in the URL (`?preview=<id>`) so back, refresh and a
 * shared link all reopen it. Opening adds a history entry; closing replaces it, keeping the
 * list's other parameters (such as the saved view) as they were.
 */
export function usePreviewParam() {
  const [params, setParams] = useSearchParams();
  const previewId = params.get(PREVIEW_PARAM) ?? '';

  const openPreview = useCallback(
    (id: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (id) {
            next.set(PREVIEW_PARAM, id);
          } else {
            next.delete(PREVIEW_PARAM);
          }
          return next;
        },
        { replace: !id },
      );
    },
    [setParams],
  );
  const closePreview = useCallback(() => openPreview(''), [openPreview]);

  return { previewId, openPreview, closePreview };
}
