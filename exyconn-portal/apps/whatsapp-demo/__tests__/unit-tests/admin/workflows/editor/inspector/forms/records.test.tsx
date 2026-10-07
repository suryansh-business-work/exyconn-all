import { screen } from '@testing-library/react';
import { applyForm, makeNode, pickOption, renderNodeForm, replaceText } from '../node-form-helpers';

const textbox = (name: string) => screen.getByRole('textbox', { name });
const ITEM = { id: 'item-1', name: 'Item', qty: 1, price: 499 };

describe('Order form', () => {
  it('adds items and adjustments and marks the order paid', async () => {
    const { user, onApply } = renderNodeForm(makeNode('order'));
    expect(screen.getByRole('button', { name: 'Remove Item 1' })).toBeDisabled();
    await pickOption(user, 'Status', 'paid');
    await user.clear(textbox('Pay button'));
    const [addItem, addAdjustment] = screen.getAllByRole('button', { name: 'Add' });
    await user.click(addItem);
    expect(screen.getAllByRole('textbox', { name: 'Id' })[1]).toHaveValue('item-2');
    await user.type(screen.getAllByRole('textbox', { name: 'Item' })[1], 'Consultation');
    await replaceText(
      user,
      screen.getAllByRole('textbox', { name: 'Unit price (₹)' })[1],
      '{{fee}}',
    );
    await user.click(addAdjustment);
    await user.type(textbox('Label'), 'Discount');
    await replaceText(user, textbox('Amount (₹)'), '-50');
    expect(await applyForm(user, onApply)).toEqual({
      order: {
        orderId: 'ORD-001',
        title: 'Your order',
        status: 'paid',
        items: [ITEM, { id: 'item-2', name: 'Consultation', qty: 1, price: '{{fee}}' }],
        adjustments: [{ id: 'adjustment-1', label: 'Discount', amount: -50 }],
      },
    });
  });

  it('needs at least one of each item', async () => {
    const { user, onApply } = renderNodeForm(makeNode('order'));
    const qty = screen.getByRole('spinbutton', { name: 'Quantity' });
    await user.clear(qty);
    await user.type(qty, '0');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Too small')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe('Ticket form', () => {
  it('prints fields on the ticket', async () => {
    const { user, onApply } = renderNodeForm(makeNode('ticket'));
    expect(screen.getByText('(0/8)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await user.type(textbox('Label'), 'Seat');
    await user.type(textbox('Value'), '12A');
    await user.type(textbox('Subtitle'), 'Gate 3');
    await user.type(textbox('Caption'), 'Show this at the door');
    expect(await applyForm(user, onApply)).toEqual({
      ticket: {
        ticketId: 'TKT-001',
        title: 'Your ticket',
        subtitle: 'Gate 3',
        fields: [{ label: 'Seat', value: '12A' }],
        qrData: 'TKT-001',
      },
      caption: 'Show this at the door',
    });
  });

  it('needs something to put in the QR code', async () => {
    const { user, onApply } = renderNodeForm(makeNode('ticket'));
    await user.clear(textbox('QR code content'));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('This is required')).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });
});
