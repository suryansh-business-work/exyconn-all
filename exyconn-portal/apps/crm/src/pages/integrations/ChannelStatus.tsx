import { useT } from '@exyconn/i18n';
import { Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { PROVIDER_NAMES, ProviderLogo } from '@exyconn/shell/components/mailboxes';

interface ChannelStatusProps {
  /** Whether the channel can be used from a record page. */
  ready: boolean;
  /** The active account's provider, when there is one. */
  provider?: string | null;
  /** What becomes possible once it is connected, in a sentence. */
  hint: string;
}

/** "Connected" or "Not connected" for one channel, at the top of its tab. */
export function ChannelStatus({ ready, provider, hint }: Readonly<ChannelStatusProps>) {
  const t = useT();
  const label = ready ? t('Connected') : t('Not connected');
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      <Chip size="small" color={ready ? 'success' : 'default'} label={label} />
      {ready && provider && (
        <>
          <ProviderLogo provider={provider} />
          <Text size="sm" color="text.secondary">
            {t('Active account: {provider}', { provider: PROVIDER_NAMES[provider] ?? provider })}
          </Text>
        </>
      )}
      {!ready && (
        <Text size="sm" color="text.secondary">
          {t(hint)}
        </Text>
      )}
    </Flex>
  );
}
