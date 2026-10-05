import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Button, Stack } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useClientHubReplyToTicketMutation } from '@exyconn/shell/graphql/generated';
import { ticketReplySchema, type TicketReplyValues } from './ticket-reply.types';

interface TicketReplyFormProps {
  ticketId: string;
  onReplied: () => void;
}

/** Adds the client's reply to a ticket thread. */
export function TicketReplyForm({ ticketId, onReplied }: Readonly<TicketReplyFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [reply] = useClientHubReplyToTicketMutation();
  const methods = useForm<TicketReplyValues>({
    mode: 'onTouched',
    resolver: zodResolver(ticketReplySchema),
    defaultValues: { body: '' },
  });

  const onSubmit = async ({ body }: TicketReplyValues) => {
    try {
      await reply({ variables: { ticketId, body } });
      methods.reset();
      onReplied();
    } catch (err) {
      notify(errorMessage(err, t('The reply could not be sent')), 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1.5}>
          <RhfTextField name="body" label={t('Your reply')} multiline minRows={3} />
          <Button
            type="submit"
            variant="contained"
            loading={methods.formState.isSubmitting}
            sx={{ alignSelf: 'flex-end' }}
          >
            {t('Send reply')}
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
}
