import { useT } from '@exyconn/i18n';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { ImportModeOption } from '../import.types';

interface OptionsStepProps<Mode extends string> {
  mode: Mode;
  modes: readonly ImportModeOption<Mode>[];
  /** The label of the field records are matched by; null when rows are only ever created. */
  matchLabel: string | null;
  onModeChange: (mode: Mode) => void;
}

/** Step 3: what to do with rows that match an existing record. */
export function OptionsStep<Mode extends string>({
  mode,
  modes,
  matchLabel,
  onModeChange,
}: Readonly<OptionsStepProps<Mode>>) {
  const t = useT();
  return (
    <Stack spacing={2}>
      <FormControl>
        <Text id="import-mode-label" weight="semibold">
          {t('What should the import do?')}
        </Text>
        <RadioGroup
          aria-labelledby="import-mode-label"
          value={mode}
          onChange={(event) => {
            const chosen = modes.find((entry) => entry.mode === event.target.value);
            if (chosen) {
              onModeChange(chosen.mode);
            }
          }}
        >
          {modes.map((entry) => (
            <FormControlLabel
              key={entry.mode}
              value={entry.mode}
              control={<Radio />}
              label={t(entry.label)}
            />
          ))}
        </RadioGroup>
      </FormControl>
      {matchLabel && (
        <Text size="sm" color="text.secondary">
          {t(
            'Rows are matched to existing records by {property}. A blank cell never overwrites a value that is already saved.',
            { property: matchLabel },
          )}
        </Text>
      )}
    </Stack>
  );
}
