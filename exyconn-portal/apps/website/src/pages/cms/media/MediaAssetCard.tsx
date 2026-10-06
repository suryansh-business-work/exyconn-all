import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { formatBytes } from '@exyconn/shell/utils/file';
import type { MediaAsset } from './useMediaAssets';

export interface MediaAssetActions {
  onCopy: (asset: MediaAsset) => void;
  onEditAlt: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
}

interface MediaAssetCardProps {
  asset: MediaAsset;
  /** Picker mode: the whole card chooses the asset. */
  onPick?: (asset: MediaAsset) => void;
  /** Library mode: copy, alt text and delete. */
  actions?: MediaAssetActions;
}

const THUMB_HEIGHT = 140;

function Thumbnail({ asset }: Readonly<{ asset: MediaAsset }>) {
  if (asset.mime === 'application/pdf') {
    return (
      <Flex alignItems="center" justifyContent="center" sx={{ height: THUMB_HEIGHT }}>
        <PictureAsPdfIcon fontSize="large" color="action" />
      </Flex>
    );
  }
  return (
    <Box
      component="img"
      src={asset.url}
      alt={asset.alt || asset.name}
      loading="lazy"
      sx={{ width: '100%', height: THUMB_HEIGHT, objectFit: 'cover', display: 'block' }}
    />
  );
}

function Details({ asset }: Readonly<{ asset: MediaAsset }>) {
  const dimensions = asset.width > 0 ? ` · ${asset.width}×${asset.height}` : '';
  return (
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Text size="sm" weight="semibold" noWrap component="div" title={asset.name}>
        {asset.name}
      </Text>
      <Text size="caption" color="text.secondary" component="div">
        {formatBytes(asset.size)}
        {dimensions}
      </Text>
    </CardContent>
  );
}

/** One file of a site's media library: a thumbnail, its size, and what can be done with it. */
export function MediaAssetCard({ asset, onPick, actions }: Readonly<MediaAssetCardProps>) {
  const t = useT();
  if (onPick) {
    return (
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <CardActionArea
          onClick={() => onPick(asset)}
          aria-label={t('Use {name}', { name: asset.name })}
        >
          <Thumbnail asset={asset} />
          <Details asset={asset} />
        </CardActionArea>
      </Card>
    );
  }
  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Thumbnail asset={asset} />
      <Details asset={asset} />
      {actions && (
        <Flex justifyContent="flex-end" sx={{ px: 1, pb: 1 }}>
          <Tooltip title={t('Copy URL')}>
            <IconButton
              size="small"
              aria-label={t('Copy URL')}
              onClick={() => actions.onCopy(asset)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Edit alt text')}>
            <IconButton
              size="small"
              aria-label={t('Edit alt text')}
              onClick={() => actions.onEditAlt(asset)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Delete')}>
            <IconButton
              size="small"
              color="error"
              aria-label={t('Delete {name}', { name: asset.name })}
              onClick={() => actions.onDelete(asset)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Flex>
      )}
    </Card>
  );
}
