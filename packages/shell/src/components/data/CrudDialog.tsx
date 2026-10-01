import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Drawer, IconButton, Stack, Typography } from '@/components/ui';
import CloseIcon from '@mui/icons-material/Close';

interface CrudDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Right-anchored MUI drawer that hosts a module's create/edit form. */
export function CrudDialog({ open, title, onClose, children }: CrudDialogProps) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100%' } },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* The one heading of the panel: styled h6, but an h2 under the page's h1. */}
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label={t('Close')} edge="end">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>{children}</Box>
    </Drawer>
  );
}
