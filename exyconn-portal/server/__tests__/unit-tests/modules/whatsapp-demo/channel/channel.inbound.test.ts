import { inboundMessages } from '../../../../../src/modules/whatsapp-demo/channel/channel.inbound';

const PHONE_ID = '1098765';

/** Meta's webhook body around one `messages` change. */
function delivery(value: Record<string, unknown>, field = 'messages') {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field, value }] }] };
}

function withMessages(messages: unknown[], contacts: unknown[] = []) {
  return delivery({ metadata: { phone_number_id: PHONE_ID }, contacts, messages });
}

describe('inboundMessages', () => {
  it('reads a text message with the sender profile name', () => {
    const body = withMessages(
      [{ id: 'wamid.1', from: '919800000001', type: 'text', text: { body: 'Hi there' } }],
      [{ wa_id: '919800000001', profile: { name: 'Asha' } }],
    );

    expect(inboundMessages(body)).toEqual([
      {
        phoneNumberId: PHONE_ID,
        messageId: 'wamid.1',
        waId: '919800000001',
        name: 'Asha',
        input: { kind: 'text', text: 'Hi there' },
      },
    ]);
  });

  it('leaves the name blank when no contact matches the sender', () => {
    const body = withMessages(
      [{ id: 'wamid.1', from: '911', text: { body: 'hello' } }],
      [{ wa_id: '922', profile: { name: 'Someone else' } }],
    );

    expect(inboundMessages(body)[0].name).toBe('');
  });

  it('turns a tapped reply button or list row into its id', () => {
    const body = withMessages([
      { id: 'a', from: '911', type: 'interactive', interactive: { button_reply: { id: 'o-btn' } } },
      { id: 'b', from: '911', type: 'interactive', interactive: { list_reply: { id: 'o-row' } } },
    ]);

    expect(inboundMessages(body).map((m) => m.input)).toEqual([
      { kind: 'reply', id: 'o-btn' },
      { kind: 'reply', id: 'o-row' },
    ]);
  });

  it('reads a template quick-reply button as the text it shows', () => {
    const body = withMessages([{ id: 'a', from: '911', type: 'button', button: { text: 'Yes' } }]);

    expect(inboundMessages(body)[0].input).toEqual({ kind: 'text', text: 'Yes' });
  });

  it('answers a photo, a sticker or blank text with the menu', () => {
    const body = withMessages([
      { id: 'a', from: '911', type: 'image' },
      { id: 'b', from: '911', type: 'text', text: { body: '   ' } },
      { id: 'c', from: '911', type: 'interactive', interactive: {} },
    ]);

    expect(inboundMessages(body).map((m) => m.input)).toEqual([
      { kind: 'text', text: 'menu' },
      { kind: 'text', text: 'menu' },
      { kind: 'text', text: 'menu' },
    ]);
  });

  it('skips a message without an id or a sender', () => {
    const body = withMessages([
      { from: '911', text: { body: 'no id' } },
      { id: 'x', text: { body: 'no sender' } },
      { id: 'y', from: '912', text: { body: 'kept' } },
    ]);

    expect(inboundMessages(body).map((m) => m.messageId)).toEqual(['y']);
  });

  it('ignores status updates, other fields and a change without a number', () => {
    expect(inboundMessages(delivery({ metadata: { phone_number_id: PHONE_ID } }))).toEqual([]);
    expect(
      inboundMessages(delivery({ metadata: { phone_number_id: PHONE_ID } }, 'account_update')),
    ).toEqual([]);
    expect(inboundMessages(delivery({ messages: [{ id: 'a', from: '911' }] }))).toEqual([]);
    expect(
      inboundMessages({
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ field: 'messages' }] }, {}],
      }),
    ).toEqual([]);
  });

  it('ignores anything that is not a WhatsApp Business delivery', () => {
    expect(inboundMessages(null)).toEqual([]);
    expect(inboundMessages({ object: 'page', entry: [] })).toEqual([]);
    expect(inboundMessages({ object: 'whatsapp_business_account' })).toEqual([]);
  });

  it('reads every message across entries and changes, in order', () => {
    const one = withMessages([{ id: '1', from: '911', text: { body: 'a' } }]);
    const two = withMessages([{ id: '2', from: '912', text: { body: 'b' } }]);
    const body = { ...one, entry: [...one.entry, ...two.entry] };

    expect(inboundMessages(body).map((m) => m.messageId)).toEqual(['1', '2']);
  });
});
