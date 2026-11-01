import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { Alert, Box, Button, Link } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { OPENAI_SETTINGS_URL } from '../techLinks';
import { WhatsappChannelPanel } from './WhatsappChannelPanel';

/**
 * Agents > WhatsApp > WhatsApp number: the real WhatsApp Business number the workflows answer
 * on, its Meta credentials (each with a Test), and where its AI key lives. The full WhatsApp
 * look-alike chat stays in the demo, linked from here.
 */
export function WhatsappNumberTab() {
  const t = useT();
  return (
    <Box sx={readingPanel}>
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Button
            size="small"
            href={appBaseUrl('whatsapp-demo')}
            target="_blank"
            rel="noopener"
            endIcon={<OpenInNewIcon />}
          >
            {t('Open the demo')}
          </Button>
        }
      >
        {t(
          'The demo chat on demos.exyconn.com needs nothing here. Connect a number to answer real WhatsApp messages with the same workflows. Free-text replies use the active OpenAI key in',
        )}{' '}
        <Link href={OPENAI_SETTINGS_URL}>{t('Environment variables > OpenAI')}</Link>.
      </Alert>
      <WhatsappChannelPanel />
    </Box>
  );
}
