import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { appUrl } from '@exyconn/shell/config/apps';

/** Where the number's settings live now, beside the calling bot's in the Tech portal. */
const SETTINGS_URL = appUrl('tech', '/tech/demos/whatsapp-bot');

/**
 * WhatsApp number: its settings moved to Tech > Demos > WhatsApp bot, where every demo's keys
 * are kept and tested; this tab points there.
 */
export function ChannelTab() {
  const t = useT();
  usePageTitle(t('WhatsApp number'));
  return (
    <Box sx={panel} component="section" aria-labelledby="wa-number-moved">
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography id="wa-number-moved" variant="h6" component="h2">
          {t('The WhatsApp number is set up in the Tech portal')}
        </Typography>
        <Typography color="text.secondary">
          {t(
            'Connect the number, test its access token and see the webhook to give Meta at Tech > Demos > WhatsApp bot, next to the calling bot.',
          )}
        </Typography>
        <Button
          variant="contained"
          href={SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNewIcon />}
        >
          {t('Open WhatsApp bot settings')}
        </Button>
      </Stack>
    </Box>
  );
}
