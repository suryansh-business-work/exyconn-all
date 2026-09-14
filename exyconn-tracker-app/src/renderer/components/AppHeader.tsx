import type { ReactElement } from 'react';
import { ButtonBase, Box, Stack, Tooltip, Typography } from '@exyconn/ui';
import type { AuthUser, Branding, ThemeMode, TrackerStatus } from '@shared/types';
import { initials } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { roundButton } from '../round-button';
import BrandMark from './BrandMark';
import ThemeToggleButton from './ThemeToggleButton';
import TrackingPulse from './TrackingPulse';
import WindowControls from './WindowControls';
import { DRAG } from '../window-drag';

interface Props {
  branding: Branding | null;
  title: string;
  /** Drives the recording indicator — visible on every page, not just the dashboard. */
  status: TrackerStatus;
  user: AuthUser | null;
  themeMode: ThemeMode;
  /** The avatar opens Settings, where the account and signing out live. */
  onOpenAccount: () => void;
}

/**
 * The top of every page: a strip with the brand, the recording indicator and the window's own
 * buttons (the window is frameless, so this strip drags it), then the page's big title with
 * the theme switch and the signed-in employee beside it.
 */
export default function AppHeader({
  branding,
  title,
  status,
  user,
  themeMode,
  onOpenAccount,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const name = user?.name ?? t('Signed in');
  return (
    <Box component="header" sx={{ px: 2.5, pt: 1, pb: 1.5, flexShrink: 0, ...DRAG }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: 32 }}>
        <Box sx={{ display: 'flex', flex: '1 1 auto', minWidth: 0 }}>
          <BrandMark branding={branding} height={18} />
        </Box>
        <TrackingPulse status={status} />
        <WindowControls />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
        {/* Wraps rather than truncating: at 200% zoom a clipped title loses the page name. */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere' }}
        >
          {title}
        </Typography>
        <ThemeToggleButton mode={themeMode} round />
        <Tooltip title={t('{name} — account and settings', { name })}>
          <ButtonBase
            aria-label={t('{name}, open settings', { name })}
            onClick={onOpenAccount}
            sx={(theme) => ({
              ...roundButton(theme),
              fontWeight: 700,
              color: theme.palette.primary.contrastText,
              backgroundColor: theme.palette.primary.main,
            })}
          >
            {initials(name)}
          </ButtonBase>
        </Tooltip>
      </Stack>
    </Box>
  );
}
