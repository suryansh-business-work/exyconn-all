import CloseIcon from '@mui/icons-material/Close';
import { useT } from '@exyconn/i18n';
import { Drawer, Flex, IconButton, Typography } from '@exyconn/shell/components/ui';
import type { CrmEmailMailbox } from '@exyconn/shell/graphql/generated';
import { EmailThreadFiltersForm, type EmailThreadFilters } from '../forms/email-thread-filters';

interface EmailFiltersDrawerProps {
  open: boolean;
  filters: EmailThreadFilters;
  mailboxes: readonly Pick<CrmEmailMailbox, 'accountId' | 'mailbox'>[];
  onApply: (filters: EmailThreadFilters) => void;
  onClose: () => void;
}

const TITLE_ID = 'email-filters-title';

/** The Emails tab's filters in a side panel, opened from the filter icon. */
export function EmailFiltersDrawer({
  open,
  filters,
  mailboxes,
  onApply,
  onClose,
}: Readonly<EmailFiltersDrawerProps>) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          'aria-labelledby': TITLE_ID,
          sx: { width: { xs: '100%', sm: 420 }, maxWidth: '100%' },
        },
      }}
    >
      <Flex
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="h6" component="h2" id={TITLE_ID}>
          {t('Filter emails')}
        </Typography>
        <IconButton onClick={onClose} aria-label={t('Close')} edge="end">
          <CloseIcon />
        </IconButton>
      </Flex>
      {open && (
        <Flex direction="column" sx={{ p: 2 }}>
          <EmailThreadFiltersForm
            filters={filters}
            mailboxes={mailboxes}
            onApply={onApply}
            onCancel={onClose}
          />
        </Flex>
      )}
    </Drawer>
  );
}
