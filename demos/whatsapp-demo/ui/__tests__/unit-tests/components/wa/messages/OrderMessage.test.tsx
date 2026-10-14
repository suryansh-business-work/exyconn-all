import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { RenderedOrder } from '@exyconn/wa-flow';
import { OrderMessage } from '../../../../../src/components/wa/messages/OrderMessage';
import { frame, option, renderMessage } from './messages.fixtures';

function order(status: RenderedOrder['status']): RenderedOrder {
  return {
    orderId: 'ORD-1042',
    title: 'Spa booking',
    items: [
      { id: 'i-1', name: 'Facial', qty: 2, price: 800 },
      { id: 'i-2', name: 'Tip', qty: 1, price: 100 },
    ],
    adjustments: [{ id: 'a-1', label: 'Member discount', amount: -200 }],
    total: 1500,
    status,
  };
}

describe('OrderMessage', () => {
  it('lists the lines with quantities, the adjustments and the total', () => {
    renderMessage(
      <OrderMessage content={{ type: 'order', order: order('pending') }} frame={frame} />,
    );
    expect(screen.getByText('Spa booking')).toBeInTheDocument();
    expect(screen.getByText('Order ORD-1042')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Facial × 2₹1,600',
      'Tip₹100',
      'Member discount-₹200',
    ]);
    expect(screen.getByText('Total').parentElement).toHaveTextContent('Total₹1,500');
  });

  it('shows a pending order with a pay button that answers with the order', async () => {
    const pay = option('pay', 'Pay ₹1,500');
    const { actions, user } = renderMessage(
      <OrderMessage content={{ type: 'order', order: order('pending'), pay }} frame={frame} />,
    );
    expect(screen.getByText('Payment pending')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pay ₹1,500' }));
    expect(actions.choose).toHaveBeenCalledWith(pay, 'Spa booking');
  });

  it('marks a paid order paid, with nothing left to pay', () => {
    renderMessage(<OrderMessage content={{ type: 'order', order: order('paid') }} frame={frame} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.queryByText('Payment pending')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
