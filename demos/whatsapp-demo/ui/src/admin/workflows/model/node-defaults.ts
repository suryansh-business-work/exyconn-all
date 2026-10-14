/**
 * The data a node starts with when it is added from the palette. Each one passes its
 * `NODE_SCHEMAS` entry, so a new node never shows up as an error before anyone has typed.
 * The copy is placeholder customer-facing text the author replaces.
 */
import type { NodeOf, NodeType, Product } from '@exyconn/wa-flow';

type DefaultData = { [T in NodeType]: NodeOf<T>['data'] };

const SAMPLE_PRODUCT: Product = {
  id: 'card-1',
  title: 'Product',
  price: 499,
  image: { icon: 'bag', accent: 'teal' },
  buttonTitle: 'Select',
};

const DEFAULTS: Omit<DefaultData, 'jump'> = {
  text: { text: 'Your message here.' },
  notice: { text: 'A notice for the customer.' },
  buttons: {
    text: 'Choose an option.',
    buttons: [
      { id: 'yes', title: 'Yes' },
      { id: 'no', title: 'No' },
    ],
  },
  list: {
    text: 'Pick one of these.',
    button: 'View options',
    sections: [{ id: 'section-1', title: 'Options', rows: [{ id: 'row-1', title: 'Option 1' }] }],
  },
  cta: {
    text: 'Find out more on our website.',
    actions: [{ kind: 'url', title: 'Open website', url: 'https://example.com' }],
  },
  image: { image: { icon: 'info', accent: 'teal', title: 'Image' } },
  document: {
    document: {
      fileName: 'document.pdf',
      fileType: 'PDF',
      pages: 1,
      sizeKb: 120,
      preview: { title: 'Document', sections: [] },
    },
  },
  location: {
    location: { name: 'Our office', address: 'MG Road, Bengaluru', lat: 12.9756, lng: 77.6066 },
  },
  contact: { contact: { name: 'Front desk', phone: '+91 90000 00000' } },
  product: { product: { ...SAMPLE_PRODUCT, id: 'product-1', buttonTitle: undefined } },
  carousel: { text: 'Here is what we have.', cards: [SAMPLE_PRODUCT] },
  ticket: {
    ticket: { ticketId: 'TKT-001', title: 'Your ticket', fields: [], qrData: 'TKT-001' },
  },
  order: {
    order: {
      orderId: 'ORD-001',
      title: 'Your order',
      items: [{ id: 'item-1', name: 'Item', qty: 1, price: 499 }],
      status: 'pending',
      payTitle: 'Pay now',
    },
  },
  input: { prompt: 'Please type your name.', var: 'name', kind: 'name' },
  ai: {
    prompt: 'How can I help you today?',
    intents: [{ id: 'help', description: 'The customer asks for help' }],
    entities: [],
  },
  condition: { cases: [{ id: 'has-value', var: 'name', op: 'notEmpty' }] },
  delay: { ms: 1000 },
  reminder: { afterMs: 60_000, label: 'Reminder' },
  handoff: { agentName: 'Support team', text: 'Hi {{user.firstName}}, I can help with that.' },
  end: { text: 'Anything else?', showMenu: true },
};

/** A fresh copy of a type's default data; a Jump points at the demo's first workflow. */
export function defaultNodeData<T extends NodeType>(
  type: T,
  workflowKeys: readonly string[],
): NodeOf<T>['data'] {
  if (type === 'jump') {
    const jump: NodeOf<'jump'>['data'] = { workflowKey: workflowKeys[0] ?? 'main' };
    return jump as NodeOf<T>['data'];
  }
  return structuredClone(DEFAULTS[type as Exclude<NodeType, 'jump'>]) as NodeOf<T>['data'];
}
