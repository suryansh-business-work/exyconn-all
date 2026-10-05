import { useId, useState, type MouseEvent } from 'react';
import { useT } from '@exyconn/i18n';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Switch,
  Text,
  Tooltip,
  Box,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useChatConsole } from '../chat.context';
import type { ChatAlertPrefs } from './chatAlertPrefs';
import { desktopNotificationsSupported, requestDesktopPermission } from './desktopNotification';

const TOGGLES: ReadonlyArray<{ key: keyof ChatAlertPrefs; label: string }> = [
  { key: 'sound', label: 'Play a sound for new messages' },
  { key: 'desktop', label: 'Desktop notification when this tab is in the background' },
  { key: 'animate', label: 'Animate new messages' },
];

/**
 * "Notify me" choices for the chat console — sound, desktop notification and animation —
 * kept in this browser only, so each person sets them to suit themselves.
 */
export function ChatAlertSettings() {
  const t = useT();
  const notify = useNotify();
  const popoverId = useId();
  const { prefs, setPrefs } = useChatConsole();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const enableDesktop = async () => {
    if (await requestDesktopPermission()) {
      setPrefs({ ...prefs, desktop: true });
      return;
    }
    notify('Allow notifications for this site in your browser to get desktop alerts', 'warning');
  };

  const toggle = (key: keyof ChatAlertPrefs, on: boolean) => {
    if (key === 'desktop' && on) {
      enableDesktop().catch((error: unknown) => {
        portalLogger.warn('Asking for notification permission failed', error);
        notify('Desktop notifications could not be switched on', 'error');
      });
      return;
    }
    setPrefs({ ...prefs, [key]: on });
  };

  return (
    <>
      <Tooltip title={t('Notification settings')}>
        <IconButton
          aria-label={t('Notification settings')}
          aria-haspopup="dialog"
          aria-controls={anchor ? popoverId : undefined}
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
        >
          <NotificationsActiveIcon />
        </IconButton>
      </Tooltip>
      <Popover
        id={popoverId}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, maxWidth: 360 }}>
          <Text weight="semibold" sx={{ mb: 1 }}>
            {t('Notify me about new chat messages')}
          </Text>
          <FormGroup>
            {TOGGLES.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                label={t(label)}
                disabled={key === 'desktop' && !desktopNotificationsSupported()}
                control={
                  <Switch
                    checked={prefs[key]}
                    onChange={(event) => toggle(key, event.target.checked)}
                  />
                }
              />
            ))}
          </FormGroup>
          <Text size="sm" color="text.secondary" sx={{ mt: 1 }}>
            {t('Saved in this browser only.')}
          </Text>
        </Box>
      </Popover>
    </>
  );
}
