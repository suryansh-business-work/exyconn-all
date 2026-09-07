import { useCallback } from 'react';
import { useInvoicePdfLazyQuery } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { downloadBase64File } from '@exyconn/shell/utils/file';

/**
 * Downloads one invoice as a PDF, through the same authenticated GraphQL call the rest of
 * the portal uses. The server renders the same document `sendInvoice` attaches.
 */
export function useInvoiceDownload() {
  const notify = useNotify();
  const [fetchPdf, { loading }] = useInvoicePdfLazyQuery({ fetchPolicy: 'network-only' });

  const download = useCallback(
    async (invoiceId: string, number: string) => {
      try {
        const { data, error } = await fetchPdf({ variables: { id: invoiceId } });
        if (error ?? !data) {
          throw error ?? new Error('The invoice could not be generated.');
        }
        downloadBase64File(`Invoice-${number}.pdf`, 'application/pdf', data.invoicePdf);
      } catch (error) {
        notify(errorMessage(error, 'Could not download the invoice'), 'error');
      }
    },
    [fetchPdf, notify],
  );

  return { download, downloading: loading };
}
