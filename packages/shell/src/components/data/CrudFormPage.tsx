import type { ReactNode } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@/components/ui';
import { usePageTitle } from '@/components/layout/usePageTitle';
import { readingPanel } from '../glass/glass';

interface CrudFormPageProps {
  title: string;
  /** Values for a {placeholder} in the prop above — see PageHeader's titleValues. */
  titleValues?: Interpolations;
  subtitle?: string;
  subtitleValues?: Interpolations;
  /** Returns to the list the form was opened from. */
  onBack: () => void;
  /** Names the list in the back link, e.g. "Back to {list}". */
  backLabel?: string;
  backLabelValues?: Interpolations;
  children: ReactNode;
}

/**
 * The full-page create/edit view. Creating and editing used to happen in a 440px
 * right-hand drawer; a record with a dozen fields never fitted, so the form now takes
 * the whole screen with the list one click behind it.
 */
export function CrudFormPage({
  title,
  titleValues,
  subtitle,
  subtitleValues,
  onBack,
  backLabel,
  backLabelValues,
  children,
}: Readonly<CrudFormPageProps>) {
  const t = useT();
  const heading = t(title, titleValues);
  usePageTitle(heading);
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
          {t(backLabel ?? 'Back', backLabelValues)}
        </Button>
      </Stack>
      {/* The form replaces the page, so its title is the page's one h1 (SC 1.3.1). */}
      <Typography variant="h4" component="h1">
        {heading}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t(subtitle, subtitleValues)}
        </Typography>
      )}
      <Box sx={[readingPanel, { mt: 2, maxWidth: 880 }]}>{children}</Box>
    </Box>
  );
}
