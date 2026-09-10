import {
  Box,
  Stack,
  Typography,
  borderWidth,
  iconSize,
  tint,
  transition,
} from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const Icon = platform.icon;
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={(theme) => ({
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        p: 1.5,
        borderRadius: 1.5,
        background: selected ? tint(platform.accent) : theme.palette.background.paper,
        border: `${borderWidth.hairline}px solid ${
          selected ? platform.accent : theme.palette.divider
        }`,
        transition: transition.surface,
        '&:hover': { borderColor: platform.accent },
      })}
    >
      <Stack direction="row" spacing={1.25} sx={{
        alignItems: "center"
      }}>
        <Icon sx={{ color: platform.accent }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{
            alignItems: "center"
          }}>
            <Typography variant="subtitle2" noWrap>
              {platform.label}
            </Typography>
            {detected && <CheckCircleIcon sx={{ fontSize: iconSize.sm, color: platform.accent }} />}
          </Stack>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "text.secondary",
              display: "block"
            }}>
            {available ? platform.fileLabel : 'Not in this release'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
