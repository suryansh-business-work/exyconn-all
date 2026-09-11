import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Slider, Stack, Switch, Typography } from '@exyconn/ui';
import type { AppPreferences } from '@shared/types';
import { run } from '../run';

interface Props {
  preferences: AppPreferences;
}

const MIN_OPACITY = 30;
const MAX_OPACITY = 95;

function save(update: Partial<AppPreferences>): void {
  run(() => window.tracker.setPreferences(update));
}

/**
 * A see-through window: the desktop shows, blurred, through the page's ground while the cards
 * stay solid. The slider sets how much of the ground stays painted. Hidden on an OS that has no
 * window material to show through.
 */
export default function TransparencyPreference({
  preferences,
}: Readonly<Props>): ReactElement | null {
  // The slider moves freely; the preference is written once, when it is let go.
  const [opacity, setOpacity] = useState(Math.round(preferences.backgroundOpacity * 100));
  useEffect(() => {
    setOpacity(Math.round(preferences.backgroundOpacity * 100));
  }, [preferences.backgroundOpacity]);

  if (!window.tracker.transparencySupported) {
    return null;
  }
  const on = preferences.transparentBackground;

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Transparent background
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {on ? 'Your desktop shows through behind the cards.' : 'The window is painted solid.'}
          </Typography>
        </Stack>
        <Switch
          checked={on}
          onChange={(event) => save({ transparentBackground: event.target.checked })}
          slotProps={{ input: { 'aria-label': 'Transparent background' } }}
        />
      </Stack>
      {on ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 56 }}>
            Opacity
          </Typography>
          <Slider
            size="small"
            min={MIN_OPACITY}
            max={MAX_OPACITY}
            step={5}
            value={opacity}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            onChange={(_event, value) => setOpacity(value)}
            onChangeCommitted={(_event, value) => save({ backgroundOpacity: value / 100 })}
            aria-label="Background opacity"
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
