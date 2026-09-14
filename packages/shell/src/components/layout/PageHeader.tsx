import type { ReactNode } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { usePageTitle } from './usePageTitle';

interface PageHeaderProps {
  title: string;
  /**
   * Values for a title written with `{placeholders}`.
   *
   * A title built by hand — `` `Hello, ${firstName}` `` — would be a NEW catalogue key for
   * every person who opened the page, and each would be sent off for translation.
   */
  titleValues?: Interpolations;
  subtitle?: string;
  subtitleValues?: Interpolations;
  actionLabelValues?: Interpolations;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** Consistent page title row with an optional primary action. */
export function PageHeader({
  title,
  titleValues,
  subtitle,
  subtitleValues,
  actionLabel,
  actionLabelValues,
  onAction,
  children,
}: PageHeaderProps) {
  // Titles arrive as English props from ~sixty screens. Translating them here means no page
  // has to remember to, and none of them can be the one that forgot.
  const t = useT();
  const heading = t(title, titleValues);

  usePageTitle(heading);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 2,
      }}
    >
      <Box>
        {/* The page's one h1 (SC 1.3.1): styled as an h4, but the top of the outline. */}
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
      </Box>
      {children}
      {actionLabel && onAction && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAction}>
          {t(actionLabel, actionLabelValues)}
        </Button>
      )}
    </Stack>
  );
}
