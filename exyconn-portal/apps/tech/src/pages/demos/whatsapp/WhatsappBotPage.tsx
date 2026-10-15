import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Link } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { WhatsappChannelPanel } from './WhatsappChannelPanel';

/** Where the OpenAI key the bot reads free text with is kept. */
const OPENAI_SETTINGS_PATH = '/tech/environment-variables/openai';

/**
 * Tech > Demos > WhatsApp bot: the real WhatsApp Business number the demo's workflows answer
 * on, its Meta credentials (each with a Test), and where its AI key lives.
 */
export function WhatsappBotPage() {
  const t = useT();
  return (
    <Box sx={readingPanel}>
      <PageHeader
        title="WhatsApp bot"
        subtitle="The real WhatsApp Business number behind demos.exyconn.com/whatsapp-demo"
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        {t(
          'The demo chat on demos.exyconn.com needs nothing here. Connect a number to answer real WhatsApp messages with the same workflows. Free-text replies use the active OpenAI key in',
        )}{' '}
        <Link component={RouterLink} to={OPENAI_SETTINGS_PATH}>
          {t('Environment variables > OpenAI')}
        </Link>
        .
      </Alert>
      <WhatsappChannelPanel />
    </Box>
  );
}
