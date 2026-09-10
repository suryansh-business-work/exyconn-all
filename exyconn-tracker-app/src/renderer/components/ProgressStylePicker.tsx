import type { ReactElement } from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@exyconn/ui';
import LinearScaleOutlined from '@mui/icons-material/LinearScaleOutlined';
import DonutLargeOutlined from '@mui/icons-material/DonutLargeOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ProgressStyle } from '@shared/types';
import { run } from '../run';

interface Option {
  value: ProgressStyle;
  label: string;
  icon: SvgIconComponent;
}

const OPTIONS: readonly Option[] = [
  { value: 'bar', label: 'Bar', icon: LinearScaleOutlined },
  { value: 'ring', label: 'Ring', icon: DonutLargeOutlined },
];

interface Props {
  style: ProgressStyle;
}

/**
 * Whether today's progress is a bar across the card or a ring around the figure.
 *
 * Both draw the same number from the same source. Which one is easier to read at a glance is
 * a fact about the person looking at it, so it is theirs to set rather than ours to decide.
 */
export default function ProgressStylePicker({ style }: Readonly<Props>): ReactElement {
  return (
    <Stack spacing={1}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={style}
        // `next` is null when the active button is pressed again; keeping the current style
        // means the group can never end up with nothing selected.
        onChange={(_event, next: ProgressStyle | null) =>
          run(() => window.tracker.setPreferences({ progressStyle: next ?? style }))
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
        {style === 'ring'
          ? 'Today’s progress is drawn as a ring, with the percentage inside it.'
          : 'Today’s progress is drawn as a bar, with what is left as a length.'}
      </Typography>
    </Stack>
  );
}
