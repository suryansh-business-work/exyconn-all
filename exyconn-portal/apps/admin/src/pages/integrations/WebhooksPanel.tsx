import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Switch, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useListWebhooksQuery,
  useSetWebhookActiveMutation,
  type ListWebhooksQuery,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { WebhookSecretAlert } from './WebhookSecretAlert';

type WebhookRow = ListWebhooksQuery['listWebhooks'][number];

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
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading, refetch } = useListWebhooksQuery();
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
  const remove = async (id: string): Promise<void> => {
    const ok = await confirm({
      message: 'Delete this endpoint? Deliveries to it stop at once.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) run(deleteWebhook({ variables: { id } }), 'Could not delete the endpoint');
  };

  const columns: Column<WebhookRow>[] = [
    { key: 'name', label: 'Name' },
    {
      key: 'url',
      label: 'Endpoint',
      render: (hook) => (
        <Box component="span" sx={{ display: 'block', maxWidth: 260, wordBreak: 'break-all' }}>
          {hook.url}
        </Box>
      ),
    },
    { key: 'events', label: 'Events', render: (hook) => hook.events.join(', ') },
    {
      key: 'lastDeliveredAt',
      label: 'Last delivered',
      render: (hook) => (
        <>
          {hook.lastDeliveredAt ? formatDateTime(hook.lastDeliveredAt) : t('Never')}
          {hook.failureCount > 0 ? t(' · {count} failing', { count: hook.failureCount }) : ''}
        </>
      ),
    },
    {
      key: 'active',
      label: 'Active',
      render: (hook) => (
        <Switch
          checked={hook.active}
          onChange={(event) =>
            run(
              setActive({ variables: { id: hook.id, active: event.target.checked } }),
              'Could not change the endpoint',
            )
          }
          slotProps={{ input: { 'aria-label': t('Enable {name}', { name: hook.name }) } }}
        />
      ),
    },
  ];

  return (
    <Box>
      {secret ? <WebhookSecretAlert secret={secret} onClose={() => setSecret(null)} /> : null}

      <Flex direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label={t('Name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          sx={{ minWidth: { sm: 240 }, width: { xs: '100%', sm: 'auto' } }}
        />
        <TextField
          size="small"
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

      <Flex
        direction="row"
        spacing={0.5}
        role="group"
        aria-label={t('Events')}
        sx={{ mb: 2, flexWrap: 'wrap', rowGap: 0.5 }}
      >
        {available.map((event) => (
          <Chip
            key={event}
            label={event}
            size="small"
            aria-pressed={events.includes(event)}
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

      <DataTable
        columns={columns}
        rows={data?.listWebhooks ?? []}
        onDelete={(hook) => {
          remove(hook.id).catch((error: unknown) => console.error('Delete', error));
        }}
        loading={!data && loading}
        onRefresh={() => refetch()}
        emptyMessage="No webhook endpoints yet."
      />
    </Box>
  );
}
