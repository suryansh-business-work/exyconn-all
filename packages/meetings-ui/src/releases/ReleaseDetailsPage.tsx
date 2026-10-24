import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import { Alert, Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useMaReleasesQuery } from '@exyconn/shell/graphql/generated';
import { cellText } from '@exyconn/shell/utils/cellText';
import type { ReleaseRow } from '../forms/release-status';
import { LoadError } from '../lib/LoadError';
import { ReleaseHistoryDialog } from './ReleaseHistoryDialog';
import { RELEASES_PATH } from './releasePaths';
import { useReleaseColumns } from './useReleaseColumns';
import { useReleaseDownload } from './useReleaseDownload';

/** Every field of the build — the Builds table's own columns — then its notes and actions. */
function ReleaseDetails({ release }: Readonly<{ release: ReleaseRow }>) {
  const t = useT();
  const columns = useReleaseColumns();
  const { download } = useReleaseDownload();
  const [history, setHistory] = useState<ReleaseRow | null>(null);
  return (
    <Box sx={densePanel}>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!release.downloadable}
          onClick={() => download(release.id)}
        >
          {t('Download')}
        </Button>
        <Button startIcon={<HistoryIcon />} onClick={() => setHistory(release)}>
          {t('Status history')}
        </Button>
      </Flex>
      <DetailFactGrid>
        {columns.map((column) => (
          <DetailFact key={column.key} label={column.label}>
            {column.render?.(release) ?? cellText((release as Record<string, unknown>)[column.key])}
          </DetailFact>
        ))}
      </DetailFactGrid>
      <Text component="h2" size="sm" weight="bold" sx={{ mt: 3, mb: 1 }}>
        {t('Release notes')}
      </Text>
      <Text size="sm" component="p" sx={{ whiteSpace: 'pre-wrap' }}>
        {release.releaseNotes || t('No release notes.')}
      </Text>
      <ReleaseHistoryDialog release={history} onClose={() => setHistory(null)} />
    </Box>
  );
}

/** AI → Meeting Assistant → Builds → one build: everything about it, and its download. */
export function ReleaseDetailsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useMaReleasesQuery({ fetchPolicy: 'cache-first' });
  const release = data?.maReleases.find((row) => row.id === id);

  let body;
  if (release) {
    body = <ReleaseDetails release={release} />;
  } else if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (loading) {
    body = <PanelSkeleton />;
  } else {
    body = (
      <Alert severity="warning">
        {t('This build no longer exists. It may have been deleted.')}
      </Alert>
    );
  }

  return (
    <CrudFormPage
      title="Build {version}"
      titleValues={{ version: release?.version ?? '' }}
      onBack={() => navigate(RELEASES_PATH)}
      backLabel="Back to Builds"
    >
      {body}
    </CrudFormPage>
  );
}
