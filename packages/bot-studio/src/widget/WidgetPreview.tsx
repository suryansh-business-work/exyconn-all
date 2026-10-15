import { useEffect, useRef } from 'react';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { ChatWidget } from './ChatWidget';
import { usePreviewWidgetChat } from './useWidgetChat';

const PREVIEW_REVISION = 'preview';

/**
 * A draft played in the website widget, in memory — the bot studio's Preview for website
 * bots (and for rehearsing a calling bot's call flow as text). Remount to restart.
 */
export function WidgetPreview({
  bundle,
  startWorkflow,
}: Readonly<{ bundle: DemoBundle; startWorkflow?: string }>) {
  const chat = usePreviewWidgetChat({ ...bundle, revision: PREVIEW_REVISION });
  const started = useRef(false);
  const { startWorkflow: start } = chat;

  useEffect(() => {
    if (started.current || !startWorkflow) {
      return;
    }
    started.current = true;
    start(startWorkflow);
  }, [start, startWorkflow]);

  if (!chat.bundle) {
    return null;
  }
  return <ChatWidget chat={{ ...chat, bundle: chat.bundle }} />;
}
