import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, MenuItem, Stack, Text, TextField } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  McpEndpoint,
  useApiReferenceQuery,
  useMcpServersQuery,
} from '@exyconn/shell/graphql/generated';
import { ApiOperationCard, type ApiOperationRow } from './ApiOperationCard';

const isEndpoint = (value: string | null): value is McpEndpoint =>
  value !== null && (Object.values(McpEndpoint) as string[]).includes(value);

const matches = (operation: ApiOperationRow, search: string) =>
  operation.name.toLowerCase().includes(search) ||
  operation.description.toLowerCase().includes(search);

/** The operations, or why there are none to show. */
function OperationList({
  loading,
  error,
  operations,
}: Readonly<{ loading: boolean; error?: Error; operations: ApiOperationRow[] }>) {
  const t = useT();
  if (loading) return <LoadingState />;
  if (error) {
    return (
      <Alert severity="error">{errorMessage(error, t('The reference could not be loaded'))}</Alert>
    );
  }
  if (operations.length === 0) {
    return <EmptyState title="No operations match" description="Try another word or module." />;
  }
  return (
    <Box>
      {operations.map((operation) => (
        <ApiOperationCard key={`${operation.kind}-${operation.name}`} operation={operation} />
      ))}
    </Box>
  );
}

/**
 * Developers › API reference: every GraphQL operation of a module, with the description,
 * arguments and an example document — built from the same schema descriptions as the MCP tools.
 * Call it at the portal API's /graphql with an API key in the x-api-key header.
 */
export function ApiReferencePage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const servers = useMcpServersQuery();
  const modules = (servers.data?.mcpServers ?? []).filter((s) => s.endpoint !== McpEndpoint.All);
  const requested = params.get('module');
  const endpoint = isEndpoint(requested) ? requested : (modules[0]?.endpoint ?? null);
  const reference = useApiReferenceQuery({
    variables: { endpoint: endpoint ?? McpEndpoint.Crm },
    skip: endpoint === null,
  });
  const term = search.trim().toLowerCase();
  const operations = useMemo(
    () => (reference.data?.apiReference ?? []).filter((operation) => matches(operation, term)),
    [reference.data, term],
  );

  return (
    <Box>
      <PageHeader
        title="API reference"
        subtitle="Every GraphQL operation by module — send it to /graphql with your key in x-api-key"
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label={t('Module')}
          value={endpoint ?? ''}
          onChange={(event) => setParams({ module: event.target.value }, { replace: true })}
          sx={{ minWidth: 220 }}
        >
          {modules.map((server) => (
            <MenuItem key={server.endpoint} value={server.endpoint}>
              {server.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label={t('Search operations')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>
      <Text size="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('{count} operations', { count: operations.length })}
      </Text>
      <OperationList
        loading={servers.loading || (!reference.data && reference.loading)}
        error={servers.error ?? reference.error}
        operations={operations}
      />
    </Box>
  );
}
