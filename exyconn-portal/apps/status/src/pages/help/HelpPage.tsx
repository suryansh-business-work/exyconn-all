import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Card, Flex, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { RaiseTicketForm } from './forms/raise-ticket';
import { CheckTicketForm } from './forms/check-ticket';
import { TicketReceipt } from './TicketReceipt';

/**
 * Public help page: ask for help without an account, and follow the ticket afterwards.
 *
 * Both halves already existed on the server and neither had a single caller on the
 * internet. A customer could reach support by emailing the mailbox or by having an agent
 * type the ticket in for them, and a customer with a reference had nowhere at all to use it.
 *
 * It lives on the status site because that is the one app with no sign-in — the same reason
 * the status page itself does.
 */
export function HelpPage() {
  const t = useT();
  const navigate = useNavigate();
  const [reference, setReference] = useState('');

  if (reference) {
    return <TicketReceipt reference={reference} onAnother={() => setReference('')} />;
  }

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: fontWeight.bold }}>
          {t('Get help')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t(
            'Tell us what you need and the support team picks it up. You do not need an account, and you will get a reference to follow it with.',
          )}
        </Typography>
      </Box>

      <Alert severity="info">
        {t('If something is broken for everybody, the service list above usually says so first.')}
      </Alert>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <RaiseTicketForm onSubmitted={setReference} onCancel={() => navigate('/')} />
      </Card>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: fontWeight.bold }}>
          {t('Follow a ticket')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('Quote your reference and the address you raised it from to see where it is.')}
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <CheckTicketForm onCancel={() => navigate('/')} />
      </Card>
    </Flex>
  );
}
