import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { BotContent, ChatMessage } from '@exyconn/wa-flow';
import { MessageView } from '../../../../../src/components/wa/messages/MessageView';
import { PHONE_WIDTH, stubMatchMedia } from '../../../media';
import { option, picture, product, renderMessage } from './messages.fixtures';

const bot = (content: BotContent): ChatMessage => ({ id: 'm1', from: 'bot', at: 0, content });

afterEach(() => {
  vi.unstubAllGlobals();
});

const ticket = { ticketId: 'TKT-1', title: 'Gig pass', fields: [], qrData: 'TKT-1' };
const order = {
  orderId: 'O-1',
  title: 'Cart',
  items: [],
  adjustments: [],
  total: 0,
  status: 'paid' as const,
};
const report = {
  fileName: 'Report.pdf',
  fileType: 'PDF' as const,
  pages: 2,
  sizeKb: 40,
  preview: { title: 'R', sections: [] },
};

describe('MessageView', () => {
  it.each<[string, BotContent, string]>([
    ['text', { type: 'text', text: 'Hello there' }, 'Hello there'],
    [
      'buttons',
      { type: 'buttons', text: 'Pick one', buttons: [option('a', 'Option A')] },
      'Option A',
    ],
    ['list', { type: 'list', text: 'Slots', button: 'See slots', sections: [] }, 'See slots'],
    ['cta', { type: 'cta', text: 'Visit us', actions: [] }, 'Visit us'],
    ['image', { type: 'image', image: picture }, 'Tomorrow, 10 AM'],
    ['document', { type: 'document', document: report }, 'Report.pdf'],
    [
      'location',
      { type: 'location', location: { name: 'Clinic', address: 'MG Road', lat: 1, lng: 2 } },
      'MG Road',
    ],
    ['contact', { type: 'contact', contact: { name: 'Dr. Rao', phone: '+91 1234' } }, 'Dr. Rao'],
    ['product', { type: 'product', product: product() }, 'Hydra facial'],
    [
      'carousel',
      {
        type: 'carousel',
        text: 'Our picks',
        cards: [{ product: product({ title: 'Carousel card' }) }],
      },
      'Carousel card',
    ],
    ['ticket', { type: 'ticket', ticket }, 'Gig pass'],
    ['order', { type: 'order', order }, 'Cart'],
  ])('draws a %s message from the bot', (_type, content, text) => {
    renderMessage(<MessageView message={bot(content)} tail time="10:30 AM" />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getAllByText('10:30 AM').length).toBeGreaterThan(0);
  });

  it('draws a notice in the middle, not as a bubble', () => {
    renderMessage(
      <MessageView
        message={bot({ type: 'system', text: 'Chat cleared' })}
        tail={false}
        time="10:30 AM"
      />,
    );
    expect(screen.getByRole('note')).toHaveTextContent('Chat cleared');
    expect(screen.queryByText('10:30 AM')).not.toBeInTheDocument();
  });

  it("draws the viewer's own message with its ticks", () => {
    const mine: ChatMessage = {
      id: 'u1',
      from: 'user',
      at: 0,
      content: { type: 'text', text: 'Hi' },
      status: 'read',
    };
    renderMessage(<MessageView message={mine} tail={false} time="10:31 AM" />);
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByTitle('Read')).toBeInTheDocument();
  });

  it('draws nothing for a kind of message this screen does not know', () => {
    const unknown = {
      id: 'x',
      from: 'bot',
      at: 0,
      content: { type: 'sticker' },
    } as unknown as ChatMessage;
    const { container } = renderMessage(<MessageView message={unknown} tail time="10:30 AM" />);
    expect(container).not.toHaveTextContent('10:30 AM');
  });

  it('still draws messages on a phone', () => {
    stubMatchMedia(PHONE_WIDTH);
    renderMessage(
      <MessageView message={bot({ type: 'text', text: 'On the phone' })} tail time="10:30 AM" />,
    );
    expect(screen.getByText('On the phone')).toBeInTheDocument();
  });
});
