import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ClientHubInvoicePdfDocument,
  useClientHubEmailInvoiceMutation,
  type ClientHubInvoicePdfQuery,
} from '@exyconn/shell/graphql/generated';

/** Download the invoice PDF, or have it emailed to the signed-in contact. */
export function useInvoiceActions() {
  const apollo = useApolloClient();
  const notify = useNotify();
  const [emailInvoice] = useClientHubEmailInvoiceMutation();

  const download = useCallback(
    (invoice: { id: string; number: string }) => {
      apollo
        .query<ClientHubInvoicePdfQuery>({
          query: ClientHubInvoicePdfDocument,
          variables: { id: invoice.id },
          fetchPolicy: 'network-only',
        })
        .then(({ data }) => {
          if (data) {
            downloadBase64File(
              `${invoice.number}.pdf`,
              'application/pdf',
              data.clientHubInvoicePdf,
            );
          }
        })
        .catch((err: unknown) =>
          notify(errorMessage(err, 'Could not download the invoice'), 'error'),
        );
    },
    [apollo, notify],
  );

  const email = useCallback(
    (invoice: { id: string; number: string }) => {
      emailInvoice({ variables: { id: invoice.id } })
        .then(() => notify('Invoice {number} is on its way to your inbox', 'success', invoice))
        .catch((err: unknown) => notify(errorMessage(err, 'Could not email the invoice'), 'error'));
    },
    [emailInvoice, notify],
  );

  return { download, email };
}
