import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, CircularProgress } from '@/components/ui';

interface CenteredStateProps {
  children: ReactNode;
  /** Fills the space it is given — for a page whose body is a flex column. */
  fill?: boolean;
}

/**
 * Whatever a screen shows instead of its content: a spinner, an empty note, a refusal.
 *
 * One component because the breathing room around it is a decision, not a per-page taste —
 * it was written thirteen different ways, at 48px and 64px, and on a phone either one is a
 * tenth of the screen given to a spinner.
 */
export function CenteredState({ children, fill = false }: Readonly<CenteredStateProps>) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        py: { xs: 4, sm: 6 },
        ...(fill ? { flex: 1 } : {}),
      }}
    >
      {children}
    </Box>
  );
}

/**
 * The spinner a screen shows while it waits for its first answer.
 *
 * A live status region, so a screen reader hears "Loading" when it appears instead of a
 * page that has gone quiet; polite, so it never talks over what is being read.
 */
export function LoadingState({ label = 'Loading' }: Readonly<{ label?: string }>) {
  const t = useT();
  return (
    <CenteredState>
      <Box role="status" aria-live="polite">
        <CircularProgress aria-label={t(label)} />
      </Box>
    </CenteredState>
  );
}
