import type { RenderedOption, RenderedOrder, RenderedProduct } from '@exyconn/wa-flow';
import {
  toPayloads,
  type RenderTools,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.render';
import { option } from './channel.fixtures';

const tools: RenderTools = {
  register: jest.fn((o: RenderedOption) => `id-${o.id}`),
  format: {
    date: (ms) => `D${ms}`,
    time: (ms) => `T${ms}`,
    day: (ms) => `W${ms}`,
    money: (rupees) => `Rs${rupees}`,
  },
  t: (source) => `[${source}]`,
};

const image = { icon: 'business', accent: 'teal' } as const;
const textOf = (payload: Record<string, unknown>) => (payload.text as { body: string }).body;
const bodyOf = (payload: Record<string, unknown>) =>
  (payload.interactive as { body: { text: string } }).body.text;

const product = (overrides: Partial<RenderedProduct> = {}): RenderedProduct => ({
  id: 'p1',
  title: 'Haircut',
  price: 499,
  image,
  ...overrides,
});

describe('toPayloads: mock-up cards as text', () => {
  it('writes an illustration as its title, subtitle and caption', () => {
    const [full] = toPayloads(
      { type: 'image', image: { ...image, title: 'Spa', subtitle: 'Relax' }, caption: 'Book now' },
      tools,
    );
    const [bare] = toPayloads({ type: 'image', image, caption: 'Only a caption' }, tools);

    expect(textOf(full)).toBe('*Spa*\nRelax\nBook now');
    expect(textOf(bare)).toBe('Only a caption');
  });

  it('writes a document as its name, type and translated page count', () => {
    const document = {
      fileName: 'Report.pdf',
      fileType: 'PDF' as const,
      pages: 3,
      sizeKb: 120,
      preview: { title: 'Report', sections: [] },
    };
    const [payload] = toPayloads({ type: 'document', document, caption: 'Your report' }, tools);

    expect(textOf(payload)).toBe('*Report.pdf*\nPDF · 3 [pages]\nYour report');
  });

  it('writes a ticket with its id and every field', () => {
    const ticket = {
      ticketId: 'TCK-9',
      title: 'Concert',
      subtitle: 'Row A',
      fields: [
        { label: 'Seat', value: '12' },
        { label: 'Gate', value: '3' },
      ],
      qrData: 'qr',
    };
    const [payload] = toPayloads({ type: 'ticket', ticket }, tools);

    expect(textOf(payload)).toBe('*Concert*\nRow A\n[Ticket]: TCK-9\nSeat: 12\nGate: 3');
  });
});

describe('toPayloads: native location and contact messages', () => {
  const location = { name: 'Clinic', address: 'MG Road', lat: 12.9, lng: 77.6 };

  it('sends a location pin, then its caption when there is one', () => {
    const pin = {
      type: 'location',
      location: { latitude: 12.9, longitude: 77.6, name: 'Clinic', address: 'MG Road' },
    };

    expect(toPayloads({ type: 'location', location }, tools)).toEqual([pin]);
    const [first, second] = toPayloads({ type: 'location', location, caption: 'See you' }, tools);
    expect(first).toEqual(pin);
    expect(textOf(second)).toBe('See you');
  });

  it('sends a contact card', () => {
    const contact = { name: 'Dr Mehta', phone: '+91 98', role: 'Dentist', organisation: 'Smile' };

    expect(toPayloads({ type: 'contact', contact }, tools)).toEqual([
      {
        type: 'contacts',
        contacts: [
          {
            name: { formatted_name: 'Dr Mehta', first_name: 'Dr Mehta' },
            phones: [{ phone: '+91 98' }],
            org: { company: 'Smile', title: 'Dentist' },
          },
        ],
      },
    ]);
  });
});

describe('toPayloads: products, carousels and orders', () => {
  it('writes a product with its price and struck price, offering its option as a button', () => {
    const shown = product({ subtitle: 'Men', mrp: 699, badge: 'Offer' });
    const [withOption] = toPayloads(
      { type: 'product', product: shown, option: option('buy') },
      tools,
    );
    const [plain] = toPayloads({ type: 'product', product: product() }, tools);

    expect(bodyOf(withOption)).toBe('*Haircut*\nMen\nRs499 (Rs699)\nOffer');
    expect(tools.register).toHaveBeenCalledWith(option('buy'));
    expect(textOf(plain)).toBe('*Haircut*\nRs499');
  });

  it('sends a carousel as its text and then one message per card', () => {
    const payloads = toPayloads(
      {
        type: 'carousel',
        text: 'Our services',
        cards: [
          { product: product() },
          { product: product({ title: 'Shave' }), option: option('s') },
        ],
      },
      tools,
    );

    expect(payloads.map((p) => p.type)).toEqual(['text', 'text', 'interactive']);
    expect(textOf(payloads[0])).toBe('Our services');
    expect(bodyOf(payloads[2])).toBe('*Shave*\nRs499');
  });

  it('sends a carousel without text as its cards alone', () => {
    const payloads = toPayloads({ type: 'carousel', cards: [{ product: product() }] }, tools);
    expect(payloads).toHaveLength(1);
  });

  it('writes an order line by line, with a pay button when it is payable', () => {
    const order: RenderedOrder = {
      orderId: 'ORD-1',
      title: 'Your order',
      items: [{ id: 'i', name: 'Pizza', qty: 2, price: 300 }],
      adjustments: [{ id: 'd', label: 'Delivery', amount: 40 }],
      total: 640,
      status: 'pending',
    };
    const expected = '*Your order* (ORD-1)\n2 × Pizza — Rs600\nDelivery: Rs40\n*[Total]: Rs640*';

    const [payable] = toPayloads({ type: 'order', order, pay: option('pay') }, tools);
    const [paid] = toPayloads({ type: 'order', order: { ...order, status: 'paid' } }, tools);

    expect(bodyOf(payable)).toBe(expected);
    expect(textOf(paid)).toBe(expected);
  });
});
