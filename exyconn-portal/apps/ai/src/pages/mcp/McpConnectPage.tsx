import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Card, Skeleton, Stack, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useApproveMcpAuthorizationMutation,
  useDenyMcpAuthorizationMutation,
  useMcpAuthorizationRequestQuery,
} from '@exyconn/shell/graphql/generated';

/**
 * Where Claude's sign-in lands: the person, signed in to the portal as themselves, allows (or
 * declines) the connector once, and the browser goes back to Claude.
 */
export function McpConnectPage() {
  const t = useT();
  const notify = useNotify();
  const [params] = useSearchParams();
  const id = params.get('request') ?? '';
  const [busy, setBusy] = useState(false);
  const { data, loading, error } = useMcpAuthorizationRequestQuery({
    variables: { id },
    skip: id === '',
  });
  const [approve] = useApproveMcpAuthorizationMutation();
  const [deny] = useDenyMcpAuthorizationMutation();
  const request = data?.mcpAuthorizationRequest;

  const answer = async (allow: boolean) => {
    setBusy(true);
    try {
      const result = allow
        ? (await approve({ variables: { id } })).data?.approveMcpAuthorization
        : (await deny({ variables: { id } })).data?.denyMcpAuthorization;
      if (result) {
        globalThis.location.assign(result);
      }
    } catch (err) {
      notify(errorMessage(err, 'Could not answer the sign-in. Start again from Claude.'), 'error');
      setBusy(false);
    }
  };

  let body;
  if (id === '' || error) {
    body = (
      <Alert severity="error">
        {error?.message ?? t('This sign-in link is incomplete. Start again from Claude.')}
      </Alert>
    );
  } else if (request) {
    body = (
      <Stack spacing={2}>
        <Text component="h1" size="lg" weight="bold">
          {t('{client} wants to use your CRM', { client: request.clientName })}
        </Text>
        <Text size="sm" color="text.secondary">
          {t(
            'It will act as you, with your permissions: read and change leads, companies, contacts, deals, activities, meetings, mail and cold emails. Everything it does is logged. The answer goes back to {host}.',
            { host: request.redirectHost },
          )}
        </Text>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={busy} onClick={() => answer(true)}>
            {t('Allow')}
          </Button>
          <Button disabled={busy} onClick={() => answer(false)}>
            {t('Cancel')}
          </Button>
        </Stack>
      </Stack>
    );
  } else {
    body = loading ? <Skeleton variant="rounded" height={160} /> : null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <Card variant="outlined" sx={{ p: 3, maxWidth: 520, width: '100%' }}>
        {body}
      </Card>
    </Box>
  );
}
