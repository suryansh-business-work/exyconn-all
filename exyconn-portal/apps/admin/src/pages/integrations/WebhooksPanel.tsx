import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  Chip,
  Flex,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useListWebhooksQuery,
  useSetWebhookActiveMutation,
} from '@exyconn/shell/graphql/generated';

/**
 * Webhooks — how this portal tells another system that something happened.
 *
 * The signing secret is shown once, for the same reason an API key is: it is the thing that
 * proves a delivery came from us, and a secret sitting on a screen is a secret in a
 * screenshare. Every delivery carries an HMAC over the timestamp and the body, so a receiver
 * can prove both who sent it and that it is not a replay of one they saw last week.
 */
export function WebhooksPanel() {
  const t = useT();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const { data, refetch } = useListWebhooksQuery();
  const [createWebhook] = useCreateWebhookMutation();
  const [setActive] = useSetWebhookActiveMutation();
  const [deleteWebhook] = useDeleteWebhookMutation();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState<string | null>(null);

  const available = data?.webhookEvents ?? [];

  const create = async (): Promise<void> => {
    try {
      const result = await createWebhook({
        variables: { name: name.trim(), url: url.trim(), events },
      });
      setSecret(result.data?.createWebhook.secret ?? null);
      setName('');
      setUrl('');
      setEvents([]);
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create the endpoint', 'error');
    }
  };

  const run = (action: Promise<unknown>, failure: string): void => {
    action
      .then(() => refetch())
      .catch((error: unknown) => notify(error instanceof Error ? error.message : failure, 'error'));
  };

  return (
    <Box>
      {secret ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setSecret(null)}>
          <Text size="sm" weight="bold" sx={{ display: 'block' }}>
            {t('Copy this signing secret now — it is never shown again.')}
          </Text>
          <Text size="sm" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {secret}
          </Text>
          <Text size="caption" sx={{ display: 'block', mt: 0.5 }}>
            {t(
              'Verify each delivery as sha256 HMAC over `<timestamp>.<body>`, from the x-exyconn-timestamp and x-exyconn-signature headers.',
            )}
          </Text>
        </Alert>
      ) : null}

      <Flex direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        <TextField
          label={t('Name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label={t('HTTPS endpoint')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          sx={{ flex: 1, minWidth: { sm: 260 }, width: { xs: '100%', sm: 'auto' } }}
        />
        <Button
          variant="contained"
          onClick={() => {
            create().catch((error: unknown) => console.error('Create webhook failed', error));
          }}
        >
          {t('Add endpoint')}
        </Button>
      </Flex>

      <Flex direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {available.map((event) => (
          <Chip
            key={event}
            label={event}
            size="small"
            color={events.includes(event) ? 'primary' : 'default'}
            onClick={() =>
              setEvents((current) =>
                current.includes(event)
                  ? current.filter((value) => value !== event)
                  : [...current, event],
              )
            }
          />
        ))}
      </Flex>

      {/* Scrolls itself on a narrow screen rather than widening the page. */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('Name')}</TableCell>
              <TableCell>{t('Endpoint')}</TableCell>
              <TableCell>{t('Events')}</TableCell>
              <TableCell>{t('Last delivered')}</TableCell>
              <TableCell>{t('Active')}</TableCell>
              <TableCell align="right">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.listWebhooks ?? []).map((hook) => (
              <TableRow key={hook.id}>
                <TableCell>{hook.name}</TableCell>
                <TableCell sx={{ maxWidth: 260, wordBreak: 'break-all' }}>{hook.url}</TableCell>
                <TableCell>{hook.events.join(', ')}</TableCell>
                <TableCell>
                  {hook.lastDeliveredAt ? formatDateTime(hook.lastDeliveredAt) : t('Never')}
                  {hook.failureCount > 0
                    ? t(' · {count} failing', { count: hook.failureCount })
                    : ''}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={hook.active}
                    onChange={(event) =>
                      run(
                        setActive({ variables: { id: hook.id, active: event.target.checked } }),
                        'Could not change the endpoint',
                      )
                    }
                    slotProps={{
                      input: { 'aria-label': t('Enable {name}', { name: hook.name }) },
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() =>
                      run(
                        deleteWebhook({ variables: { id: hook.id } }),
                        'Could not delete the endpoint',
                      )
                    }
                  >
                    {t('Delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
