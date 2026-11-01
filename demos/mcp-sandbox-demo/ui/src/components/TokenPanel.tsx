import { useFormatters, useT } from '@exyconn/i18n';
import KeyIcon from '@mui/icons-material/Key';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import type { McpSandbox, SandboxInfo } from '../pages/mcp-sandbox/useMcpSandbox';
import { CodeSnippet } from './CodeSnippet';
import { TokenList } from './TokenList';

/** The token's window and limits, the button that takes one, and the new token once taken. */
function TokenBody({ info, sandbox }: Readonly<{ info: SandboxInfo; sandbox: McpSandbox }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const usedUp = info.tokensLeftToday === 0;
  return (
    <Stack spacing={2}>
      <Text color="text.secondary">
        {t(
          'A token reads {company} for {minutes} minutes, up to {calls} tool calls an hour. It cannot change anything. You have {left} of {total} tokens left today.',
          {
            company: info.organizationName,
            minutes: info.tokenTtlMinutes,
            calls: info.callsPerHour,
            left: info.tokensLeftToday,
            total: info.tokensPerDay,
          },
        )}
      </Text>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
        {info.modules.map((module) => (
          <Chip key={module} label={module} size="small" variant="outlined" />
        ))}
      </Stack>
      <Button
        variant="contained"
        startIcon={<KeyIcon />}
        disabled={usedUp || sandbox.issuing}
        onClick={() => sandbox.issue()}
      >
        {t('Get a read-only token')}
      </Button>
      {usedUp && (
        <Alert severity="info">
          {t('You have used today’s sandbox tokens. Try again tomorrow.')}
        </Alert>
      )}
      {sandbox.issued && (
        <Stack spacing={1}>
          <Alert severity="success">
            {t('Copy your token now: it is shown only once. It stops working at {when}.', {
              when: formatDateTime(sandbox.issued.expiresAt),
            })}
          </Alert>
          <CodeSnippet label="Your sandbox token" code={sandbox.issued.token} />
        </Stack>
      )}
      <TokenList sandbox={sandbox} />
    </Stack>
  );
}

/** Take a short-lived, read-only MCP token for the sandbox company. */
export function TokenPanel({ sandbox }: Readonly<{ sandbox: McpSandbox }>) {
  const t = useT();
  let body = <CircularProgress aria-label={t('Loading')} />;
  if (sandbox.infoError) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => sandbox.retryInfo()}>
            {t('Retry')}
          </Button>
        }
      >
        {sandbox.infoError}
      </Alert>
    );
  } else if (sandbox.info) {
    body = <TokenBody info={sandbox.info} sandbox={sandbox} />;
  }
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            {t('Your sandbox token')}
          </Typography>
          {body}
        </Stack>
      </CardContent>
    </Card>
  );
}
