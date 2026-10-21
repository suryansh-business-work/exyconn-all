import type { ReactNode } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ProviderLogo } from '../../../integrations/ProviderLogo';
import { ConnectMailboxButton } from './ConnectMailboxButton';

/** The words one provider's card uses, as English source strings. */
export interface MailProviderText {
  title: string;
  description: string;
  connectLabel: string;
  empty: string;
  loading: string;
  loadError: string;
  /** Why the connect button is off while the platform has not switched the provider on. */
  unavailable: string;
}

interface MailProviderCardProps {
  provider: 'GMAIL' | 'MICROSOFT';
  text: MailProviderText;
  /** Whether a mailbox of this provider is turned on and connected for the CRM. */
  ready: boolean;
  /** The accounts query: whether it answered, is loading, failed, and how to try again. */
  loaded: boolean;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<unknown>;
  /** Whether the platform can connect this provider; unknown until the accounts load. */
  available: boolean | undefined;
  connecting: boolean;
  onConnect: () => Promise<unknown>;
  /** One card per connected mailbox; none when nothing is connected. */
  accounts: ReactNode[];
}

const logFailure = (error: unknown) => portalLogger.warn('crm: mailbox list action failed', error);

/** The list part of a provider's card: failure with retry, loading, empty, or the mailboxes. */
function MailboxList(props: Readonly<MailProviderCardProps>) {
  const t = useT();
  const { text, loaded, loading, error, accounts } = props;
  if (error && !loaded) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => props.refetch().catch(logFailure)}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t(text.loadError))}
      </Alert>
    );
  }
  if (loading && !loaded) {
    return <PanelSkeleton lines={2} label={text.loading} />;
  }
  if (accounts.length === 0) {
    return <Text color="text.secondary">{t(text.empty)}</Text>;
  }
  return <Stack spacing={1.5}>{accounts}</Stack>;
}

/**
 * One provider on CRM > Integrations > Email: whether it is connected, its mailboxes, and the
 * button that connects another one through the provider's sign-in page.
 */
export function MailProviderCard(props: Readonly<MailProviderCardProps>) {
  const t = useT();
  const { provider, text, ready } = props;
  const headingId = `${provider.toLowerCase()}-mail-heading`;
  return (
    <Box component="section" sx={panel} aria-labelledby={headingId}>
      <Flex direction="column" spacing={1.5}>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <ProviderLogo provider={provider} size={28} />
          <Text id={headingId} component="h2" weight="semibold">
            {t(text.title)}
          </Text>
          <Chip
            size="small"
            color={ready ? 'success' : 'default'}
            label={ready ? t('Connected') : t('Not connected')}
          />
        </Flex>
        <Text size="sm" color="text.secondary">
          {t(text.description)}
        </Text>
        <MailboxList {...props} />
        <ConnectMailboxButton
          label={text.connectLabel}
          available={props.available}
          unavailableHint={text.unavailable}
          connecting={props.connecting}
          onConnect={() => {
            props.onConnect().catch(logFailure);
          }}
          provider={provider}
        />
      </Flex>
    </Box>
  );
}
