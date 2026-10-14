import { useEffect, useMemo, useRef } from 'react';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { MENU } from '@exyconn/wa-flow/engine';
import { useAiParse } from '../../../hooks/useAiParse';
import { useDemoUser } from '../../../hooks/useDemoUser';
import { useEngineContext } from '../../../hooks/useEngineContext';
import type { CatalogBundle } from '../../../runtime/types';
import { useChatRuntime } from '../../../runtime/useChatRuntime';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SHADOW } from '../../../theme/wa.tokens';
import { ChatPane } from '../chat/ChatPane';

export interface ChatPreviewProps {
  /** The demo plus the workflows to run — the editor passes the DRAFT graph here. */
  bundle: DemoBundle;
  /** Workflow key to open straight into, after the greeting. */
  startWorkflow?: string;
}

const PREVIEW_SESSION = 'editor-preview';

/**
 * The real chat, run in memory against a bundle — what the workflow editor's "Preview in
 * WhatsApp" shows. Nothing is saved and nothing is reported to analytics. Remount (change its
 * `key`) to restart.
 */
export function ChatPreview({ bundle, startWorkflow }: Readonly<ChatPreviewProps>) {
  const t = useT();
  const c = useWaPalette();
  const user = useDemoUser();
  const ai = useAiParse(PREVIEW_SESSION);
  const context = useEngineContext(user, ai.configured);
  const key = bundle.demo.key;
  const bundles = useMemo(
    () => new Map<string, CatalogBundle>([[key, { ...bundle, revision: 'preview' }]]),
    [bundle, key],
  );
  const runtime = useChatRuntime({
    bundles,
    context,
    storageUserId: null,
    seedText: user.id,
    activeKey: key,
    parse: ai.read,
  });
  const { open, choose } = runtime;
  const entry = bundle.workflows.find((w) => w.key === startWorkflow);

  const started = useRef(false);
  useEffect(() => {
    // Plays once per mount; the editor remounts the preview to restart it.
    if (started.current) {
      return;
    }
    started.current = true;
    open(key);
    if (entry) {
      const ref = { workflow: MENU, node: MENU, handle: entry.key };
      choose(key, { id: entry.key, title: entry.name, ref }, bundle.demo.menuText);
    }
  }, [bundle.demo.menuText, choose, entry, key, open]);

  const record = runtime.store.chats[key];
  return (
    <Box
      aria-label={t('WhatsApp preview')}
      role="region"
      sx={{
        display: 'flex',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: WA_RADIUS.sheet,
        boxShadow: WA_SHADOW.toast,
        fontFamily: WA_FONT.family,
        bgcolor: c.chatBackground,
        color: c.text,
      }}
    >
      <ChatPane
        bundle={{ ...bundle, revision: 'preview' }}
        messages={record?.messages ?? []}
        typing={runtime.store.typing[key] ?? false}
        onSend={(text) => runtime.send(key, text)}
        onChoose={(option, quoted) => runtime.choose(key, option, quoted)}
        onClear={() => runtime.clear(key)}
        onBack={() => undefined}
      />
    </Box>
  );
}
