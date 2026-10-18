import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useT } from '@exyconn/i18n';
import { Button, Flex, IconButton, Tooltip } from '@exyconn/shell/components/ui';

interface QuickViewToolbarProps {
  /** The record's own page. */
  fullViewTo: string;
  /** The record's Edit control, once the record has loaded. */
  edit?: ReactNode;
  onClose: () => void;
}

/** The quick view's top row: open the full page, edit, close. */
export function QuickViewToolbar({ fullViewTo, edit, onClose }: Readonly<QuickViewToolbarProps>) {
  const t = useT();
  return (
    <Flex
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
    >
      <Button
        size="small"
        variant="contained"
        component={RouterLink}
        to={fullViewTo}
        startIcon={<OpenInFullIcon />}
      >
        {t('Full view')}
      </Button>
      {edit}
      <Tooltip title={t('Close')}>
        <IconButton onClick={onClose} aria-label={t('Close')} edge="end" sx={{ ml: 'auto' }}>
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}
