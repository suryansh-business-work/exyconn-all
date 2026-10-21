import { useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useT } from '@exyconn/i18n';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Alert, Box, Button, Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  SuppressionReason,
  useAddMarketingSuppressionsMutation,
} from '@exyconn/shell/graphql/generated';
import { REASON_OPTIONS } from '../suppression';
import {
  bulkSuppressionSchema,
  extractAddresses,
  MAX_BULK,
  type BulkSuppressionValues,
} from './bulk-suppression.types';

interface BulkSuppressionFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Suppresses many addresses at once, pasted or read from a CSV. The preview counts what will
 * be sent before anything is; addresses already listed are reported, never rewritten.
 */
export function BulkSuppressionForm({ onDone, onCancel }: Readonly<BulkSuppressionFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [addSuppressions] = useAddMarketingSuppressionsMutation();
  const [fromFile, setFromFile] = useState(false);
  const methods = useForm<BulkSuppressionValues>({
    mode: 'onTouched',
    resolver: zodResolver(bulkSuppressionSchema),
    defaultValues: { addresses: '', reason: SuppressionReason.Manual, note: '' },
  });
  const addresses = useWatch({ control: methods.control, name: 'addresses' });
  const parsed = extractAddresses(addresses);

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    methods.setValue('addresses', await file.text(), { shouldValidate: true });
    setFromFile(true);
  };

  const submit = async (values: BulkSuppressionValues) => {
    if (parsed.valid.length === 0 || parsed.valid.length > MAX_BULK) {
      methods.setError('addresses', {
        message: t('Add between 1 and {max} valid addresses', { max: MAX_BULK }),
      });
      return;
    }
    try {
      const res = await addSuppressions({
        variables: {
          input: { emails: parsed.valid, reason: values.reason, note: values.note, fromFile },
        },
      });
      const outcome = res.data?.addMarketingSuppressions;
      notify('{added} added, {already} already suppressed, {invalid} invalid', 'success', {
        added: outcome?.added.length ?? 0,
        already: outcome?.alreadySuppressed.length ?? 0,
        invalid: outcome?.invalid.length ?? 0,
      });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The addresses could not be added'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Suppress addresses"
    >
      <Box>
        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
          {t('Choose a CSV file')}
          <input hidden type="file" accept=".csv,text/csv,text/plain" onChange={readFile} />
        </Button>
        <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {t('Any column holding email addresses is read; other columns are ignored.')}
        </Text>
      </Box>
      <RhfTextField
        name="addresses"
        label="Addresses"
        multiline
        rows={6}
        helperText="Or paste addresses, one per line or separated by commas."
      />
      <Alert severity={parsed.invalid.length ? 'warning' : 'info'} role="status">
        {t('{valid} valid unique address(es), {invalid} invalid, {repeated} repeated.', {
          valid: parsed.valid.length,
          invalid: parsed.invalid.length,
          repeated: parsed.repeated,
        })}
      </Alert>
      <RhfSelect
        name="reason"
        label="Reason"
        options={REASON_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) }))}
        helperText="Applied to every new address. Addresses already listed keep their reason."
      />
      <RhfTextField
        name="note"
        label="Internal note"
        multiline
        rows={2}
        helperText="Optional context for the record."
      />
    </EntityForm>
  );
}
