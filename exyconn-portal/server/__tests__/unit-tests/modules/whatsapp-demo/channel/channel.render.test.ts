import type { RenderedOption } from '@exyconn/wa-flow';
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

const textOf = (payload: Record<string, unknown>) => (payload.text as { body: string }).body;

describe('toPayloads: text, notices and choices', () => {
  it('sends text as a plain message without a link preview', () => {
    expect(toPayloads({ type: 'text', text: 'Hello' }, tools)).toEqual([
      { type: 'text', text: { body: 'Hello', preview_url: false } },
    ]);
  });

  it('names the human agent above their message', () => {
    const [payload] = toPayloads({ type: 'text', text: 'On it', sender: 'Priya' }, tools);
    expect(textOf(payload)).toBe('*Priya*\nOn it');
  });

  it('clips a message to the 4096 characters WhatsApp takes', () => {
    const [payload] = toPayloads({ type: 'text', text: 'x'.repeat(5000) }, tools);
    expect(textOf(payload)).toHaveLength(4096);
  });

  it('sends a notice in italics', () => {
    const [payload] = toPayloads({ type: 'system', text: 'Agent joined' }, tools);
    expect(textOf(payload)).toBe('_Agent joined_');
  });

  it('turns too many buttons into a list under the translated "Choose"', () => {
    const buttons = ['a', 'b', 'c', 'd'].map((id) => option(id));
    const [payload] = toPayloads({ type: 'buttons', text: 'Pick', buttons }, tools);
    const body = payload.interactive as { type: string; action: { button: string } };

    expect(body.type).toBe('list');
    expect(body.action.button).toBe('[Choose]');
  });

  it('sends a list as an interactive list', () => {
    const [payload] = toPayloads(
      {
        type: 'list',
        text: 'Days',
        button: 'Open',
        sections: [{ id: 's', title: 'Days', rows: [option('mon')] }],
      },
      tools,
    );
    expect((payload.interactive as { type: string }).type).toBe('list');
  });
});

describe('toPayloads: call-to-action messages', () => {
  it('opens a link with the message text on the first action only', () => {
    const payloads = toPayloads(
      {
        type: 'cta',
        header: 'Visit',
        text: 'See our site',
        footer: 'Thanks',
        actions: [
          { kind: 'url', title: 'Open the website now please', url: 'https://example.com' },
          { kind: 'url', title: 'Docs', url: 'https://example.com/docs' },
        ],
      },
      tools,
    );

    expect(payloads[0]).toEqual({
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: 'Visit\nSee our site\nThanks' },
        action: {
          name: 'cta_url',
          parameters: { display_text: 'Open the website no…', url: 'https://example.com' },
        },
      },
    });
    const second = payloads[1].interactive as { body: { text: string } };
    expect(second.body.text).toBe('Docs');
  });

  it('writes a call action out as text with the number', () => {
    const [payload] = toPayloads(
      {
        type: 'cta',
        text: 'Talk to us',
        actions: [{ kind: 'call', title: 'Call', phone: '+91 98' }],
      },
      tools,
    );
    expect(textOf(payload)).toBe('Talk to us\nCall: +91 98');
  });

  it('writes a calendar action out with its date, time and place', () => {
    const event = { title: 'Consultation', start: 5, durationMin: 30 };
    const [withPlace, withoutPlace] = toPayloads(
      {
        type: 'cta',
        text: 'Booked',
        actions: [
          { kind: 'calendar', title: 'Add', event: { ...event, location: 'Clinic, MG Road' } },
          { kind: 'calendar', title: 'Add', event },
        ],
      },
      tools,
    );

    expect(textOf(withPlace)).toBe('Booked\n*Consultation*\nD5 T5\nClinic, MG Road');
    expect(textOf(withoutPlace)).toBe('*Consultation*\nD5 T5');
  });
});
