import type { ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@/components/ui';
import AddIcon from '@mui/icons-material/Add';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** Consistent page title row with an optional primary action. */
export function PageHeader({ title, subtitle, actionLabel, onAction, children }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
      {actionLabel && onAction && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
