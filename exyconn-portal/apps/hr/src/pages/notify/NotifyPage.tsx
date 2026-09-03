import { useState } from 'react';
import { Box, Grid, Heading, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { SendNotificationForm } from './forms/send-notification';

/** HR notification management: broadcast to everyone, a department, or chosen people. */
export function NotifyPage() {
  const [lastSent, setLastSent] = useState<number | null>(null);

  return (
    <Box>
      <PageHeader
        title="Send Notification"
        subtitle="An in-app notification, delivered instantly"
      />
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Box sx={[glass, { p: 2.5 }]}>
            <SendNotificationForm onSent={setLastSent} />
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={[glass, { p: 2.5 }]}>
            <Heading level={6}>How it lands</Heading>
            <Text size="sm" color="text.secondary" sx={{ mt: 1 }}>
              Recipients see it in their notification centre and the bell count on every portal.
              Deactivated accounts are never included. Announcements published from the
              Announcements page already notify everyone automatically — use this for anything else:
              reminders, deadlines, events, HR notices.
            </Text>
            {lastSent !== null && (
              <Text size="sm" sx={{ mt: 2 }}>
                Last send reached <strong>{lastSent}</strong> {lastSent === 1 ? 'person' : 'people'}
                .
              </Text>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
