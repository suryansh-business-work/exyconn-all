import { createHmac, randomUUID } from 'node:crypto';
import {
  markRead,
  sendMessage,
  validSignature,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.graph';
import { postJson } from '../../../../../src/modules/social-accounts/social.http';

jest.mock('../../../../../src/modules/social-accounts/social.http', () => ({
  postJson: jest.fn().mockResolvedValue({}),
}));

const posted = postJson as jest.MockedFunction<typeof postJson>;
const sender = { phoneNumberId: '1098765', accessToken: `token-${randomUUID()}` };

describe('sendMessage', () => {
  it('posts the payload in the Cloud API envelope with the number token', async () => {
    await sendMessage(sender, '919800000001', { type: 'text', text: { body: 'Hi' } });

    expect(posted).toHaveBeenCalledWith(
      'WhatsApp',
      'https://graph.facebook.com/v21.0/1098765/messages',
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919800000001',
        type: 'text',
        text: { body: 'Hi' },
      },
      sender.accessToken,
    );
  });

  it('encodes the number id into the path', async () => {
    await sendMessage({ ...sender, phoneNumberId: '12/../34' }, '911', { type: 'text' });

    expect(posted.mock.calls[0][1]).toBe('https://graph.facebook.com/v21.0/12%2F..%2F34/messages');
  });

  it('passes a refusal from Meta on to the caller', async () => {
    posted.mockRejectedValueOnce(new Error('WhatsApp refused the connection: bad token'));

    await expect(sendMessage(sender, '911', { type: 'text' })).rejects.toThrow('bad token');
  });
});

describe('markRead', () => {
  it('marks the message read and shows typing', async () => {
    await markRead(sender, 'wamid.42');

    expect(posted).toHaveBeenCalledWith(
      'WhatsApp',
      'https://graph.facebook.com/v21.0/1098765/messages',
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: 'wamid.42',
        typing_indicator: { type: 'text' },
      },
      sender.accessToken,
    );
  });
});

describe('validSignature', () => {
  const appSecret = randomUUID();
  const body = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account' }));
  const hmac = (secret: string, raw: Buffer) =>
    createHmac('sha256', secret).update(raw).digest('hex');

  it('accepts the HMAC of the exact bytes under the app secret', () => {
    expect(validSignature(body, `sha256=${hmac(appSecret, body)}`, appSecret)).toBe(true);
  });

  it('refuses a missing header or one without the sha256 prefix', () => {
    expect(validSignature(body, undefined, appSecret)).toBe(false);
    expect(validSignature(body, hmac(appSecret, body), appSecret)).toBe(false);
    expect(validSignature(body, `sha1=${hmac(appSecret, body)}`, appSecret)).toBe(false);
  });

  it('refuses a signature made with another secret or over other bytes', () => {
    expect(validSignature(body, `sha256=${hmac(randomUUID(), body)}`, appSecret)).toBe(false);
    const tampered = Buffer.concat([body, Buffer.from(' ')]);
    expect(validSignature(tampered, `sha256=${hmac(appSecret, body)}`, appSecret)).toBe(false);
  });

  it('refuses a signature of the wrong length without throwing', () => {
    expect(validSignature(body, 'sha256=abcd', appSecret)).toBe(false);
    expect(validSignature(body, 'sha256=', appSecret)).toBe(false);
  });
});
