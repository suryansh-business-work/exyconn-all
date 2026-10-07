import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReceiveOrderForm } from '../../../../src/pages/purchase-orders/ReceiveOrderForm';
import type { PurchaseOrderRow } from '../../../../src/pages/purchase-orders/forms/purchase-order';
import { renderWithProviders } from '../../test-utils';
import { orderLine, purchaseOrderRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ receive: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useReceivePurchaseOrderMutation: () => [gql.receive, { loading: gql.loading }],
}));

/** Ten ordered with four in, five ordered and all in, two ordered and three (over-)delivered. */
const order = purchaseOrderRow({
  id: 'po-7',
  number: 'PO-0007',
  lines: [
    orderLine({ productId: 'p-a', productName: 'Widget', quantity: 10, receivedQuantity: 4 }),
    orderLine({ productId: 'p-b', productName: 'Gadget', quantity: 5, receivedQuantity: 5 }),
    orderLine({ productId: 'p-c', productName: 'Sprocket', quantity: 2, receivedQuantity: 3 }),
  ],
});

function renderForm(target: PurchaseOrderRow = order) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <ReceiveOrderForm order={target} onDone={onDone} onCancel={onCancel} />,
  );
  return { ...view, onDone, onCancel };
}

const arriving = () => screen.getAllByLabelText('Arriving now');
const setArriving = (index: number, value: string) =>
  fireEvent.change(arriving()[index], { target: { value } });
const bookIn = () => userEvent.click(screen.getByRole('button', { name: 'Book in' }));

describe('ReceiveOrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = false;
    gql.receive.mockResolvedValue({ data: { receivePurchaseOrder: { id: 'po-7' } } });
  });

  it('says what each line still owes and pre-fills what is outstanding', () => {
    renderForm();

    expect(screen.getByText(/What arrived against PO-0007\?/)).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('4 of 10 received')).toBeInTheDocument();
    expect(screen.getByText('3 of 2 received')).toBeInTheDocument();
    expect(arriving().map((input) => (input as HTMLInputElement).value)).toEqual(['6', '0', '0']);
  });

  it('books in only the lines with something arriving, then reports and closes', async () => {
    const { onDone } = renderForm();

    await bookIn();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.receive).toHaveBeenCalledWith({
      variables: { id: 'po-7', lines: [{ productId: 'p-a', quantity: 6 }] },
    });
    expect(await screen.findByText('Stock booked in against PO-0007.')).toBeInTheDocument();
  });

  it('books in what was typed for a part delivery', async () => {
    renderForm();
    setArriving(0, '2');
    setArriving(1, '3');

    await bookIn();

    await waitFor(() => expect(gql.receive).toHaveBeenCalledTimes(1));
    expect(gql.receive.mock.calls[0][0].variables.lines).toEqual([
      { productId: 'p-a', quantity: 2 },
      { productId: 'p-b', quantity: 3 },
    ]);
  });

  it('never takes a negative or blank quantity', () => {
    renderForm();

    setArriving(0, '-4');
    expect(arriving()[0]).toHaveValue(0);
    setArriving(1, '');
    expect(arriving()[1]).toHaveValue(0);
  });

  it('refuses to book in nothing', async () => {
    const { onDone } = renderForm();
    setArriving(0, '0');

    await bookIn();

    expect(await screen.findByText('Enter what arrived before booking it in.')).toBeInTheDocument();
    expect(gql.receive).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('shows the server’s reason when booking in fails', async () => {
    gql.receive.mockRejectedValueOnce(new Error('PO-0007 is cancelled'));
    const { onDone } = renderForm();

    await bookIn();

    expect(await screen.findByText('PO-0007 is cancelled')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.receive.mockRejectedValueOnce('offline');
    renderForm();

    await bookIn();

    expect(await screen.findByText('Could not book the stock in')).toBeInTheDocument();
  });

  it('treats a line added to the order after opening as nothing arriving yet', async () => {
    const { rerender, onDone, onCancel } = renderForm();
    const grown = {
      ...order,
      lines: [...order.lines, orderLine({ productId: 'p-d', productName: 'Bolt', quantity: 9 })],
    };

    rerender(<ReceiveOrderForm order={grown} onDone={onDone} onCancel={onCancel} />);
    expect(arriving()[3]).toHaveValue(0);
    await bookIn();

    await waitFor(() => expect(gql.receive).toHaveBeenCalledTimes(1));
    expect(gql.receive.mock.calls[0][0].variables.lines).toEqual([
      { productId: 'p-a', quantity: 6 },
    ]);
  });

  it('disables booking in while a booking is in flight', () => {
    gql.loading = true;
    renderForm();

    expect(screen.getByRole('button', { name: 'Book in' })).toBeDisabled();
  });

  it('cancels without booking anything in', async () => {
    const { onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.receive).not.toHaveBeenCalled();
  });
});
