import { useApolloClient } from '@apollo/client/react';
import {
  PayoutAccountsPanel,
  REFUND_METHODS,
  type PayoutAccountApi,
} from '@exyconn/shell/components/payout';
import {
  ClientPayoutSecretDocument,
  useClientPayoutAccountsQuery,
  type ClientPayoutSecretQuery,
} from '@exyconn/shell/graphql/generated';

/**
 * The refund accounts the client entered in their hub. Read-only here — the client owns them —
 * with each sealed detail shown in full on request (logged), for whoever sends the refund.
 */
export function RefundAccountsTab({ clientId }: Readonly<{ clientId: string }>) {
  const client = useApolloClient();
  const list = useClientPayoutAccountsQuery({
    variables: { clientId },
    fetchPolicy: 'cache-and-network',
  });

  const api: PayoutAccountApi = {
    save: () => Promise.reject(new Error('Refund accounts are managed by the client.')),
    reveal: async (row, field) => {
      const { data } = await client.query<ClientPayoutSecretQuery>({
        query: ClientPayoutSecretDocument,
        variables: { clientId, id: row.id, field },
        fetchPolicy: 'no-cache',
      });
      return data?.clientPayoutSecret ?? '';
    },
  };

  return (
    <PayoutAccountsPanel
      title="Refund accounts"
      description="Added by the client in the client hub. Refunds go to the default account."
      rows={list.data?.clientPayoutAccounts ?? []}
      loading={list.loading}
      error={list.error?.message}
      onRefresh={list.refetch}
      methods={REFUND_METHODS}
      defaultCountry=""
      defaultCurrency=""
      api={api}
      editable={false}
    />
  );
}
