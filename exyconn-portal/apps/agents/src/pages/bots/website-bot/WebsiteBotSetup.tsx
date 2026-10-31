import { useT } from '@exyconn/i18n';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { useWhatsappDemoAiStatusQuery } from '@exyconn/shell/graphql/generated';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Typography,
} from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { WIDGET_PLATFORMS } from '@exyconn/bot-studio/widget';
import { OPENAI_SETTINGS_URL } from '../techLinks';

/** Whether free text is read by AI, or the agent runs its guided workflows only (showcase). */
function AiStatus() {
  const t = useT();
  const { data, loading } = useWhatsappDemoAiStatusQuery({ fetchPolicy: 'cache-and-network' });
  const status = data?.whatsappDemoAiStatus;
  if (loading && !status) {
    return null;
  }
  if (status?.configured) {
    return (
      <Alert severity="success">
        {t('AI answers are on: free text is read with {model}.', {
          model: status.model ?? 'OpenAI',
        })}
      </Alert>
    );
  }
  return (
    <Alert severity="info">
      {t(
        'Showcase mode: every guided workflow runs without any key. Typed questions outside the workflows are understood once an OpenAI key is active in',
      )}{' '}
      <Link href={OPENAI_SETTINGS_URL}>{t('Environment variables > OpenAI')}</Link>.
    </Alert>
  );
}

/**
 * Agents > Website chat agent > Setup: the live demo, whether AI is on, and how the agent
 * reaches a client's website.
 */
export function WebsiteBotSetup() {
  const t = useT();
  const demoUrl = appBaseUrl('website-chat-demo');
  return (
    <Box sx={{ ...readingPanel, display: 'grid', gap: 2 }}>
      <AiStatus />
      <Card variant="outlined">
        <CardContent sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="h6" component="h2">
            {t('The live demo')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              'Prospects sign in with their email and a one-time code, pick a services firm or an online store, and chat with its agent. It runs the published version of every workflow here.',
            )}
          </Typography>
          <Box>
            <Button
              variant="contained"
              endIcon={<OpenInNewIcon />}
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Open the demo')}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="h6" component="h2">
            {t('How it reaches a client’s website')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              'Each client gets its own demo here (Bot workflows > New demo): their business profile, colours and workflows. Their site loads the widget with one script tag, and every chat shows up under Analytics and Sessions.',
            )}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {WIDGET_PLATFORMS.map((platform) => (
              <Chip key={platform} label={platform} variant="outlined" size="small" />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
