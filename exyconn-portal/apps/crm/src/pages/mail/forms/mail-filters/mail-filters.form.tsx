import { useForm } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { Button } from '@exyconn/shell/components/ui';
import { PeriodFields } from '../../../../mail-filters';
import { EMPTY_MAIL_FILTERS, mailFiltersSchema, type MailFilters } from './mail-filters.types';

interface MailFiltersFormProps {
  filters: MailFilters;
  onApply: (filters: MailFilters) => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for CRM > Mail's filters: how recent (a preset or a custom range
 * on the date pickers), unread only, and with attachments only.
 */
export function MailFiltersForm({ filters, onApply, onCancel }: Readonly<MailFiltersFormProps>) {
  const t = useT();
  const methods = useForm<MailFilters>({
    mode: 'onTouched',
    resolver: zodResolver(mailFiltersSchema),
    defaultValues: filters,
  });
  return (
    <EntityForm
      methods={methods}
      onSubmit={onApply}
      isEdit={false}
      submitLabel="Apply filters"
      onCancel={onCancel}
    >
      <PeriodFields />
      <RhfSwitch name="unreadOnly" label="Unread only" />
      <RhfSwitch name="withAttachments" label="With attachments only" />
      <Button
        variant="text"
        onClick={() => methods.reset(EMPTY_MAIL_FILTERS)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Clear filters')}
      </Button>
    </EntityForm>
  );
}
