import { useEffect } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Tooltip, useTheme } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';

interface ConnectMailboxButtonProps {
  /** E.g. "Connect Gmail account". */
  label: string;
  /** Whether the platform can connect this provider; unknown while the first load runs. */
  available: boolean | undefined;
  connecting: boolean;
  onConnect: () => void;
  /** The provider, for the log line when it cannot connect. */
  provider: string;
}

/**
 * Opens the provider's consent page. While the platform cannot connect the provider yet, it does
 * nothing and says why in a short tooltip, and the page logs that once so Tech can see it.
 */
export function ConnectMailboxButton({
  label,
  available,
  connecting,
  onConnect,
  provider,
}: Readonly<ConnectMailboxButtonProps>) {
  const t = useT();
  const theme = useTheme();
  const unavailable = available === false;
  useEffect(() => {
    if (unavailable) {
      portalLogger.warn('crm: email accounts cannot connect yet, the OAuth app is not set up', {
        provider,
      });
    }
  }, [unavailable, provider]);

  if (!unavailable) {
    return (
      <Box>
        <Button variant="contained" onClick={onConnect} loading={connecting} disabled={!available}>
          {t(label)}
        </Button>
      </Box>
    );
  }
  // Stays focusable (aria-disabled, not disabled) so the reason can be reached from the keyboard.
  return (
    <Box>
      <Tooltip title={t('Not available yet — ask your administrator')} describeChild>
        <Button
          variant="contained"
          aria-disabled
          sx={{ opacity: theme.palette.action.disabledOpacity, cursor: 'not-allowed' }}
        >
          {t(label)}
        </Button>
      </Tooltip>
    </Box>
  );
}
