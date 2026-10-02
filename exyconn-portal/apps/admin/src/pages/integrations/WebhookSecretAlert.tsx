import { useT } from '@exyconn/i18n';
import { Alert, Text } from '@exyconn/shell/components/ui';

/** The one-time view of a new endpoint's signing secret, with how to verify a delivery. */
export function WebhookSecretAlert({
  secret,
  onClose,
}: Readonly<{ secret: string; onClose: () => void }>) {
  const t = useT();
  return (
    <Alert severity="warning" sx={{ mb: 2 }} onClose={onClose}>
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
  );
}
