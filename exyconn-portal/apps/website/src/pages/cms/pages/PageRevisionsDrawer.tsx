import RestoreIcon from '@mui/icons-material/Restore';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Drawer,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useCmsPageRevisionsQuery,
  useRestoreCmsPageRevisionMutation,
} from '@exyconn/shell/graphql/generated';

interface PageRevisionsDrawerProps {
  /** The page whose published versions are listed; null closes the drawer. */
  pageId: string | null;
  onClose: () => void;
  /** After a version is copied back into the draft. */
  onRestored: () => void;
}

/** Every published version of a page, newest first, each restorable into the draft. */
export function PageRevisionsDrawer({
  pageId,
  onClose,
  onRestored,
}: Readonly<PageRevisionsDrawerProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data, loading, error } = useCmsPageRevisionsQuery({
    variables: { pageId: pageId ?? '' },
    skip: !pageId,
    fetchPolicy: 'network-only',
  });
  const [restore] = useRestoreCmsPageRevisionMutation();
  const revisions = data?.cmsPageRevisions ?? [];

  const restoreVersion = async (revision: { id: string; version: number }) => {
    const ok = await confirm({
      title: 'Restore version {version}?',
      titleValues: { version: revision.version },
      message:
        'It replaces the current draft (unsaved builder changes are lost). Publish it to put it live.',
      confirmText: 'Restore',
    });
    if (!ok) return;
    await restore({ variables: { revisionId: revision.id } });
    notify('Version {version} is now the draft', 'success', { version: revision.version });
    onRestored();
  };

  return (
    <Drawer
      anchor="right"
      open={pageId !== null}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 2 }} role="region" aria-label={t('Revisions')}>
        <Text weight="bold" size="lg" component="h2">
          {t('Revisions')}
        </Text>
        <Text size="sm" color="text.secondary" component="p" sx={{ mb: 2 }}>
          {t('A version is kept every time the page is published.')}
        </Text>
        {loading && <LinearProgress aria-label={t('Loading revisions')} />}
        {error && <Alert severity="error">{error.message}</Alert>}
        {!loading && !error && revisions.length === 0 && (
          <EmptyState
            title="Not published yet"
            description="Publish the page to keep its first version."
          />
        )}
        <List>
          {revisions.map((revision) => (
            <ListItem
              key={revision.id}
              divider
              secondaryAction={
                <Button
                  size="small"
                  startIcon={<RestoreIcon />}
                  onClick={() => {
                    restoreVersion(revision).catch((reason: unknown) =>
                      notify(errorMessage(reason, 'Could not restore the version'), 'error'),
                    );
                  }}
                >
                  {t('Restore')}
                </Button>
              }
            >
              <ListItemText
                primary={t('Version {version} · {title}', {
                  version: revision.version,
                  title: revision.title,
                })}
                secondary={`${formatDateTime(revision.createdAt)} · ${revision.publishedByName}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
