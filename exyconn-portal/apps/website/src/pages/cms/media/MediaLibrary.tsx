import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Flex,
  LinearProgress,
  Pagination,
  TextField,
} from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { AssetAltForm } from '../../website/forms/cms-asset-alt';
import { MediaAssetCard } from './MediaAssetCard';
import { MediaUploadButton } from './MediaUploadButton';
import { useMediaAssets, type MediaAsset } from './useMediaAssets';
import { useMediaActions } from './useMediaActions';

interface MediaLibraryProps {
  siteId: string;
  /** Picker mode: clicking a file chooses it (and an upload chooses the first new file). */
  onPick?: (url: string) => void;
}

/** A site's media library: search, upload, and either manage the files or pick one. */
export function MediaLibrary({ siteId, onPick }: Readonly<MediaLibraryProps>) {
  const t = useT();
  const media = useMediaAssets(siteId);
  const notify = useNotify();
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const actions = useMediaActions(() => media.refetch(), setEditing);

  const onUploaded = (urls: string[]) => {
    media
      .refetch()
      .catch((error: unknown) =>
        notify(errorMessage(error, 'Could not reload the media'), 'error'),
      );
    if (onPick && urls[0]) onPick(urls[0]);
  };

  return (
    <Box>
      <Flex gap={1.5} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label={t('Search media')}
          value={media.search}
          onChange={(event) => media.setSearch(event.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <MediaUploadButton siteId={siteId} onUploaded={onUploaded} />
      </Flex>
      {media.loading && <LinearProgress sx={{ mb: 1 }} aria-label={t('Loading media')} />}
      {media.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('Could not load the media: {reason}', { reason: media.error.message })}
        </Alert>
      )}
      {!media.loading && media.rows.length === 0 && (
        <EmptyState
          title="No files yet"
          description="Upload images or PDFs to use them on the site."
        />
      )}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        {media.rows.map((asset) => (
          <MediaAssetCard
            key={asset.id}
            asset={asset}
            onPick={onPick ? (picked) => onPick(picked.url) : undefined}
            actions={onPick ? undefined : actions}
          />
        ))}
      </Box>
      {media.pageCount > 1 && (
        <Flex justifyContent="center" sx={{ mt: 2 }}>
          <Pagination
            count={media.pageCount}
            page={media.page + 1}
            onChange={(_event, value) => media.setPage(value - 1)}
          />
        </Flex>
      )}
      <AssetAltForm asset={editing} onClose={() => setEditing(null)} />
    </Box>
  );
}
