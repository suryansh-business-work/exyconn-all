import { useApolloClient } from '@apollo/client/react';
import { Stack } from '@exyconn/shell/components/ui';
import { useCompanyCurrency } from '@exyconn/shell/components/form/rhf';
import {
  PayoutAccountsPanel,
  REFUND_METHODS,
  fetchSecret,
  type PayoutAccountApi,
} from '@exyconn/shell/components/payout';
import {
  ClientHubPayoutSecretDocument,
  useClientHubDeletePayoutAccountMutation,
  useClientHubPayoutAccountsQuery,
  useClientHubSavePayoutAccountMutation,
  type ClientHubPayoutSecretQuery,
  type ClientHubPayoutSecretQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { HubPageHeader } from '../HubPageHeader';

/** Re-read after every change: saving one account may move the default off another. */
const REFETCH = ['ClientHubPayoutAccounts'];

/**
 * Where we send the client's money back: a bank account (by their country's ISO rules — IBAN,
 * SWIFT/BIC, IFSC, ABA, sort code, BSB), UPI, PayPal, Wise, Payoneer or Western Union.
 */
export function RefundAccountsPage() {
  const client = useApolloClient();
  const currency = useCompanyCurrency();
  const list = useClientHubPayoutAccountsQuery({ fetchPolicy: 'cache-and-network' });
  const [save] = useClientHubSavePayoutAccountMutation({ refetchQueries: REFETCH });
  const [remove] = useClientHubDeletePayoutAccountMutation({ refetchQueries: REFETCH });

  const api: PayoutAccountApi = {
    save: (id, input) => save({ variables: { id, input } }),
    reveal: (row, field) =>
      fetchSecret<ClientHubPayoutSecretQuery, ClientHubPayoutSecretQueryVariables>(
        client,
        ClientHubPayoutSecretDocument,
        { id: row.id, field },
        (data) => data.clientHubPayoutSecret,
      ),
  };

  return (
    <Stack spacing={3}>
      <HubPageHeader
        title="Refund accounts"
        subtitle="Where we send money back to you. Account numbers are encrypted and shown masked."
      />
      <PayoutAccountsPanel
        title="Your refund accounts"
        description="Any refund goes to the default account. Add a bank account, UPI, PayPal, Wise, Payoneer or Western Union receiver."
        rows={list.data?.clientHubPayoutAccounts ?? []}
        loading={list.loading}
        error={list.error?.message}
        onRefresh={list.refetch}
        methods={REFUND_METHODS}
        defaultCountry=""
        defaultCurrency={currency}
        api={api}
        editable
        onDelete={(row) => remove({ variables: { id: row.id } })}
      />
    </Stack>
  );
}
