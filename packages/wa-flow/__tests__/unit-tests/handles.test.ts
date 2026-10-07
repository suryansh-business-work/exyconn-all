import { describe, expect, it } from 'vitest';
import { HANDLE, outputHandles, waitsForCustomer } from '../../src/handles';
import type { Product, WaNode } from '../../src/schema';

const at = { x: 0, y: 0 };
const node = (n: Omit<WaNode, 'position'>): WaNode => ({ ...n, position: at }) as WaNode;
const card = (id: string, buttonTitle?: string): Product => ({
  id,
  title: `${id} title`,
  price: 100,
  image: { icon: 'gift', accent: 'teal' },
  buttonTitle,
});
const ids = (n: WaNode) => outputHandles(n).map((h) => h.id);

describe('outputHandles', () => {
  it('gives one interactive handle per button', () => {
    const n = node({
      id: 'b',
      type: 'buttons',
      data: { text: 'Pick', buttons: [{ id: 'yes', title: 'Yes' }] },
    });
    expect(outputHandles(n)).toEqual([{ id: 'yes', label: 'Yes', interactive: true }]);
    expect(waitsForCustomer(n)).toBe(true);
  });

  it('lists every row, and adds "Any row" first for a dynamic list', () => {
    const sections = [
      { id: 's', title: 'S', rows: [{ id: 'r1', title: 'Row 1' }] },
      { id: 't', title: 'T', rows: [{ id: 'r2', title: 'Row 2' }] },
    ];
    const plain = node({ id: 'l', type: 'list', data: { text: 'x', button: 'Go', sections } });
    expect(ids(plain)).toEqual(['r1', 'r2']);
    const dynamic = node({
      id: 'l',
      type: 'list',
      data: { text: 'x', button: 'Go', sections, dynamic: { kind: 'days', count: 3, var: 'd' } },
    });
    expect(outputHandles(dynamic)[0]).toEqual({
      id: HANDLE.pick,
      label: 'Any row',
      interactive: true,
    });
    expect(ids(dynamic)).toEqual(['pick', 'r1', 'r2']);
  });

  it('only gives carousel cards with a button an output', () => {
    const n = node({
      id: 'c',
      type: 'carousel',
      data: { cards: [card('a', 'Buy'), card('b')] },
    });
    expect(outputHandles(n)).toEqual([{ id: 'a', label: 'Buy', interactive: true }]);
    const silent = node({ id: 'c', type: 'carousel', data: { cards: [card('b')] } });
    expect(outputHandles(silent)).toEqual([]);
    expect(waitsForCustomer(silent)).toBe(false);
  });

  it('makes a product a button when it has a button title, else plain next', () => {
    const buy = node({ id: 'p', type: 'product', data: { product: card('sku', 'Add') } });
    expect(outputHandles(buy)).toEqual([{ id: 'sku', label: 'Add', interactive: true }]);
    const show = node({ id: 'p', type: 'product', data: { product: card('sku') } });
    expect(outputHandles(show)).toEqual([{ id: 'next', label: 'Next', interactive: false }]);
    expect(waitsForCustomer(show)).toBe(false);
  });

  it('gives a pending order with a pay title a pay button only', () => {
    const order = (status: 'pending' | 'paid', payTitle?: string) =>
      node({
        id: 'o',
        type: 'order',
        data: {
          order: {
            orderId: 'O-1',
            title: 'Order',
            items: [{ id: 'i', name: 'Thing', qty: 1, price: 10 }],
            status,
            payTitle,
          },
        },
      });
    expect(ids(order('pending', 'Pay now'))).toEqual(['pay']);
    expect(ids(order('pending'))).toEqual(['next']);
    expect(ids(order('paid', 'Pay now'))).toEqual(['next']);
  });

  it('labels the outputs of input, ai, condition and reminder nodes', () => {
    const input = node({ id: 'i', type: 'input', data: { var: 'v', kind: 'name' } });
    expect(outputHandles(input)).toEqual([
      { id: 'next', label: 'Valid answer', interactive: false },
    ]);
    const ai = node({
      id: 'a',
      type: 'ai',
      data: { intents: [{ id: 'book', description: 'Book' }], entities: [] },
    });
    expect(ids(ai)).toEqual(['book', 'fallback']);
    const condition = node({
      id: 'c',
      type: 'condition',
      data: { cases: [{ id: 'yes', var: 'v', op: 'eq', value: '1' }] },
    });
    expect(outputHandles(condition)[1]).toEqual({
      id: 'else',
      label: 'Otherwise',
      interactive: false,
    });
    const reminder = node({ id: 'r', type: 'reminder', data: { afterMs: 5000 } });
    expect(outputHandles(reminder).map((h) => h.label)).toEqual(['Now', 'When due']);
  });

  it('gives jump and end nodes no outputs and every other node next', () => {
    expect(outputHandles(node({ id: 'j', type: 'jump', data: { workflowKey: 'x' } }))).toEqual([]);
    expect(outputHandles(node({ id: 'e', type: 'end', data: { showMenu: false } }))).toEqual([]);
    expect(ids(node({ id: 't', type: 'text', data: { text: 'Hi' } }))).toEqual(['next']);
  });
});

describe('waitsForCustomer', () => {
  it('waits on input and ai nodes but not on plain messages', () => {
    expect(
      waitsForCustomer(node({ id: 'i', type: 'input', data: { var: 'v', kind: 'text' } })),
    ).toBe(true);
    expect(
      waitsForCustomer(node({ id: 'a', type: 'ai', data: { intents: [], entities: [] } })),
    ).toBe(true);
    expect(waitsForCustomer(node({ id: 't', type: 'text', data: { text: 'Hi' } }))).toBe(false);
  });
});
