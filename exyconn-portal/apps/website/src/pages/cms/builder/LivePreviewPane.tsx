import { useEffect, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useT } from '@exyconn/i18n';
import {
  Box,
  CircularProgress,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

interface LivePreviewPaneProps {
  /** Resolves the address of the saved draft on the website. */
  loadUrl: () => Promise<string>;
  /** Bumped after every save, so the pane shows what was just saved. */
  version: number;
}

/**
 * The saved draft as the website really renders it — every server-rendered section, the
 * header and footer, the design system — beside the canvas, refreshed after each save.
 */
export function LivePreviewPane({ loadUrl, version }: Readonly<LivePreviewPaneProps>) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let live = true;
    setError('');
    loadUrl()
      .then((next) => {
        if (live) setUrl(`${next}&v=${version}-${reloads}`);
      })
      .catch((reason: unknown) => {
        if (live) setError(errorMessage(reason, 'Could not load the preview'));
      });
    return () => {
      live = false;
    };
  }, [loadUrl, version, reloads]);

  return (
    <Flex
      direction="column"
      sx={{ height: '100%', borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      role="region"
      aria-label={t('Live preview')}
    >
      <Flex
        alignItems="center"
        gap={1}
        sx={{ px: 1.5, py: 0.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Text size="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {t('Live preview — the saved draft, as the website renders it')}
        </Text>
        <Tooltip title={t('Refresh')}>
          <IconButton
            aria-label={t('Refresh')}
            size="small"
            onClick={() => setReloads((n) => n + 1)}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
      <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
        {error && (
          <Text color="error" sx={{ p: 2 }}>
            {error}
          </Text>
        )}
        {!error && !url && (
          <Flex justifyContent="center" sx={{ p: 4 }}>
            <CircularProgress size={24} />
          </Flex>
        )}
        {!error && url && (
          <Box
            component="iframe"
            title={t('Live preview')}
            src={url}
            sx={{ border: 0, width: '100%', height: '100%', display: 'block' }}
          />
        )}
      </Box>
    </Flex>
  );
}
