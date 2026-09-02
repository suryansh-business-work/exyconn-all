import type { ReactNode } from 'react';
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
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, maxWidth: '100%' } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} aria-label="Close" edge="end">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>{children}</Box>
    </Drawer>
  );
}
