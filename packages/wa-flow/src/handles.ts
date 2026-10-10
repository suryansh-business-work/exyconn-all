/**
 * Which outputs a node has. The editor draws one handle per output, the validator checks
 * each interactive output is wired, and the engine follows the edge leaving the one taken.
 */
import type { WaNode } from './schema';

export interface OutputHandle {
  id: string;
  label: string;
  /** The customer picks it (a button, row, card) — so leaving it unwired is a dead button. */
  interactive: boolean;
}

/** Fixed handle ids. Option handles use the option's own id. */
export const HANDLE = {
  next: 'next',
  later: 'later',
  pay: 'pay',
  else: 'else',
  fallback: 'fallback',
  pick: 'pick',
} as const;

const next = (label = 'Next'): OutputHandle => ({ id: HANDLE.next, label, interactive: false });

function interactiveHandles(node: WaNode): OutputHandle[] | undefined {
  switch (node.type) {
    case 'buttons':
      return node.data.buttons.map((b) => ({ id: b.id, label: b.title, interactive: true }));
    case 'list': {
      const rows = node.data.sections.flatMap((s) =>
        s.rows.map((r) => ({ id: r.id, label: r.title, interactive: true })),
      );
      return node.data.dynamic
        ? [{ id: HANDLE.pick, label: 'Any row', interactive: true }, ...rows]
        : rows;
    }
    case 'carousel':
      return node.data.cards.flatMap((c) =>
        c.buttonTitle ? [{ id: c.id, label: c.buttonTitle, interactive: true }] : [],
      );
    case 'product':
      return node.data.product.buttonTitle
        ? [{ id: node.data.product.id, label: node.data.product.buttonTitle, interactive: true }]
        : [next()];
    case 'order':
      return node.data.order.status === 'pending' && node.data.order.payTitle
        ? [{ id: HANDLE.pay, label: node.data.order.payTitle, interactive: true }]
        : [next()];
    default:
      return undefined;
  }
}

/** Every output of a node, in display order. */
export function outputHandles(node: WaNode): OutputHandle[] {
  const interactive = interactiveHandles(node);
  if (interactive) {
    return interactive;
  }
  switch (node.type) {
    case 'input':
      return [next('Valid answer')];
    case 'ai':
      return [
        ...node.data.intents.map((i) => ({ id: i.id, label: i.id, interactive: false })),
        { id: HANDLE.fallback, label: 'Not understood', interactive: false },
      ];
    case 'condition':
      return [
        ...node.data.cases.map((c) => ({ id: c.id, label: c.id, interactive: false })),
        { id: HANDLE.else, label: 'Otherwise', interactive: false },
      ];
    case 'reminder':
      return [next('Now'), { id: HANDLE.later, label: 'When due', interactive: false }];
    case 'jump':
    case 'end':
      return [];
    default:
      return [next()];
  }
}

/** Nodes that stop and wait for the customer. */
export function waitsForCustomer(node: WaNode): boolean {
  if (node.type === 'input' || node.type === 'ai') {
    return true;
  }
  return interactiveHandles(node)?.some((h) => h.interactive) ?? false;
}
