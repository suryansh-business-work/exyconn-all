import { useState } from 'react';
import { Alert, Box, Card, Flex, Typography } from '@exyconn/shell/components/ui';
import { SubscribeForm } from './forms/subscribe';

/**
 * "Subscribe to updates" on the public status page.
 *
 * Double opt-in, so the card can only ever promise a confirmation email — never that the
 * address is now on the list. Saying more would leak whether an address is already there.
 */
export function SubscribeCard() {
  const [sentTo, setSentTo] = useState('');

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Flex direction="column" spacing={2}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            Subscribe to updates
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            Get an email when a service goes down, when it comes back, and when maintenance is
            planned. No account needed, and one click to stop.
          </Typography>
        </Box>
        {sentTo ? (
          <Alert severity="success">
            Check {sentTo} for a confirmation link. Nothing else is sent until you follow it.
          </Alert>
        ) : (
          <SubscribeForm onSubmitted={setSentTo} />
        )}
      </Flex>
    </Card>
  );
}
