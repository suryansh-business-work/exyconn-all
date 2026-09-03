import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import BrightnessAutoOutlined from '@mui/icons-material/BrightnessAutoOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ThemeMode } from '@shared/types';
import { run } from '../run';
import { NO_DRAG } from '../window-drag';

interface Step {
  /** Where a click moves to — the three modes cycle, so no mode is ever unreachable. */
  next: ThemeMode;
  label: string;
  icon: SvgIconComponent;
}

const STEPS: Readonly<Record<ThemeMode, Step>> = {
  system: { next: 'light', label: 'Matching your system', icon: BrightnessAutoOutlined },
  light: { next: 'dark', label: 'Light', icon: LightModeOutlined },
  dark: { next: 'system', label: 'Dark', icon: DarkModeOutlined },
};

interface Props {
  mode: ThemeMode;
}

/**
 * The light/dark switch for bars that have no room for the settings screen's full picker —
 * one button that cycles system → light → dark. It writes the same install preference, so a
 * choice made here is the choice the whole app (and the next launch) uses.
 */
export default function ThemeToggleButton({ mode }: Readonly<Props>): JSX.Element {
  const step = STEPS[mode];
  const Icon = step.icon;
  const hint = `Theme: ${step.label}. Switch to ${STEPS[step.next].label.toLowerCase()}.`;

  return (
    <Tooltip title={hint}>
      <IconButton
        size="small"
        aria-label={hint}
        sx={{
          ...NO_DRAG,
          borderRadius: '4px',
          width: 30,
          height: 26,
          color: 'text.secondary',
          '&:hover': { color: 'text.primary' },
        }}
        onClick={() => run(() => window.tracker.setPreferences({ themeMode: step.next }))}
      >
        <Icon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}
