import { useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCatalog } from '@exyconn/bot-studio/runtime';
import { useLiveWidgetChat } from '@exyconn/bot-studio/widget';

/** Where the live chat sits on the page; "Try it" buttons scroll it into view. */
export const LIVE_CHAT_ID = 'live-chat';

/**
 * The demo websites (the `website` channel's published demos), the one on screen — chosen in
 * the URL, the first by default — and the visitor's live chat with its agent.
 */
export function useWebsiteDemo() {
  const { demoKey } = useParams<{ demoKey?: string }>();
  const navigate = useNavigate();
  const catalog = useCatalog('website');
  const sites = useMemo(() => [...catalog.bundles.values()], [catalog.bundles]);
  const current = catalog.bundles.get(demoKey ?? '') ?? sites[0];
  const chat = useLiveWidgetChat(catalog.bundles, current?.demo.key ?? '');

  const pickSite = useCallback((key: string) => navigate(`/${key}`), [navigate]);

  /** Starts one workflow in the live chat and brings the chat into view. */
  const tryWorkflow = useCallback(
    (key: string) => {
      chat.startWorkflow(key);
      globalThis.document
        .getElementById(LIVE_CHAT_ID)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [chat],
  );

  return {
    sites,
    current,
    chat,
    loading: catalog.loading,
    error: catalog.error,
    retry: catalog.refetch,
    pickSite,
    tryWorkflow,
  };
}

export type WebsiteDemo = ReturnType<typeof useWebsiteDemo>;
