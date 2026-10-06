import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import {
  CmsPreviewTokenDocument,
  type CmsPreviewTokenQuery,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { queryData } from '@exyconn/shell/utils/queryData';
import { siteOrigin, useCurrentSite } from '../site';

/** The address of a page's draft on the website (/cms-preview, valid two hours). */
export function usePreviewUrl(): (pageId: string) => Promise<string> {
  const client = useApolloClient();
  const { site } = useCurrentSite();
  return useCallback(
    async (pageId: string) => {
      const result = await client.query<CmsPreviewTokenQuery>({
        query: CmsPreviewTokenDocument,
        variables: { pageId },
        fetchPolicy: 'network-only',
      });
      const token = queryData(result, 'The preview link').cmsPreviewToken;
      return `${siteOrigin(site.domains)}/cms-preview?token=${encodeURIComponent(token)}`;
    },
    [client, site.domains],
  );
}

/**
 * Opens a page's draft on the website in a new tab. The tab is opened at the click, before the
 * token arrives (and before `beforeOpen` — saving the draft — runs), so the browser does not
 * treat it as a pop-up.
 */
export function usePreviewPage(): (pageId: string, beforeOpen?: () => Promise<unknown>) => void {
  const notify = useNotify();
  const previewUrl = usePreviewUrl();

  const open = async (pageId: string, tab: Window | null, beforeOpen?: () => Promise<unknown>) => {
    await beforeOpen?.();
    const url = await previewUrl(pageId);
    if (tab) {
      tab.location.href = url;
    } else {
      globalThis.open(url, '_blank', 'noopener');
    }
  };

  return (pageId, beforeOpen) => {
    const tab = globalThis.open('', '_blank');
    open(pageId, tab, beforeOpen).catch((error: unknown) => {
      tab?.close();
      notify(errorMessage(error, 'Could not open the preview'), 'error');
    });
  };
}
