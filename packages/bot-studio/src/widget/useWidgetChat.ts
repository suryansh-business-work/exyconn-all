/**
 * One website chat on the shared runtime: the live demo (saved per visitor, counted in
 * analytics, free text read by AI) or an editor preview (in memory, nothing reported).
 */
import { useCallback, useEffect, useMemo } from 'react';
import type { RenderedOption } from '@exyconn/wa-flow';
import { MENU } from '@exyconn/wa-flow/engine';
import type { CatalogBundle, RuntimeSignal } from '../runtime/types';
import { useAiParse } from '../runtime/useAiParse';
import { useChatRuntime } from '../runtime/useChatRuntime';
import { useDemoUser } from '../runtime/useDemoUser';
import { useEngineContext } from '../runtime/useEngineContext';
import { useDemoAnalytics } from '../runtime/analytics/useDemoAnalytics';
import { sessionId } from '../runtime/analytics/session';

/**
 * The website demo shares its origin (demos.exyconn.com) with the WhatsApp demo; its saved
 * chats live under their own key so neither app overwrites the other's.
 */
const STORAGE_SCOPE = 'website:';
const PREVIEW_SESSION = 'editor-preview';

interface WidgetChatOptions {
  bundles: ReadonlyMap<string, CatalogBundle>;
  demoKey: string;
  /** Live: saved, counted and AI-read; otherwise an in-memory preview. */
  live: boolean;
  track?: (signal: RuntimeSignal) => void;
  session: string;
}

function useWidgetRuntime({ bundles, demoKey, live, track, session }: WidgetChatOptions) {
  const user = useDemoUser();
  const ai = useAiParse(session);
  const context = useEngineContext(user, ai.configured);
  const runtime = useChatRuntime({
    bundles,
    context,
    storageUserId: live && user.id ? `${STORAGE_SCOPE}${user.id}` : null,
    seedText: user.id,
    activeKey: demoKey,
    track,
    parse: ai.read,
  });
  const { open, send, choose, clear } = runtime;
  const bundle = bundles.get(demoKey);

  useEffect(() => {
    if (bundle) {
      open(demoKey);
    }
  }, [bundle, demoKey, open]);

  /** Starts one workflow as if its row in the menu was tapped. */
  const startWorkflow = useCallback(
    (key: string) => {
      const entry = bundle?.workflows.find((w) => w.key === key);
      if (!bundle || !entry) {
        return;
      }
      const option = {
        id: entry.key,
        title: entry.name,
        ref: { workflow: MENU, node: MENU, handle: entry.key },
      };
      choose(demoKey, option, bundle.demo.menuText);
    },
    [bundle, choose, demoKey],
  );

  const record = runtime.store.chats[demoKey];
  return {
    bundle,
    user,
    aiConfigured: ai.configured,
    messages: record?.messages ?? [],
    typing: runtime.store.typing[demoKey] ?? false,
    send: useCallback((text: string) => send(demoKey, text), [demoKey, send]),
    choose: useCallback(
      (option: RenderedOption, quoted: string) => choose(demoKey, option, quoted),
      [choose, demoKey],
    ),
    restart: useCallback(() => clear(demoKey), [clear, demoKey]),
    startWorkflow,
  };
}

export type WidgetChat = ReturnType<typeof useWidgetRuntime>;

/** The live demo: one visitor's chat with one demo website's agent. */
export function useLiveWidgetChat(bundles: ReadonlyMap<string, CatalogBundle>, demoKey: string) {
  const session = useMemo(sessionId, []);
  const track = useDemoAnalytics();
  return useWidgetRuntime({ bundles, demoKey, live: true, track, session });
}

/** The editor's preview: the draft bundle in memory, nothing saved or counted. */
export function usePreviewWidgetChat(bundle: CatalogBundle) {
  const bundles = useMemo(() => new Map([[bundle.demo.key, bundle]]), [bundle]);
  return useWidgetRuntime({
    bundles,
    demoKey: bundle.demo.key,
    live: false,
    session: PREVIEW_SESSION,
  });
}
