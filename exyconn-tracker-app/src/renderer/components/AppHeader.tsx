import type { ReactElement } from 'react';
import { ButtonBase, Box, Stack, Tooltip, Typography } from '@exyconn/ui';
import type { AuthUser, Branding, ThemeMode, TrackerStatus } from '@shared/types';
import { initials } from '@exyconn/tracker-core';
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
  const name = user?.name ?? 'Signed in';
  return (
    <Box sx={{ px: 2.5, pt: 1, pb: 1.5, flexShrink: 0, ...DRAG }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minHeight: 32 }}>
        <Box sx={{ display: 'flex', flex: '1 1 auto', minWidth: 0 }}>
          <BrandMark branding={branding} height={18} />
        </Box>
        <TrackingPulse status={status} />
        <WindowControls />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
        <Typography variant="h4" component="h1" noWrap sx={{ flex: '1 1 auto', minWidth: 0 }}>
          {title}
        </Typography>
        <ThemeToggleButton mode={themeMode} round />
        <Tooltip title={`${name} — account and settings`}>
          <ButtonBase
            aria-label={`${name}, open settings`}
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
