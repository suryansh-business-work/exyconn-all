import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import type { Tile } from '../tiles';

interface Props {
  tile: Tile | null;
  onClose: () => void;
}

/**
 * What one dashboard number actually means.
 *
 * A figure on a monitoring dashboard is half a fact on its own: the other half is the rule
 * that produced it. Every tile here says both — the unabbreviated number, the figures around
 * it, and the rule or the privacy promise behind it — so nothing on this screen has to be
 * taken on trust.
 */
export default function TileDetailDialog({ tile, onClose }: Readonly<Props>): JSX.Element | null {
  if (tile === null) {
    return null;
  }

  const Icon = tile.icon;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth aria-label={`${tile.label} detail`}>
      <DialogContent>
        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Icon fontSize="small" sx={{ color: 'primary.main', mt: 0.4 }} />
          <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700 }}>
            {tile.label}
          </Typography>
          <IconButton size="small" aria-label="Close" onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="h5" sx={{ mb: 1.5 }}>
          {tile.detail.headline}
        </Typography>

        <Divider />

        <Stack spacing={1} sx={{ my: 1.5 }}>
          {tile.detail.facts.map((fact) => (
            <Stack key={fact.id} direction="row" spacing={1.5} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {fact.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                {fact.value}
              </Typography>
            </Stack>
          ))}
        </Stack>

        <Alert severity="info" variant="outlined" sx={{ borderRadius: '4px' }}>
          {tile.detail.note}
        </Alert>
      </DialogContent>
    </Dialog>
  );
}
