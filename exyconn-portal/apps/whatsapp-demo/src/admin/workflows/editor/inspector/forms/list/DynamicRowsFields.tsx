import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { MenuItem, TextField } from '@exyconn/shell/components/ui';
import { CountedField } from '../../fields/CountedField';
import { NumberField } from '../../fields/NumberField';
import { OPTION_ID_MAX } from '../../fields/next-id';

type DynamicKind = 'none' | 'days' | 'slots';

/** What a freshly chosen kind starts with — valid, so the form does not open in error. */
const STARTERS = {
  days: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
  slots: { kind: 'slots', dayVar: 'day', from: 9, to: 17, stepMin: 30, take: 8, var: 'slot' },
} as const;

const KIND_LABELS: Readonly<Record<DynamicKind, string>> = {
  none: 'No generated rows',
  days: 'The next few days',
  slots: 'Free time slots on a day',
};

function DaysFields() {
  return (
    <>
      <NumberField name="dynamic.count" label="How many days" hint="1 to 10" />
      <RhfSwitch name="dynamic.skipSundays" label="Skip Sundays" />
      <CountedField
        name="dynamic.var"
        label="Save the day as"
        max={OPTION_ID_MAX}
        hint="Also sets <name>Label, e.g. {{dayLabel}}"
      />
    </>
  );
}

function SlotsFields() {
  return (
    <>
      <CountedField
        name="dynamic.dayVar"
        label="Day variable"
        max={OPTION_ID_MAX}
        hint="Set by an earlier days list"
      />
      <NumberField name="dynamic.from" label="From hour" hint="0 to 23" />
      <NumberField name="dynamic.to" label="To hour" hint="1 to 24" />
      <NumberField name="dynamic.stepMin" label="Minutes between slots" />
      <NumberField name="dynamic.take" label="Slots to offer" hint="1 to 10" />
      <CountedField
        name="dynamic.var"
        label="Save the slot as"
        max={OPTION_ID_MAX}
        hint="Also sets <name>Label, e.g. {{slotLabel}}"
      />
    </>
  );
}

/**
 * Rows the chat generates while it runs (upcoming days, free slots). Their single "Any row"
 * output is wired like any other.
 */
export function DynamicRowsFields() {
  const t = useT();
  const { control } = useFormContext();
  const kind = (useWatch({ control, name: 'dynamic.kind' }) as DynamicKind | undefined) ?? 'none';

  return (
    <>
      <Controller
        name="dynamic"
        control={control}
        render={({ field }) => (
          <TextField
            select
            size="small"
            fullWidth
            label={t('Generated rows')}
            value={kind}
            onBlur={field.onBlur}
            onChange={(event) => {
              const next = event.target.value as DynamicKind;
              field.onChange(next === 'none' ? undefined : { ...STARTERS[next] });
            }}
          >
            {(Object.keys(KIND_LABELS) as DynamicKind[]).map((key) => (
              <MenuItem key={key} value={key}>
                {t(KIND_LABELS[key])}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {kind === 'days' && <DaysFields />}
      {kind === 'slots' && <SlotsFields />}
    </>
  );
}
