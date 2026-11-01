import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Box, Button, Stack, Text, Typography } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { McpSandbox, SandboxToken } from '../pages/mcp-sandbox/useMcpSandbox';

/** ACTIVE, REVOKED or EXPIRED: why a token does or does not work. */
export function stateOf(token: SandboxToken): string {
  if (token.active) {
    return 'ACTIVE';
  }
  return token.revokedAt ? 'REVOKED' : 'EXPIRED';
}

/** One token: when it was made, until when, whether it was used, and Revoke while it works. */
function TokenRow({ token, onRevoke }: Readonly<{ token: SandboxToken; onRevoke: () => void }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const used = token.lastUsedAt
    ? t('Last used {when}.', { when: formatDateTime(token.lastUsedAt) })
    : t('Not used yet.');
  return (
    <Box component="li" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <StatusChip value={stateOf(token)} />
      <Text sx={{ flexGrow: 1 }}>
        {t('Made {made}, good until {until}.', {
          made: formatDateTime(token.createdAt),
          until: formatDateTime(token.expiresAt),
        })}{' '}
        {used}
      </Text>
      {token.active && (
        <Button size="small" color="error" onClick={onRevoke}>
          {t('Revoke')}
        </Button>
      )}
    </Box>
  );
}

/** The visitor's own recent tokens. */
export function TokenList({ sandbox }: Readonly<{ sandbox: McpSandbox }>) {
  const t = useT();
  if (sandbox.tokensError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => sandbox.retryTokens()}>
            {t('Retry')}
          </Button>
        }
      >
        {sandbox.tokensError}
      </Alert>
    );
  }
  if (sandbox.tokens.length === 0) {
    return null;
  }
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" component="h3">
        {t('Your tokens')}
      </Typography>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'grid', gap: 1 }}>
        {sandbox.tokens.map((token) => (
          <TokenRow key={token.id} token={token} onRevoke={() => sandbox.revoke(token.id)} />
        ))}
      </Box>
    </Stack>
  );
}
