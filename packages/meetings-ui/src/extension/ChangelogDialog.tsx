import { useFormatters, useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Heading,
  Skeleton,
  Text,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useMaReleasesQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';

/** Every release the viewer may see, newest first, with what changed in it. */
export function ChangelogDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const t = useT();
  const { formatDate } = useFormatters();
  const { data, error, refetch } = useMaReleasesQuery({ skip: !open });

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (data?.maReleases.length === 0) {
    body = <Text>{t('No release available yet.')}</Text>;
  } else if (data) {
    body = data.maReleases.map((release) => (
      <Box key={release.id} sx={{ mb: 2 }}>
        <Heading level={3} sx={{ typography: 'subtitle1' }}>
          {t('Version {version} · {date}', {
            version: release.version,
            date: formatDate(release.builtAt),
          })}{' '}
          <StatusChip value={release.channel} />
        </Heading>
        <Text component="p" size="sm" sx={{ whiteSpace: 'pre-line', m: 0 }}>
          {release.releaseNotes || t('No release notes.')}
        </Text>
      </Box>
    ));
  } else {
    body = <Skeleton variant="rounded" height={160} />;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('Changelog')}</DialogTitle>
      <DialogContent>{body}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
