import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex } from '@/components/ui';
import { CrmEmailProvider } from '@/graphql/generated';
import { ProviderLogo } from '@/components/mailboxes';
import { useConnectMailbox } from './useConnectMailbox';

interface ConnectMailboxButtonsProps {
  /** Which providers the platform's OAuth apps are set up for. */
  providers: Readonly<{ gmail: boolean; microsoft: boolean }>;
}

const BUTTONS = [
  { provider: CrmEmailProvider.Gmail, key: 'gmail', label: 'Connect Gmail' },
  { provider: CrmEmailProvider.Microsoft, key: 'microsoft', label: 'Connect Microsoft' },
] as const;

/** "Connect Gmail" and "Connect Microsoft", for the providers the platform has set up. */
export function ConnectMailboxButtons({ providers }: Readonly<ConnectMailboxButtonsProps>) {
  const t = useT();
  const { connect, connecting } = useConnectMailbox();
  const available = BUTTONS.filter((button) => providers[button.key]);
  if (available.length === 0) {
    return (
      <Alert severity="info">
        {t('Email accounts are not available yet. Ask your administrator.')}
      </Alert>
    );
  }
  return (
    <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {available.map((button) => (
        <Button
          key={button.key}
          variant="outlined"
          loading={connecting}
          startIcon={<ProviderLogo provider={button.provider} />}
          onClick={() => connect(button.provider)}
        >
          {t(button.label)}
        </Button>
      ))}
    </Flex>
  );
}
