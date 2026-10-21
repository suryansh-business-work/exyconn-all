import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import type { Account } from './useSocialAccounts';

/** Why an account is not doing its usual work, if it is not: the first that applies. */
function noteOf(account: Account): string | null {
  if (account.disconnectedAt) return 'No longer an administrator of this page — disconnected';
  if (!account.active) return 'Paused';
  if (account.needsReconnect) return 'Reconnect LinkedIn to add your company pages';
  return null;
}

/** An account's name, with a word on it when it is paused, gone or wants a reconnect. */
export function AccountNameCell({ account }: Readonly<{ account: Account }>) {
  const t = useT();
  const note = noteOf(account);
  return (
    <Box>
      <Text weight="medium">{account.name}</Text>
      {note && (
        <Text component="p" size="caption" color="text.secondary">
          {t(note)}
        </Text>
      )}
    </Box>
  );
}
