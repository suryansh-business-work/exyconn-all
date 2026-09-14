import type { ReactNode } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Box, Button, Stack, Typography } from '@/components/ui';
import AddIcon from '@mui/icons-material/Add';

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
  onAction,
  children,
}: PageHeaderProps) {
  // Titles arrive as English props from ~sixty screens. Translating them here means no page
  // has to remember to, and none of them can be the one that forgot.
  const t = useT();
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
        <Typography variant="h4">{t(title, titleValues)}</Typography>
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
          {t(actionLabel)}
        </Button>
      )}
    </Stack>
  );
}
