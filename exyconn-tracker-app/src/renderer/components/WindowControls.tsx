import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import CropSquareRounded from '@mui/icons-material/CropSquareRounded';
import FilterNoneRounded from '@mui/icons-material/FilterNoneRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { run } from '../run';
import { NO_DRAG } from '../window-drag';

const BUTTON_SX = {
  ...NO_DRAG,
  borderRadius: '4px',
  width: 30,
  height: 26,
  color: 'text.secondary',
  '&:hover': { color: 'text.primary' },
} as const;

/**
 * The app's own minimise / maximise / close, because the window is frameless: the tracker
 * draws its whole chrome, so these belong to it rather than to a strip of OS decoration.
 *
 * Each acts on the window it is rendered in — the tracker window and the screenshot gallery
 * share this bar, and main routes every command back to the sender.
 */
export default function WindowControls(): JSX.Element {
  const [maximized, setMaximized] = useState(false);

  // Main is the authority: the window can also be maximised by a double-click on the title
  // bar or an OS snap gesture, and the icon has to follow those too.
  useEffect(() => window.tracker.onWindowMaximized(setMaximized), []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ...NO_DRAG }}>
      <IconButton
        size="small"
        aria-label="Minimise"
        sx={BUTTON_SX}
        onClick={() => run(() => window.tracker.minimizeWindow())}
      >
        <RemoveRounded sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        aria-label={maximized ? 'Restore' : 'Maximise'}
        sx={BUTTON_SX}
        onClick={() => run(() => window.tracker.toggleMaximizeWindow())}
      >
        {maximized ? (
          <FilterNoneRounded sx={{ fontSize: 13 }} />
        ) : (
          <CropSquareRounded sx={{ fontSize: 15 }} />
        )}
      </IconButton>
      <IconButton
        size="small"
        aria-label="Close"
        sx={{
          ...BUTTON_SX,
          '&:hover': { backgroundColor: 'error.main', color: 'error.contrastText' },
        }}
        onClick={() => run(() => window.tracker.closeWindow())}
      >
        <CloseRounded sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
