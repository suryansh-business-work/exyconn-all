import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ChatMessage, RenderedOption } from '@exyconn/wa-flow';
import { sessionId } from '../../analytics/session';
import { useDemoAnalytics } from '../../analytics/useDemoAnalytics';
import type { ArrivedToast } from '../../components/wa/chat/PushToast';
import { previewOf } from '../../components/wa/list/preview';
import { useAiParse } from '../../hooks/useAiParse';
import { useCatalog } from '../../hooks/useCatalog';
import { useDemoUser } from '../../hooks/useDemoUser';
import { useEngineContext } from '../../hooks/useEngineContext';
import { useChatRuntime } from '../../runtime/useChatRuntime';
import { HOME_PATH } from '../../paths';

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

  const openChat = useCallback((key: string) => navigate(`${HOME_PATH}/${key}`), [navigate]);
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
