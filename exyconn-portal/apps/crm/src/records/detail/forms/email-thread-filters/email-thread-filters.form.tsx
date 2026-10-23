import { useForm, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfDatePicker, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { Button } from '@exyconn/shell/components/ui';
import type { CrmEmailMailbox } from '@exyconn/shell/graphql/generated';
import {
  DIRECTION_OPTIONS,
  EMPTY_EMAIL_FILTERS,
  PERIOD_OPTIONS,
  emailThreadFiltersSchema,
  type EmailThreadFilters,
} from './email-thread-filters.types';

interface EmailThreadFiltersFormProps {
  filters: EmailThreadFilters;
  /** The mailboxes the record's mail is in. */
  mailboxes: readonly Pick<CrmEmailMailbox, 'accountId' | 'mailbox'>[];
  onApply: (filters: EmailThreadFilters) => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for the Emails tab's filters: how recent (a preset or a custom
 * range on the date pickers), sent or received, and which connected mailbox.
 */
export function EmailThreadFiltersForm({
  filters,
  mailboxes,
  onApply,
  onCancel,
}: Readonly<EmailThreadFiltersFormProps>) {
  const t = useT();
  const methods = useForm<EmailThreadFilters>({
    mode: 'onTouched',
    resolver: zodResolver(emailThreadFiltersSchema),
    defaultValues: filters,
  });
  const period = useWatch({ control: methods.control, name: 'period' });
  const after = useWatch({ control: methods.control, name: 'after' });
  const translated = (options: ReadonlyArray<{ value: string; label: string }>) =>
    options.map((option) => ({ value: option.value, label: t(option.label) }));
  const mailboxOptions = [
    { value: '', label: t('Every mailbox') },
    ...mailboxes.map((box) => ({ value: box.accountId, label: box.mailbox || t('Unknown') })),
  ];

  return (
    <EntityForm
      methods={methods}
      onSubmit={onApply}
      isEdit={false}
      submitLabel="Apply filters"
      onCancel={onCancel}
    >
      <RhfSelect
        name="period"
        label="Date"
        options={translated(PERIOD_OPTIONS)}
        helperText="When the latest message of the conversation was sent"
      />
      {period === 'CUSTOM' && (
        <>
          <RhfDatePicker name="after" label="From" helperText="The first day to include" />
          <RhfDatePicker
            name="before"
            label="To"
            minDate={after || undefined}
            helperText="The last day to include"
          />
        </>
      )}
      <RhfSelect
        name="direction"
        label="Direction"
        options={translated(DIRECTION_OPTIONS)}
        helperText="Conversations with mail you sent, received, or either"
      />
      <RhfSelect
        name="accountId"
        label="Mailbox"
        options={mailboxOptions}
        helperText="The connected mailbox the conversation is in"
      />
      <Button
        variant="text"
        onClick={() => methods.reset(EMPTY_EMAIL_FILTERS)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Clear filters')}
      </Button>
    </EntityForm>
  );
}
