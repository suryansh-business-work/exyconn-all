import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Card, Chip, Stack, Text } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ClientHubRemindersQuery } from '@exyconn/shell/graphql/generated';
import { PayDialog, type PayableInvoice } from '../invoices/PayDialog';
import { money } from '../money';

type Reminder = ClientHubRemindersQuery['clientHubReminders'][number];

/** "Overdue by 12 days" or "Due 14 Oct" — the one line that decides what to pay first. */
function DueChip({ reminder }: Readonly<{ reminder: Reminder }>) {
  const t = useT();
  const { formatDate } = useSettings();
  if (reminder.daysLate > 0) {
    return (
      <Chip
        size="small"
        color="error"
        label={t('Overdue by {days} days', { days: reminder.daysLate })}
      />
    );
  }
  return (
    <Chip
      size="small"
      variant="outlined"
      label={t('Due {date}', { date: formatDate(reminder.dueDate) })}
    />
  );
}

/** Payment reminders: every unpaid invoice, soonest due first, with a Pay button on each. */
export function RemindersPanel({ reminders }: Readonly<{ reminders: Reminder[] }>) {
  const t = useT();
  const [paying, setPaying] = useState<PayableInvoice | null>(null);

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Text weight="semibold" size="lg">
          {t('Payment reminders')}
        </Text>
        {reminders.length === 0 && (
          <EmptyState title="All paid up" description="Nothing is waiting to be paid. Thank you!" />
        )}
        {reminders.map((reminder) => (
          <Stack
            key={reminder.invoiceId}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack spacing={0.5}>
              <Text weight="semibold">{reminder.number}</Text>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Text size="sm">{money(reminder.balance, reminder.currency)}</Text>
                <DueChip reminder={reminder} />
              </Stack>
            </Stack>
            <Button
              variant="contained"
              onClick={() =>
                setPaying({
                  id: reminder.invoiceId,
                  number: reminder.number,
                  balance: reminder.balance,
                  currency: reminder.currency,
                })
              }
            >
              {t('Pay now')}
            </Button>
          </Stack>
        ))}
      </Stack>
      <PayDialog invoice={paying} onClose={() => setPaying(null)} />
    </Card>
  );
}
