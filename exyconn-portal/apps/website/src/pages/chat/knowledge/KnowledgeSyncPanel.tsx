import { useT } from '@exyconn/i18n';
import SyncIcon from '@mui/icons-material/Sync';
import { Alert, Box, Button, CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  WebsiteChatSettingsDocument,
  useSyncWebsiteChatKnowledgeMutation,
  useWebsiteChatSettingsQuery,
} from '@exyconn/shell/graphql/generated';

/**
 * Re-reads exyconn.com into the knowledge base, with when it last ran, how many pages it
 * found and why it last failed. Explains the two kinds of entry while it is at it.
 */
export function KnowledgeSyncPanel({ onSynced }: Readonly<{ onSynced: () => void }>) {
  const t = useT();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data } = useWebsiteChatSettingsQuery();
  const [syncKnowledge, { loading }] = useSyncWebsiteChatKnowledgeMutation({
    refetchQueries: [WebsiteChatSettingsDocument],
  });
  const settings = data?.websiteChatSettings;

  const sync = () => {
    syncKnowledge()
      .then((result) => {
        notify('Read {count} pages from the website', 'success', {
          count: result.data?.syncWebsiteChatKnowledge.count ?? 0,
        });
        onSynced();
      })
      .catch((error: unknown) => notify(errorMessage(error, 'The website sync failed'), 'error'));
  };

  const lastSync = settings?.knowledgeSyncedAt
    ? t('Last synced {when} · {count} pages', {
        when: formatDateTime(settings.knowledgeSyncedAt),
        count: settings.knowledgeSyncCount,
      })
    : t('Not synced yet');

  return (
    <Box sx={[panel, { p: 2, mb: 2 }]}>
      <Flex
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Box>
          <Text size="sm" color="text.secondary">
            {t(
              'Website entries are read from exyconn.com (pages, blog posts and case studies) and replaced on every sync. Custom entries are the team\'s own "Custom Content window": anything you add here, which a sync never touches.',
            )}
          </Text>
          <Text size="sm" weight="medium" sx={{ mt: 1 }} role="status">
            {lastSync}
          </Text>
        </Box>
        <Button
          variant="contained"
          onClick={sync}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          sx={{ flexShrink: 0 }}
        >
          {loading ? t('Syncing…') : t('Sync website content')}
        </Button>
      </Flex>
      {settings?.knowledgeSyncError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('The last sync failed: {reason}', { reason: settings.knowledgeSyncError })}
        </Alert>
      )}
    </Box>
  );
}
