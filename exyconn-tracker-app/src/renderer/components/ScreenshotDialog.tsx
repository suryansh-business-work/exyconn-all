import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import type { DayScreenshot } from '@shared/types';
import { formatTime } from '../format';

interface Props {
  /** The screenshot to show; `null` keeps the dialog closed. */
  shot: DayScreenshot | null;
  onClose: () => void;
}

/** The full-size view of one screenshot, with the time it was captured. */
export default function ScreenshotDialog({ shot, onClose }: Readonly<Props>): JSX.Element {
  const capturedAt = shot === null ? '' : formatTime(shot.capturedAt);

  return (
    <Dialog
      open={shot !== null}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: '4px' } }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Typography variant="subtitle1" component="span" fontWeight={700}>
          Captured at {capturedAt}
        </Typography>
        <IconButton size="small" aria-label="Close screenshot" onClick={onClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        {shot !== null ? (
          <Box
            component="img"
            src={shot.imageUrl}
            alt={`Screenshot captured at ${capturedAt}`}
            sx={{ width: '100%', display: 'block', borderRadius: '4px' }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
