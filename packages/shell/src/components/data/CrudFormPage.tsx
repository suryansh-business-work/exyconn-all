import type { ReactNode } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useT } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@/components/ui';
import { readingPanel } from '../glass/glass';

interface CrudFormPageProps {
  title: string;
  subtitle?: string;
  /** Returns to the list the form was opened from. */
  onBack: () => void;
  /** Names the list in the back link, e.g. "Back to leads". */
  backLabel?: string;
  children: ReactNode;
}

/**
 * The full-page create/edit view. Creating and editing used to happen in a 440px
 * right-hand drawer; a record with a dozen fields never fitted, so the form now takes
 * the whole screen with the list one click behind it.
 */
export function CrudFormPage({
  title,
  subtitle,
  onBack,
  backLabel,
  children,
}: Readonly<CrudFormPageProps>) {
  const t = useT();
  return (
    <Box>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Button onClick={onBack} startIcon={<ArrowBackIcon />} color="inherit" size="small">
          {t(backLabel ?? 'Back')}
        </Button>
      </Stack>
      <Typography variant="h4">{t(title)}</Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t(subtitle)}
        </Typography>
      )}
      <Box sx={[readingPanel, { mt: 2, maxWidth: 880 }]}>{children}</Box>
    </Box>
  );
}
