import { useT } from '@exyconn/i18n';
import { Alert } from '@exyconn/shell/components/ui';

interface AiNotConfiguredProps {
  /** A one-line version for a node card. */
  compact?: boolean;
}

/** Shown on AI nodes and their inspector while the portal has no OpenAI key. */
export function AiNotConfigured({ compact = false }: Readonly<AiNotConfiguredProps>) {
  const t = useT();
  return (
    <Alert
      severity="warning"
      variant={compact ? 'standard' : 'outlined'}
      sx={compact ? { py: 0, px: 1 } : undefined}
    >
      {t('OpenAI not configured — set it in Tech > Environment Variables')}
    </Alert>
  );
}
