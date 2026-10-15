import { useT } from '@exyconn/i18n';
import { Alert, MenuItem, Stack, Text, TextField } from '@exyconn/shell/components/ui';
import type { CallingBotScenarioOptionsQuery } from '@exyconn/shell/graphql/generated';

type ScenarioOption = CallingBotScenarioOptionsQuery['callingBotScenarioOptions'][number];

/** The picker's value for "no example": the bot's own settings. */
const NONE = 'none';

interface ScenarioPickerProps {
  scenarios: readonly ScenarioOption[];
  selected: ScenarioOption | null;
  onSelect: (id: string) => void;
  failed: boolean;
}

/** Which business the bot plays on the next call: a clinic, a bank, a hotel… */
export function ScenarioPicker({
  scenarios,
  selected,
  onSelect,
  failed,
}: Readonly<ScenarioPickerProps>) {
  const t = useT();
  if (failed) {
    return (
      <Alert severity="warning">
        {t('The examples could not be loaded. You can still call the bot.')}
      </Alert>
    );
  }
  if (scenarios.length === 0) {
    return null;
  }
  return (
    <Stack spacing={1}>
      <TextField
        select
        fullWidth
        label={t('Pick a call to try')}
        value={selected?.id ?? NONE}
        onChange={(event) => onSelect(event.target.value === NONE ? '' : event.target.value)}
        helperText={t('The bot plays this business on your next call.')}
      >
        <MenuItem value={NONE}>{t('General assistant')}</MenuItem>
        {scenarios.map((scenario) => (
          <MenuItem key={scenario.id} value={scenario.id}>
            {scenario.title}
          </MenuItem>
        ))}
      </TextField>
      {selected && <Text color="text.secondary">{selected.description}</Text>}
    </Stack>
  );
}
