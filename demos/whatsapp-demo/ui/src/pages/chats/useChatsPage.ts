import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ChatMessage, RenderedOption } from '@exyconn/wa-flow';
import {
  sessionId,
  useDemoAnalytics,
  useAiParse,
  useCatalog,
  useDemoUser,
  useEngineContext,
  useChatRuntime,
} from '@exyconn/bot-studio/runtime';
import type { ArrivedToast } from '../../components/wa/chat/PushToast';
import { previewOf } from '../../components/wa/list/preview';
import { HOME_PATH, chatPath } from '../../paths';

/** Everything the chats screen needs: the catalog, the runtime, analytics and the toast. */
export function useChatsPage() {
  const { demoKey } = useParams<{ demoKey?: string }>();
  const navigate = useNavigate();
  const user = useDemoUser();
  const catalog = useCatalog();
  const session = useMemo(sessionId, []);
  const ai = useAiParse(session);
  const track = useDemoAnalytics();
  const context = useEngineContext(user, ai.configured);
  const [toast, setToast] = useState<ArrivedToast | null>(null);

  const onArrived = useCallback(
    (key: string, message: ChatMessage) => {
      setToast({ id: message.id, demoKey: key, text: previewOf(message, context().t) });
    },
    [context],
  );

  const runtime = useChatRuntime({
    bundles: catalog.bundles,
    context,
    storageUserId: user.id,
    seedText: user.id,
    activeKey: demoKey,
    track,
    parse: ai.read,
    onArrived,
  });

  const { open } = runtime;
  const ready = catalog.bundles.has(demoKey ?? '');
  useEffect(() => {
    if (demoKey && ready) {
      open(demoKey);
    }
  }, [demoKey, ready, open]);

  const openChat = useCallback((key: string) => navigate(chatPath(key)), [navigate]);
  const back = useCallback(() => navigate(HOME_PATH), [navigate]);
  const send = useCallback(
    (text: string) => demoKey && runtime.send(demoKey, text),
    [demoKey, runtime],
  );
  const choose = useCallback(
    (option: RenderedOption, quoted: string) => demoKey && runtime.choose(demoKey, option, quoted),
    [demoKey, runtime],
  );
  const clear = useCallback(() => demoKey && runtime.clear(demoKey), [demoKey, runtime]);

  return {
    demoKey,
    user,
    catalog,
    runtime,
    track,
    toast,
    setToast,
    openChat,
    back,
    send,
    choose,
    clear,
  };
}
