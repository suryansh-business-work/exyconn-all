import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useT } from '@exyconn/i18n';
import { Box, Button, Divider, Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';

interface QuickViewToolbarProps {
  /** The record's own page. */
  fullViewTo: string;
  /** The record's Edit control, once the record has loaded. */
  edit?: ReactNode;
  onClose: () => void;
}

/**
 * The quick view's top row: open the full page and edit on the left, close on the right — all
 * small controls on one centred line, with a divider under it. It stays put while the panel
 * scrolls, so Close is always in reach.
 */
export function QuickViewToolbar({ fullViewTo, edit, onClose }: Readonly<QuickViewToolbarProps>) {
  const t = useT();
  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper' }}>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          component={RouterLink}
          to={fullViewTo}
          startIcon={<OpenInFullIcon />}
        >
          {t('Full view')}
        </Button>
        {edit}
        <Tooltip title={t('Close')}>
          <IconButton size="small" onClick={onClose} aria-label={t('Close')} sx={{ ml: 'auto' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
      <Divider />
    </Box>
  );
}
