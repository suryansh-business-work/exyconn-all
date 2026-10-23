import type { ReactNode } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import { Drawer, Flex, IconButton, Typography } from '@exyconn/shell/components/ui';

interface FiltersDrawerProps {
  open: boolean;
  /** The panel's heading, e.g. "Filter emails". */
  title: string;
  onClose: () => void;
  /** The filter form; mounted only while open, so it starts from the applied filters. */
  children: ReactNode;
}

const TITLE_ID = 'mail-filters-title';

/** An email list's filters in a side panel, opened from its filter icon. */
export function FiltersDrawer({ open, title, onClose, children }: Readonly<FiltersDrawerProps>) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          'aria-labelledby': TITLE_ID,
          sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100%' },
        },
      }}
    >
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" component="h2" id={TITLE_ID}>
          {t(title)}
        </Typography>
        <IconButton onClick={onClose} aria-label={t('Close')} edge="end">
          <CloseIcon />
        </IconButton>
      </Flex>
      {open && (
        <Flex direction="column" sx={{ p: 2 }}>
          {children}
        </Flex>
      )}
    </Drawer>
  );
}
