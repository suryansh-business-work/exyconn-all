import { useT } from '@exyconn/i18n';
import { Stack, Text, Typography } from '@exyconn/shell/components/ui';
import { CodeSnippet } from './CodeSnippet';

/** Where the token goes until one is taken: the visitor sees the shape of each command. */
const TOKEN_PLACEHOLDER = '<your sandbox token>';
/** The name the sandbox server is added under in Claude. */
const SERVER_KEY = 'exyconn-sandbox';

interface ConnectStepsProps {
  endpointUrl: string;
  token: string | null;
}

/** The Claude Code command that adds the sandbox server with the token. */
export function claudeCodeCommand(endpointUrl: string, token: string): string {
  return `claude mcp add --transport http ${SERVER_KEY} ${endpointUrl} --header "Authorization: Bearer ${token}"`;
}

/** Claude Desktop's config entry: the remote server reached through mcp-remote, with the token. */
export function claudeDesktopConfig(endpointUrl: string, token: string): string {
  const server = {
    command: 'npx',
    args: ['-y', 'mcp-remote', endpointUrl, '--header', `Authorization: Bearer ${token}`],
  };
  return JSON.stringify({ mcpServers: { [SERVER_KEY]: server } }, null, 2);
}

/** How to point Claude Code or Claude Desktop at the sandbox with the visitor's token. */
export function ConnectSteps({ endpointUrl, token }: Readonly<ConnectStepsProps>) {
  const t = useT();
  const shown = token ?? TOKEN_PLACEHOLDER;
  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h3">
        {t('Claude Code')}
      </Typography>
      <Text color="text.secondary">
        {t('Run this in a terminal, then ask Claude about the sample company.')}
      </Text>
      <CodeSnippet label="Claude Code command" code={claudeCodeCommand(endpointUrl, shown)} />
      <Typography variant="h6" component="h3">
        {t('Claude Desktop')}
      </Typography>
      <Text color="text.secondary">
        {t(
          'Open Settings > Developer > Edit Config, add this server to claude_desktop_config.json and restart Claude Desktop. It needs Node.js.',
        )}
      </Text>
      <CodeSnippet label="Claude Desktop config" code={claudeDesktopConfig(endpointUrl, shown)} />
    </Stack>
  );
}
