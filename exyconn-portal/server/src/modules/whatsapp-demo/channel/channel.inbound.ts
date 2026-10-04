import type { Input } from './channel.plan';

/**
 * Meta's webhook body, reduced to what a turn needs. Status updates (sent, delivered, read)
 * are ignored; a message type the demo cannot read — a photo, a voice note, a sticker — is
 * answered with the menu, so the person always gets somewhere to go next.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
export interface InboundMessage {
  phoneNumberId: string;
  messageId: string;
  waId: string;
  name: string;
  input: Input;
}

interface WaMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } };
}

interface WaValue {
  metadata?: { phone_number_id?: string };
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
  messages?: WaMessage[];
}

interface WaBody {
  object?: string;
  entry?: { changes?: { field?: string; value?: WaValue }[] }[];
}

/** Brings the menu back for anything that is not text or a tap. */
const MENU_WORD = 'menu';

function inputOf(message: WaMessage): Input {
  const replyId = message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id;
  if (replyId) {
    return { kind: 'reply', id: replyId };
  }
  const text = message.text?.body ?? message.button?.text;
  return { kind: 'text', text: text?.trim() ? text : MENU_WORD };
}

function fromValue(value: WaValue): InboundMessage[] {
  const phoneNumberId = value.metadata?.phone_number_id;
  if (!phoneNumberId) {
    return [];
  }
  return (value.messages ?? []).flatMap((message) => {
    if (!message.id || !message.from) {
      return [];
    }
    const contact = value.contacts?.find((c) => c.wa_id === message.from);
    return [
      {
        phoneNumberId,
        messageId: message.id,
        waId: message.from,
        name: contact?.profile?.name ?? '',
        input: inputOf(message),
      },
    ];
  });
}

export function inboundMessages(body: unknown): InboundMessage[] {
  const payload = body as WaBody;
  if (payload?.object !== 'whatsapp_business_account') {
    return [];
  }
  return (payload.entry ?? [])
    .flatMap((entry) => entry.changes ?? [])
    .filter((change) => change.field === 'messages' && change.value)
    .flatMap((change) => fromValue(change.value ?? {}));
}
