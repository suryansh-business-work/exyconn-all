import { useT } from '@exyconn/i18n';
import { ChatWidget } from '@exyconn/bot-studio/widget';
import { Alert, Box, Button, Skeleton } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { LIVE_CHAT_ID, type WebsiteDemo } from './useWebsiteDemo';

const HEIGHT = { xs: 560, md: 640 };

/** The live agent of the website on screen, or why it cannot be shown yet. */
export function LiveChat({ demo }: Readonly<{ demo: WebsiteDemo }>) {
  const t = useT();
  const { chat, loading, error, retry } = demo;
  const retryLoad = () => {
    retry().catch((retryError: unknown) =>
      portalLogger.warn('website chat demo: retry failed', retryError),
    );
  };

  if (error && !chat.bundle) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retryLoad}>
            {t('Retry')}
          </Button>
        }
      >
        {t('The demo websites could not be loaded.')}
      </Alert>
    );
  }
  if (loading || !chat.bundle) {
    return loading ? (
      <Skeleton variant="rectangular" sx={{ height: HEIGHT }} aria-label={t('Loading the chat')} />
    ) : (
      <Alert severity="info">
        {t('No demo website is published yet. Publish one in Tech > Demos > Website chat bot.')}
      </Alert>
    );
  }
  return (
    <Box id={LIVE_CHAT_ID} sx={{ height: HEIGHT, scrollMarginTop: 80 }}>
      <ChatWidget chat={{ ...chat, bundle: chat.bundle }} />
    </Box>
  );
}
