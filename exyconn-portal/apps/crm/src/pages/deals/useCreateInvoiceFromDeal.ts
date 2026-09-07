import { useCallback } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrossAppNavigate } from '@exyconn/shell/hooks/useCrossAppNavigate';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCreateInvoiceFromDealMutation } from '@exyconn/shell/graphql/generated';

/** What the row action needs to know about the deal it bills. */
interface BillableDeal {
  id: string;
  title: string;
}

/**
 * Drafts the invoice for a won deal and takes the user to it in Finance. The server
 * refuses a deal that is not won, has no client or is already billed, and says which.
 */
export function useCreateInvoiceFromDeal() {
  const notify = useNotify();
  const navigate = useCrossAppNavigate();
  const [createInvoice] = useCreateInvoiceFromDealMutation();

  return useCallback(
    async (deal: BillableDeal) => {
      try {
        const { data } = await createInvoice({ variables: { dealId: deal.id } });
        const number = data?.createInvoiceFromDeal.number ?? '';
        notify(`Invoice ${number} drafted for "${deal.title}"`);
        navigate('finance', '/finance/invoices');
      } catch (error) {
        notify(errorMessage(error, 'Could not create the invoice'), 'error');
      }
    },
    [createInvoice, navigate, notify],
  );
}
