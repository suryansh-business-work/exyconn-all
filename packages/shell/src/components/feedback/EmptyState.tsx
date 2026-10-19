import type { ReactNode } from 'react';
import { useT, type Interpolations } from '@exyconn/i18n';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Box, Button, Typography, iconSize } from '@/components/ui';
import { CenteredState } from './CenteredState';

interface EmptyStateProps {
  /** The English source, translated here; a `{placeholder}` takes its value from `titleValues`. */
  title: string;
  titleValues?: Interpolations;
  /** What to do about it, when there is something to do. */
  description?: string;
  descriptionValues?: Interpolations;
  /** A way out: usually the same "Add …" the page header offers, within reach of the message. */
  actionLabel?: string;
  onAction?: () => void;
  /** Replaces the default tray icon. */
  icon?: ReactNode;
}

/** The empty state's icon bubble. */
const EMPTY_BUBBLE = 64;

/**
 * What a list shows when it has nothing in it.
 *
 * One component because an empty list was written eighty-six ways — a grey sentence here, a
 * bare "No records" there — and none of them offered the next step. This says what is
 * missing, why it might be, and where the button is.
 */
export function EmptyState({
  title,
  titleValues,
  description,
  descriptionValues,
  actionLabel,
  onAction,
  icon,
}: Readonly<EmptyStateProps>) {
  const t = useT();
  return (
    <CenteredState>
      <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
        {/* The icon in a soft round bubble of the quiet surface, as a stat tile's sits in its hue. */}
        <Box
          aria-hidden
          sx={{
            width: EMPTY_BUBBLE,
            height: EMPTY_BUBBLE,
            mx: 'auto',
            mb: 1.5,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: 'background.muted',
            color: 'text.secondary',
            '& svg': { fontSize: iconSize['3xl'] },
          }}
        >
          {icon ?? <InboxOutlinedIcon />}
        </Box>
        <Typography sx={{ fontWeight: 'medium' }}>{t(title, titleValues)}</Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t(description, descriptionValues)}
          </Typography>
        )}
        {actionLabel && onAction && (
          <Button variant="outlined" onClick={onAction} sx={{ mt: 2 }}>
            {t(actionLabel)}
          </Button>
        )}
      </Box>
    </CenteredState>
  );
}
