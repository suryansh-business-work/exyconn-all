import type { ReactElement } from 'react';
import { ToggleButton, ToggleButtonGroup, Stack, Typography } from '@exyconn/ui';
import BrightnessAutoOutlined from '@mui/icons-material/BrightnessAutoOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ThemeMode } from '@shared/types';
import { run } from '../run';

interface Option {
  value: ThemeMode;
  label: string;
  icon: SvgIconComponent;
}

const OPTIONS: readonly Option[] = [
  { value: 'system', label: 'System', icon: BrightnessAutoOutlined },
  { value: 'light', label: 'Light', icon: LightModeOutlined },
  { value: 'dark', label: 'Dark', icon: DarkModeOutlined },
];

interface Props {
  mode: ThemeMode;
}

/**
 * Light, dark, or follow the OS.
 *
 * `System` is the default and stays first: a tracker that sits open all day should match the
 * desk it is sitting on without being asked. The other two are for when it should not.
 */
export default function ThemeModePicker({ mode }: Readonly<Props>): ReactElement {
  return (
    <Stack spacing={1}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        // `next` is null when the active button is pressed again; keeping the current mode
        // means the group can never end up with nothing selected.
        onChange={(_event, next: ThemeMode | null) =>
          run(() => window.tracker.setPreferences({ themeMode: next ?? mode }))
        }
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <ToggleButton key={option.value} value={option.value} sx={{ gap: 0.75 }}>
              <Icon fontSize="small" />
              {option.label}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary">
        {mode === 'system'
          ? 'Following your operating system, and switching with it.'
          : 'Fixed to your choice, whatever the operating system does.'}
      </Typography>
    </Stack>
  );
}
