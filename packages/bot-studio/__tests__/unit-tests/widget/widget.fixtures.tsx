import type { ReactElement } from 'react';
import { vi } from 'vitest';
import type {
  ChatMessage,
  DemoProfile,
  DocumentAttachment,
  RenderedOption,
  RenderedOrder,
  RenderedProduct,
} from '@exyconn/wa-flow';
import { WidgetActionsProvider, type WidgetActions } from '../../../src/widget/WidgetActions';
import { renderWithProviders } from '../test-utils';

/** A business look with distinct values, so a test can tell fill, ink and text apart. */
export const LOOK = { fill: '#06a88a', onFill: '#111111', text: '#047a64' } as const;

/** Spies for every widget action, with the fixed look. */
export function widgetActions(): WidgetActions {
  return { choose: vi.fn(), openDocument: vi.fn(), followAction: vi.fn(), look: LOOK };
}

/** Renders a widget part inside the portal providers and a ChatWidget's action context. */
export function renderPart(ui: ReactElement, actions: WidgetActions = widgetActions()) {
  const view = renderWithProviders(
    <WidgetActionsProvider value={actions}>{ui}</WidgetActionsProvider>,
  );
  return { ...view, actions };
}

export function option(id: string, title = id): RenderedOption {
  return { id, title, ref: { workflow: 'shop', node: 'pick', handle: id } };
}

export function product(overrides: Partial<RenderedProduct> = {}): RenderedProduct {
  return {
    id: 'p-1',
    title: 'Running shoes',
    price: 2499,
    image: { icon: 'bag', accent: 'teal' },
    ...overrides,
  };
}

export function order(overrides: Partial<RenderedOrder> = {}): RenderedOrder {
  return {
    orderId: 'ORD-7',
    title: 'Your order',
    items: [{ id: 'i-1', name: 'Shoes', qty: 2, price: 1000 }],
    adjustments: [{ id: 'a-1', label: 'Delivery', amount: 50 }],
    total: 2050,
    status: 'pending',
    ...overrides,
  };
}

export function documentAttachment(
  preview: Partial<DocumentAttachment['preview']> = {},
): DocumentAttachment {
  return {
    fileName: 'estimate.pdf',
    fileType: 'PDF',
    pages: 2,
    sizeKb: 120,
    preview: { title: 'Repair estimate', sections: [], ...preview },
  };
}

export function botSays(content: ChatMessage['content'], id = 'm-1'): ChatMessage {
  return { id, from: 'bot', at: 0, content };
}

/** A demo profile with what the widget reads: key, business and menu text. */
export function demoProfile(): DemoProfile {
  return {
    key: 'shop',
    menuText: 'How can we help?',
    business: { name: 'Green Grocer', icon: 'bag', accent: 'teal' },
  } as DemoProfile;
}
