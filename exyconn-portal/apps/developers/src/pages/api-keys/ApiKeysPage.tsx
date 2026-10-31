import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ApiKeysPanel, type ApiKeyRow } from './ApiKeysPanel';
import { ApiKeyUsageDialog } from './ApiKeyUsageDialog';

/** Developers › API keys: a machine's way in, and how much each key is used. */
export function ApiKeysPage() {
  const [usageOf, setUsageOf] = useState<ApiKeyRow | null>(null);
  return (
    <Box>
      <PageHeader
        title="API keys"
        subtitle="Keys for machines that call the API (send one as the x-api-key header), and their daily use"
      />
      <ApiKeysPanel onShowUsage={setUsageOf} />
      <ApiKeyUsageDialog apiKey={usageOf} onClose={() => setUsageOf(null)} />
    </Box>
  );
}
