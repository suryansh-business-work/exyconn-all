import { describe, expect, it } from 'vitest';
import type { Product } from '../../../src/schema';
import { render } from './render-fixtures';

const card = (id: string, extra: Partial<Product> = {}): Product => ({
  id,
  title: `Card ${id}`,
  price: '{{fee}}',
  image: { icon: 'gift', accent: 'teal', subtitle: undefined },
  ...extra,
});

describe('renderNode — commerce', () => {
  it('renders a product with a button and resolved prices', () => {
    const [content] = render({
      id: 'p',
      type: 'product',
      data: {
        product: card('a', {
          mrp: 500,
          badge: 'Hot',
          subtitle: 'Sub',
          buttonTitle: 'Buy',
          set: { sku: 'a' },
        }),
      },
    });
    expect(content).toEqual({
      type: 'product',
      product: {
        id: 'a',
        title: '~Card a',
        subtitle: '~Sub',
        price: 400,
        mrp: 500,
        badge: '~Hot',
        image: { icon: 'gift', accent: 'teal', subtitle: undefined },
      },
      option: {
        id: 'a',
        title: '~Buy',
        description: undefined,
        set: { sku: 'a' },
        ref: { workflow: 'wf', node: 'p', handle: 'a' },
      },
    });
  });

  it('renders a product without a button and without an MRP', () => {
    const [content] = render({ id: 'p', type: 'product', data: { product: card('a') } });
    expect(content).toMatchObject({
      option: undefined,
      product: { mrp: undefined, badge: undefined },
    });
  });

  it('renders carousel cards, only those with a button get an option', () => {
    const [content] = render({
      id: 'c',
      type: 'carousel',
      data: { text: 'Pick', cards: [card('a', { buttonTitle: 'Buy' }), card('b')] },
    });
    expect(content).toMatchObject({
      type: 'carousel',
      text: '~Pick',
      cards: [{ option: { ref: { handle: 'a' } } }, { option: undefined }],
    });
    const [bare] = render({ id: 'c', type: 'carousel', data: { cards: [card('b')] } });
    expect(bare).toMatchObject({ text: undefined });
  });

  it('totals an order with adjustments and offers pay while pending', () => {
    const order = (status: 'pending' | 'paid', withExtras: boolean) =>
      render({
        id: 'o',
        type: 'order',
        data: {
          order: {
            orderId: 'OD-{{fee}}',
            title: 'Your order',
            items: [{ id: 'i', name: 'Thing', qty: 2, price: '{{fee}}' }],
            adjustments: withExtras ? [{ id: 'gst', label: 'GST', amount: 72 }] : undefined,
            status,
            payTitle: 'Pay',
          },
        },
      })[0];
    const pending = order('pending', true);
    expect(pending).toMatchObject({
      type: 'order',
      order: {
        orderId: 'OD-400',
        title: '~Your order',
        items: [{ id: 'i', name: '~Thing', qty: 2, price: 400 }],
        adjustments: [{ id: 'gst', label: '~GST', amount: 72 }],
        total: 872,
        status: 'pending',
      },
      pay: { id: 'pay', title: '~Pay', ref: { handle: 'pay' } },
    });
    expect(order('paid', false)).toMatchObject({
      order: { adjustments: [], total: 800 },
      pay: undefined,
    });
  });
});
