import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { formatWith } from '@exyconn/shell/utils/date';
import { useClientSupportTicketStatusLazyQuery } from '@exyconn/shell/graphql/generated';
import { TIME_FORMAT } from '../../../../status.constants';
import { TicketThread } from './TicketThread';
import type { CheckTicketFormProps, ClientTicket } from './check-ticket.types';

/**
 * Both halves are required, and that is the security model.
 *
 * A reference alone would let anybody who saw one over a shoulder read the thread; the
 * address is the second half, and the server answers null unless both match.
 */
export const checkTicketSchema = z.object({
  reference: z.string().trim().toUpperCase().min(4, 'The reference from your confirmation'),
  email: z
    .string()
    .trim()
    .min(1, 'The address you raised it from')
    .regex(EMAIL, 'Enter a valid email'),
});

type Values = z.infer<typeof checkTicketSchema>;

/** The answer, once one has come back. */
function TicketSummary({ ticket }: Readonly<{ ticket: ClientTicket }>) {
  const t = useT();
  return (
    <Box sx={{ mt: 1 }}>
      <Flex alignItems="center" spacing={1} flexWrap="wrap">
        <Typography variant="subtitle2" sx={{ fontWeight: fontWeight.bold }}>
          {ticket.reference}
        </Typography>
        <StatusChip value={ticket.status} />
      </Flex>
      <Typography variant="body2">{ticket.subject}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t('Last updated {updated}', { updated: formatWith(ticket.updatedAt, TIME_FORMAT) })}
      </Typography>
      <TicketThread replies={ticket.replies} />
    </Box>
  );
}

/** Looks one ticket up by its reference and the address it was raised from. */
export function CheckTicketForm({ onCancel }: Readonly<CheckTicketFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [lookup] = useClientSupportTicketStatusLazyQuery({ fetchPolicy: 'network-only' });
  const [ticket, setTicket] = useState<ClientTicket | null>(null);
  const [missing, setMissing] = useState(false);
  const methods = useForm<z.input<typeof checkTicketSchema>, unknown, Values>({
    resolver: zodResolver(checkTicketSchema),
    defaultValues: { reference: '', email: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data, error } = await lookup({ variables: values });
      if (error) {
        throw error;
      }
      const found = data?.clientSupportTicketStatus ?? null;
      setTicket(found);
      setMissing(found === null);
    } catch (error) {
      setTicket(null);
      setMissing(false);
      notify(errorMessage(error, 'Could not look that ticket up'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Check"
    >
      <RhfTextField
        name="reference"
        label="Ticket reference"
        helperText="The EXY- code from your confirmation"
      />
      <RhfTextField name="email" label="Your email" />
      {/* One message for "no such ticket" and for "not your ticket": telling them apart
          would confirm that a reference exists to somebody who only guessed it. */}
      {missing && (
        <Alert severity="info">
          {t('No ticket matches that reference and address. Check both and try again.')}
        </Alert>
      )}
      {ticket && <TicketSummary ticket={ticket} />}
    </EntityForm>
  );
}
