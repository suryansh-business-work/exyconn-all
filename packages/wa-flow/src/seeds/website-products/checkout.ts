/**
 * The checkout every buying path ends in: an order for the product in the `p*` variables
 * (pending, with a pay button) → paid → delivery date and a track-order link → end.
 * Each workflow gets its own copy, with node ids under `prefix`.
 */
import type { AuthorNode } from '../../author';
import type { OrderDef } from '../../schema';
import { BRAND } from './data';

type Adjustment = NonNullable<OrderDef['adjustments']>[number];

const ITEMS: OrderDef['items'] = [{ id: 'item', name: '{{pName}}', qty: 1, price: '{{pPrice}}' }];
const DELIVERY: Adjustment = { id: 'delivery', label: 'Free express delivery', amount: 0 };

export function checkoutNodes(prefix: string, extra: readonly Adjustment[] = []): AuthorNode[] {
  const adjustments = [DELIVERY, ...extra];
  return [
    {
      id: `${prefix}-cart`,
      type: 'order',
      data: {
        set: { orderNo: '$id:LH' },
        order: {
          orderId: '{{orderNo}}',
          title: 'Your Lumio order',
          items: ITEMS,
          adjustments,
          status: 'pending',
          payTitle: 'Pay securely',
        },
      },
      next: { pay: `${prefix}-paid` },
    },
    {
      id: `${prefix}-paid`,
      type: 'order',
      data: {
        set: { eta: '$days:2' },
        order: {
          orderId: '{{orderNo}}',
          title: 'Payment received',
          items: ITEMS,
          adjustments,
          status: 'paid',
        },
      },
      next: `${prefix}-track`,
    },
    {
      id: `${prefix}-track`,
      type: 'cta',
      data: {
        complete: true,
        text: 'Thank you, {{user.firstName}}! Order {{orderNo}} ships today and arrives by *{{eta|day}}*. It comes with a 1-year warranty and free setup help.',
        actions: [{ kind: 'url', title: 'Track order', url: BRAND.track }],
      },
      next: `${prefix}-end`,
    },
    {
      id: `${prefix}-end`,
      type: 'end',
      data: { text: 'Anything else I can help you find?', showMenu: true },
    },
  ];
}
