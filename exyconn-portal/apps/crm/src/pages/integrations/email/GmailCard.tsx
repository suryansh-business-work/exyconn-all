import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { ProviderLogo } from '../../../integrations/ProviderLogo';

/** The existing page where Gmail mailboxes are connected and managed. */
const GMAIL_SETTINGS_PATH = '/settings/gmail';

/** Whether a Gmail mailbox is ready, and the way to the page that manages them. */
export function GmailCard({ ready }: Readonly<{ ready: boolean }>) {
  const t = useT();
  return (
    <Box component="section" sx={panel} aria-labelledby="gmail-heading">
      <Flex direction="column" spacing={1.5}>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <ProviderLogo provider="GMAIL" size={28} />
          <Text id="gmail-heading" component="h2" weight="semibold">
            {t('Gmail')}
          </Text>
          <Chip
            size="small"
            color={ready ? 'success' : 'default'}
            label={ready ? t('Connected') : t('Not connected')}
          />
        </Flex>
        <Text size="sm" color="text.secondary">
          {t('Send from Gmail mailboxes and see every thread with a contact on their page.')}
        </Text>
        <Box>
          <Button variant="contained" component={RouterLink} to={GMAIL_SETTINGS_PATH}>
            {t('Manage Gmail accounts')}
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
