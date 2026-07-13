import type { SvgIconComponent } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import GlassCard from './GlassCard';

interface Props {
  title: string;
  reason: string;
  icon: SvgIconComponent;
  busy: boolean;
  onGrant: () => void;
}

/** One missing macOS grant: what it is, why it is needed, and how to give it. */
export default function PermissionRow({
  title,
  reason,
  icon,
  busy,
  onGrant,
}: Readonly<Props>): JSX.Element {
  const Icon = icon;
  return (
    <GlassCard sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.75} alignItems="center">
        <Box
          sx={(theme) => ({
            display: 'grid',
            placeItems: 'center',
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '4px',
            backgroundColor: alpha(theme.palette.primary.main, 0.18),
            color: theme.palette.primary.main,
          })}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {reason}
          </Typography>
        </Box>
        <Button variant="contained" size="small" disabled={busy} onClick={onGrant}>
          Grant
        </Button>
      </Stack>
    </GlassCard>
  );
}
