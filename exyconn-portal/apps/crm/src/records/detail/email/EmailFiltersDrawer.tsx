import type { CrmEmailMailbox } from '@exyconn/shell/graphql/generated';
import { FiltersDrawer } from '../../../mail-filters';
import { EmailThreadFiltersForm, type EmailThreadFilters } from '../forms/email-thread-filters';

interface EmailFiltersDrawerProps {
  open: boolean;
  filters: EmailThreadFilters;
  mailboxes: readonly Pick<CrmEmailMailbox, 'accountId' | 'mailbox'>[];
  onApply: (filters: EmailThreadFilters) => void;
  onClose: () => void;
}

/** The Emails tab's filters in a side panel, opened from the filter icon. */
export function EmailFiltersDrawer({
  open,
  filters,
  mailboxes,
  onApply,
  onClose,
}: Readonly<EmailFiltersDrawerProps>) {
  return (
    <FiltersDrawer open={open} title="Filter emails" onClose={onClose}>
      <EmailThreadFiltersForm
        filters={filters}
        mailboxes={mailboxes}
        onApply={onApply}
        onCancel={onClose}
      />
    </FiltersDrawer>
  );
}
