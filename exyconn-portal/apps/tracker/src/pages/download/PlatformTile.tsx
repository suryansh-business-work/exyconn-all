import {
  Box,
  Stack,
  Typography,
  borderWidth,
  iconSize,
  readableAccent,
  tint,
  transition,
} from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useT } from '@exyconn/i18n';
import type { PlatformConfig } from './download.config';

interface PlatformTileProps {
  platform: PlatformConfig;
  selected: boolean;
  detected: boolean;
  available: boolean;
  onSelect: () => void;
}

/** One selectable platform in the download picker. */
export function PlatformTile({
  platform,
  selected,
  detected,
  available,
  onSelect,
}: Readonly<PlatformTileProps>) {
  const t = useT();
  const Icon = platform.icon;
  const fileLine = available ? t(platform.fileLabel) : t('Not in this release');
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={(theme) => ({
        // The tile's own edge marks the selection, so it is held to 3:1 (SC 1.4.11).
        '--platform-accent': readableAccent(
          platform.accent,
          theme,
          'graphic',
          theme.palette.background.muted,
        ),
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        p: 1.5,
        borderRadius: 1.5,
        background: selected ? tint(platform.accent) : theme.palette.background.paper,
        border: `${borderWidth.hairline}px solid ${
          selected ? 'var(--platform-accent)' : theme.palette.divider
        }`,
        transition: transition.surface,
        '&:hover': { borderColor: 'var(--platform-accent)' },
      })}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
        }}
      >
        <Icon sx={{ color: 'var(--platform-accent)' }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle2" noWrap>
              {platform.label}
            </Typography>
            {detected && (
              <CheckCircleIcon sx={{ fontSize: iconSize.sm, color: 'var(--platform-accent)' }} />
            )}
          </Stack>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            {fileLine}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
