import { describe, expect, it, vi } from 'vitest';
import type {
  BotContent,
  ChatMessage,
  DocumentAttachment,
  Illustration,
  RenderedOrder,
  UserContent,
} from '@exyconn/wa-flow';
import { previewOf } from '../../../../../src/components/wa/list/preview';

/** Translates by tagging the source, so a test can tell translated text from content. */
const t = vi.fn((source: string, values?: Record<string, string | number>) =>
  values ? `T(${source}|${JSON.stringify(values)})` : `T(${source})`,
);

const msg = (content: BotContent | UserContent): ChatMessage => ({
  id: 'm-1',
  from: 'bot',
  at: 0,
  content,
});

const illustration: Illustration = { icon: 'info', accent: 'teal' };
const product = { id: 'p-1', title: 'Shampoo', price: 299, image: illustration };

const TEXT_CONTENT: (BotContent | UserContent)[] = [
  { type: 'text', text: 'Hello' },
  { type: 'buttons', text: 'Hello', buttons: [] },
  { type: 'list', text: 'Hello', button: 'Open', sections: [] },
  { type: 'cta', text: 'Hello', actions: [] },
  { type: 'reply', text: 'Hello', quoted: 'Q' },
  { type: 'system', text: 'Hello' },
];

describe('previewOf', () => {
  it('is empty for a chat without messages', () => {
    expect(previewOf(undefined, t)).toBe('');
  });

  it.each(TEXT_CONTENT)('shows the text of a $type message', (content) => {
    expect(previewOf(msg(content), t)).toBe('Hello');
  });

  it('shows an image caption, or "Photo" without one', () => {
    expect(previewOf(msg({ type: 'image', image: illustration, caption: 'Our lobby' }), t)).toBe(
      'Our lobby',
    );
    expect(previewOf(msg({ type: 'image', image: illustration }), t)).toBe('T(Photo)');
  });

  it('names a document by its file', () => {
    const document: DocumentAttachment = {
      fileName: 'report.pdf',
      fileType: 'PDF',
      pages: 1,
      sizeKb: 10,
      preview: { title: 'Report', sections: [] },
    };
    expect(previewOf(msg({ type: 'document', document }), t)).toBe('report.pdf');
  });

  it('labels a location and a contact', () => {
    const location = { name: 'HQ', address: 'MG Road', lat: 1, lng: 2 };
    expect(previewOf(msg({ type: 'location', location }), t)).toBe(
      'T(Location: {name}|{"name":"HQ"})',
    );
    const contact = { name: 'Asha', phone: '+91 90000 00000' };
    expect(previewOf(msg({ type: 'contact', contact }), t)).toBe(
      'T(Contact: {name}|{"name":"Asha"})',
    );
  });

  it('names a product, and a carousel by its text or "Catalogue"', () => {
    expect(previewOf(msg({ type: 'product', product }), t)).toBe('Shampoo');
    expect(previewOf(msg({ type: 'carousel', text: 'Our range', cards: [{ product }] }), t)).toBe(
      'Our range',
    );
    expect(previewOf(msg({ type: 'carousel', cards: [{ product }] }), t)).toBe('T(Catalogue)');
  });

  it('labels a ticket by id and an order by its title', () => {
    const ticket = { ticketId: 'TKT-9', title: 'Pass', fields: [], qrData: 'TKT-9' };
    expect(previewOf(msg({ type: 'ticket', ticket }), t)).toBe('T(Ticket {id}|{"id":"TKT-9"})');
    const order: RenderedOrder = {
      orderId: 'O-1',
      title: 'Your order',
      items: [],
      adjustments: [],
      total: 0,
      status: 'paid',
    };
    expect(previewOf(msg({ type: 'order', order }), t)).toBe('Your order');
  });
});
