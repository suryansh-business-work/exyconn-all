import { useState, type ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import { useT } from '@exyconn/i18n';
import { ListItemIcon, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';

/** The menu value of the "Create …" action; never stored. */
const CREATE = '__create__';

export interface CreatedRecord {
  id: string;
  name: string;
}

interface QuickCreateSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  /** "Create Company", "Create Contact" — the action at the top of the list. */
  createLabel: string;
  /** The create form for the side panel; it reports the new record, or that it was cancelled. */
  renderCreate: (done: (created: CreatedRecord) => void, cancel: () => void) => ReactNode;
  /** Re-reads the options, so the new record is in the list before it is picked. */
  onRefresh: () => Promise<unknown>;
  /** Told the new record, e.g. to store its name beside its id. */
  onCreated?: (created: CreatedRecord) => void;
  helperText?: string;
}

/**
 * A dropdown of companies or contacts with "Create …" at the top: it opens the create form in
 * the side panel, and the record made there is picked here once it is saved.
 */
export function QuickCreateSelect({
  name,
  label,
  options,
  createLabel,
  renderCreate,
  onRefresh,
  onCreated,
  helperText,
}: Readonly<QuickCreateSelectProps>) {
  const t = useT();
  const { control, setValue } = useFormContext();
  const [creating, setCreating] = useState(false);
  const close = () => setCreating(false);

  const done = (created: CreatedRecord) => {
    close();
    onRefresh()
      .then(() => {
        setValue(name, created.id, { shouldDirty: true, shouldValidate: true });
        onCreated?.(created);
      })
      .catch((error: unknown) =>
        portalLogger.warn('crm: refreshing the list after a quick create failed', error),
      );
  };

  return (
    <>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            onChange={(event) => {
              if (event.target.value === CREATE) {
                setCreating(true);
                return;
              }
              field.onChange(event);
            }}
            select
            fullWidth
            label={t(label)}
            error={Boolean(fieldState.error)}
            helperText={t(fieldState.error?.message ?? helperText ?? '')}
          >
            <MenuItem value={CREATE} divider sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              <ListItemIcon sx={{ color: 'inherit' }}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              {t(createLabel)}
            </MenuItem>
            <MenuItem value="">{t('None')}</MenuItem>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <CrudDialog open={creating} title={t(createLabel)} onClose={close}>
        {creating && renderCreate(done, close)}
      </CrudDialog>
    </>
  );
}
