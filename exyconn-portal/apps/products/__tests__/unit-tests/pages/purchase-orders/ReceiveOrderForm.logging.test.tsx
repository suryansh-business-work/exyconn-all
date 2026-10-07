import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiveOrderForm } from '../../../../src/pages/purchase-orders/ReceiveOrderForm';
import { renderWithProviders } from '../../test-utils';
import { orderLine, purchaseOrderRow } from '../../fixtures';

const notifyFailure = vi.hoisted(() => new Error('Snackbar unavailable'));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useReceivePurchaseOrderMutation: () => [vi.fn(), { loading: false }],
}));

/** A notifier that itself fails, so the error escapes the form's own handling. */
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => () => {
    throw notifyFailure;
  },
}));

describe('ReceiveOrderForm when reporting fails', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the failure instead of leaving an unhandled rejection', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const order = purchaseOrderRow({ lines: [orderLine({ quantity: 3, receivedQuantity: 3 })] });
    renderWithProviders(<ReceiveOrderForm order={order} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Book in' }));

    await waitFor(() => expect(log).toHaveBeenCalledWith('Receive failed', notifyFailure));
  });
});
