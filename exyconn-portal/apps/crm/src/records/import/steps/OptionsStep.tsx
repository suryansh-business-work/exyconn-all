import { useT } from '@exyconn/i18n';
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import { CrmImportMode } from '@exyconn/shell/graphql/generated';

const MODES: readonly { mode: CrmImportMode; label: string }[] = [
  { mode: CrmImportMode.Upsert, label: 'Create new and update existing' },
  { mode: CrmImportMode.Create, label: 'Create new only' },
  { mode: CrmImportMode.Update, label: 'Update existing only' },
];

const MODE_VALUES = new Set<string>(MODES.map((entry) => entry.mode));

function isMode(value: string): value is CrmImportMode {
  return MODE_VALUES.has(value);
}

interface OptionsStepProps {
  mode: CrmImportMode;
  /** The label of the property records are matched by: Email, or Domain for companies. */
  matchLabel: string;
  onModeChange: (mode: CrmImportMode) => void;
}

/** Step 3: what to do with rows that match an existing record. */
export function OptionsStep({ mode, matchLabel, onModeChange }: Readonly<OptionsStepProps>) {
  const t = useT();
  return (
    <Stack spacing={2}>
      <FormControl>
        <Text id="crm-import-mode-label" weight="semibold">
          {t('What should the import do?')}
        </Text>
        <RadioGroup
          aria-labelledby="crm-import-mode-label"
          value={mode}
          onChange={(event) => {
            if (isMode(event.target.value)) {
              onModeChange(event.target.value);
            }
          }}
        >
          {MODES.map((entry) => (
            <FormControlLabel
              key={entry.mode}
              value={entry.mode}
              control={<Radio />}
              label={t(entry.label)}
            />
          ))}
        </RadioGroup>
      </FormControl>
      <Text size="sm" color="text.secondary">
        {t(
          'Rows are matched to existing records by {property}. A blank cell never overwrites a value that is already saved.',
          { property: matchLabel },
        )}
      </Text>
    </Stack>
  );
}
