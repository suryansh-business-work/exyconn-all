import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { Box, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { IconBubble } from '@exyconn/shell/components/dashboard/IconBubble';
import { color } from '@exyconn/ui';

interface GoogleConnectionStatusProps {
  connected: boolean;
  /** The bold line: the connected account, or what connecting does. */
  title: string;
  /** The quieter line under it, already translated. */
  detail: string;
  /** Connect or Disconnect. */
  action: ReactNode;
}

/** The connection as one bordered row: Meet icon, status, account and the one action. */
export function GoogleConnectionStatus({
  connected,
  title,
  detail,
  action,
}: Readonly<GoogleConnectionStatusProps>) {
  const t = useT();
  const accent = connected ? color.green[500] : color.indigo[400];
  return (
    <Flex
      direction="row"
      spacing={2}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: connected ? 'success.main' : 'divider',
      }}
    >
      <IconBubble icon={VideoCallIcon} accent={accent} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Chip
          size="small"
          color={connected ? 'success' : 'default'}
          variant={connected ? 'filled' : 'outlined'}
          icon={connected ? <CheckCircleIcon /> : undefined}
          label={connected ? t('Connected') : t('Not connected')}
          sx={{ mb: 0.5 }}
        />
        <Text component="p" size="sm" weight="semibold" sx={{ m: 0, overflowWrap: 'anywhere' }}>
          {title}
        </Text>
        <Text component="p" size="caption" color="text.secondary" sx={{ m: 0 }}>
          {detail}
        </Text>
      </Box>
      {action}
    </Flex>
  );
}
