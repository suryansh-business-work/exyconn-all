import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Autocomplete, MenuItem, TextField } from '@/components/ui';
import { LEGAL_KIND_LABELS } from '@/components/legal';
import { itemKey, type AssignLegalFormValues, type LegalAssignableRow } from './assign-legal.types';

interface Props {
  /** What can still be handed over: everything the person does not already hold. */
  options: readonly LegalAssignableRow[];
}

/** "Contracts · Part Time Employee Contracts": the heading an option is listed under. */
function headingOf(row: LegalAssignableRow, t: (source: string) => string): string {
  const kind = t(LEGAL_KIND_LABELS[row.kind].many);
  return row.groupName ? `${kind} · ${row.groupName}` : kind;
}

/** Group headings, each with the keys of its members, for "add a whole group". */
function groupsOf(options: readonly LegalAssignableRow[]) {
  const groups = new Map<string, { label: string; keys: string[] }>();
  for (const row of options) {
    if (!row.groupId || !row.groupName) {
      continue;
    }
    const group = groups.get(row.groupId) ?? { label: row.groupName, keys: [] };
    group.keys.push(itemKey(row));
    groups.set(row.groupId, group);
  }
  return [...groups.entries()].map(([id, group]) => ({ id, ...group }));
}

/**
 * The items to hand over, searchable and listed under their register and group, with a
 * shortcut that adds every member of a group at once.
 */
export function AssignableItemsField({ options }: Readonly<Props>) {
  const t = useT();
  const { control, getValues, setValue } = useFormContext<AssignLegalFormValues>();
  const sorted = useMemo(
    () => [...options].sort((a, b) => headingOf(a, t).localeCompare(headingOf(b, t))),
    [options, t],
  );
  const groups = useMemo(() => groupsOf(sorted), [sorted]);

  // A group's menu value is its members' keys, space-separated (a key holds no space).
  const addGroup = (members: string) => {
    const merged = new Set([...getValues('items'), ...members.split(' ')]);
    setValue('items', [...merged], { shouldDirty: true, shouldValidate: true });
  };

  return (
    <>
      {groups.length > 0 && (
        <TextField
          select
          fullWidth
          label={t('Add a whole group')}
          value=""
          onChange={(event) => addGroup(event.target.value)}
          helperText={t('Adds every item in the group to the list below.')}
        >
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.keys.join(' ')}>
              {t('{group} ({count} items)', { group: group.label, count: group.keys.length })}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Controller
        name="items"
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            multiple
            options={sorted}
            groupBy={(row) => headingOf(row, t)}
            getOptionLabel={(row) => row.title}
            isOptionEqualToValue={(a, b) => itemKey(a) === itemKey(b)}
            value={sorted.filter((row) => field.value.includes(itemKey(row)))}
            onChange={(_event, rows) => field.onChange(rows.map(itemKey))}
            onBlur={field.onBlur}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                name={field.name}
                label={t('Contracts, policies and documents')}
                error={Boolean(fieldState.error)}
                helperText={t(
                  fieldState.error?.message ??
                    'Search by title. Items the employee already holds are not listed.',
                )}
              />
            )}
          />
        )}
      />
    </>
  );
}
