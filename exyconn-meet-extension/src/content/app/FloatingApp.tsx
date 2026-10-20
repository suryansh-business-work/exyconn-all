import { useCallback, useEffect, useRef, useState } from 'react';
import type { Logger } from '@exyconn/logger';
import { useLayout } from '../../hooks/useLayout';
import { useWorkerState } from '../../hooks/useWorkerState';
import type { ExtensionPrefs } from '../../storage/prefs';
import { AssistantPanel } from './AssistantPanel';
import { FloatingIcon } from './FloatingIcon';
import { ReminderBanner } from './ReminderBanner';

const PANEL_ID = 'exyconn-assistant-panel';

/**
 * The assistant inside Meet: the floating icon, the side panel and the reminder banner.
 * Everything it shows comes from the worker; it holds no token and no meeting data of its own.
 */
export function FloatingApp({
  prefs,
  logger,
}: Readonly<{ prefs: ExtensionPrefs; logger: Logger }>) {
  const { state } = useWorkerState(undefined, logger);
  const layout = useLayout();
  const [open, setOpen] = useState(prefs.defaultPanelState === 'expanded');
  const iconRef = useRef<HTMLButtonElement>(null);
  const meetingState = state?.tab?.meetingState;

  useEffect(() => {
    if (meetingState === 'IN_MEETING' && prefs.autoOpenPanel) {
      setOpen(true);
    }
  }, [meetingState, prefs.autoOpenPanel]);

  const close = useCallback((): void => {
    setOpen(false);
    iconRef.current?.focus();
  }, []);

  if (state?.tab == null || layout === null) {
    return null;
  }

  return (
    <>
      {state.tab.reminderBanner ? (
        <ReminderBanner snoozeMinutes={prefs.snoozeMinutes} logger={logger} />
      ) : null}
      {prefs.showFloatingIcon ? (
        <FloatingIcon
          ref={iconRef}
          status={state.tab.iconStatus}
          open={open}
          panelId={PANEL_ID}
          layout={layout}
          corner={prefs.iconCorner}
          logger={logger}
          onToggle={() => setOpen((current) => !current)}
        />
      ) : null}
      {open ? (
        <AssistantPanel
          id={PANEL_ID}
          layout={layout}
          onClose={close}
          state={state}
          tab={state.tab}
          prefs={prefs}
          logger={logger}
        />
      ) : null}
    </>
  );
}
