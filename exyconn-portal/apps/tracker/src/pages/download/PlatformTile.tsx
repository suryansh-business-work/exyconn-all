import { Box, Stack, Typography } from '@exyconn/shell/components/ui';
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
        background: selected ? `${platform.accent}14` : theme.palette.background.paper,
        border: `1px solid ${selected ? platform.accent : theme.palette.divider}`,
        transition: 'border-color .15s, background .15s',
        '&:hover': { borderColor: platform.accent },
      })}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Icon sx={{ color: platform.accent }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="subtitle2" noWrap>
              {platform.label}
            </Typography>
            {detected && <CheckCircleIcon sx={{ fontSize: 14, color: platform.accent }} />}
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {available ? platform.fileLabel : 'Not in this release'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
