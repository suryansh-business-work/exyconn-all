import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EMAIL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Alert, TextField } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useDebouncedValue } from '@exyconn/shell/hooks/useDebouncedValue';
import {
  useCreateMarketingSuppressionMutation,
  useMarketingSuppressionLookupQuery,
} from '@exyconn/shell/graphql/generated';
import { SuppressionLookupPanel } from './SuppressionLookupPanel';
import {
  EMPTY_SUPPRESSION,
  MAX_NOTE,
  REASON_OPTIONS,
  suppressionSchema,
  type SuppressionFormValues,
} from './suppression.types';

const LOOKUP_DELAY_MS = 350;

interface SuppressionFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Adds one address to the suppression list by hand. The source is the action itself (Admin),
 * never a choice, so the list cannot claim an event that did not happen.
 */
export function SuppressionForm({ onDone, onCancel }: Readonly<SuppressionFormProps>) {
  const t = useT();
  const [createSuppression] = useCreateMarketingSuppressionMutation();
  const methods = useForm<SuppressionFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(suppressionSchema),
    defaultValues: EMPTY_SUPPRESSION,
  });
  const [email, reason, note] = useWatch({
    control: methods.control,
    name: ['email', 'reason', 'note'],
  });
  const typed = useDebouncedValue(email.trim().toLowerCase(), LOOKUP_DELAY_MS);
  const lookupReady = EMAIL.test(typed);
  const { data, loading } = useMarketingSuppressionLookupQuery({
    variables: { email: typed },
    skip: !lookupReady,
    fetchPolicy: 'network-only',
  });
  const lookup = lookupReady ? (data?.marketingSuppressionLookup ?? null) : null;
  const reasonHint = REASON_OPTIONS.find((option) => option.value === reason)?.hint;

  const notify = useNotify();
  // EntityForm disables the submit while this runs, so a double click is one request.
  const submit = async (values: SuppressionFormValues) => {
    if (lookup?.existing) {
      methods.setError('email', { message: 'This address is already on the suppression list' });
      return;
    }
    try {
      await createSuppression({ variables: { input: values } });
      notify('{email} added to the suppression list', 'success', {
        email: values.email.toLowerCase(),
      });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The address could not be added'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Add address"
    >
      <Alert severity="info">
        {t(
          'This address will be excluded from all marketing campaigns, newsletters and automated marketing emails from your organization. Transactional emails such as sign-in codes and invoices are not affected.',
        )}
      </Alert>
      <RhfTextField
        name="email"
        label="Email address"
        type="email"
        required
        autoComplete="off"
        placeholder="name@example.com"
        helperText="Enter a valid email address. No marketing campaign will be sent to it."
      />
      <SuppressionLookupPanel lookup={lookup} loading={lookupReady && loading} />
      <RhfSelect
        name="reason"
        label="Reason"
        options={REASON_OPTIONS.map((option) => ({ value: option.value, label: t(option.label) }))}
        helperText={reasonHint ?? 'Why this address is being suppressed.'}
      />
      <TextField
        label={t('Source')}
        value={t('Admin')}
        disabled
        fullWidth
        helperText={t('Set automatically from how the address was added, for the record.')}
      />
      <TextField
        label={t('Scope')}
        value={t('Organization-wide marketing')}
        disabled
        fullWidth
        helperText={t('Applies to every marketing campaign your organization sends.')}
      />
      <RhfTextField
        name="note"
        label="Internal note"
        multiline
        rows={3}
        slotProps={{ htmlInput: { maxLength: MAX_NOTE } }}
        helperText={t('Optional context, e.g. a user request or an abuse report. {used}/{max}', {
          used: note.length,
          max: MAX_NOTE,
        })}
      />
      <RhfSwitch name="archived" label="Archive this address" />
      <Alert severity="info" variant="outlined">
        {t('Archived addresses are hidden from the main list but remain suppressed.')}
      </Alert>
    </EntityForm>
  );
}
