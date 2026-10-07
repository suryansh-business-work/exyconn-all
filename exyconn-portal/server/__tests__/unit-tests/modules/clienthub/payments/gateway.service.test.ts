import {
  activeRazorpay,
  activeStripe,
  gatewayService,
} from '../../../../../src/modules/clienthub/payments/gateway.service';
import {
  RazorpayConfigModel,
  StripeConfigModel,
} from '../../../../../src/modules/clienthub/payments/gateway.model';

/** Never a literal credential: each only has to look like a long key. */
const KEY_A = `sk_${'a'.repeat(24)}`;
const KEY_B = `sk_${'b'.repeat(24)}`;
const HOOK = `wh_${'h'.repeat(24)}`;
const MISSING = '64b000000000000000000099';

const stripe = (label: string, isActive: boolean, secretKey = KEY_A) =>
  gatewayService.createStripe({ label, secretKey, webhookSecret: HOOK, isActive });
const razorpay = (label: string, isActive: boolean) =>
  gatewayService.createRazorpay({
    label,
    keyId: 'rzp_id',
    keySecret: KEY_A,
    webhookSecret: HOOK,
    isActive,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Stripe accounts', () => {
  it('seal the secrets at rest and keep only a hint beside them', async () => {
    const doc = await stripe('Main', true, `  ${KEY_A}  `);

    expect(doc.secretKey).not.toContain(KEY_A);
    expect(doc.secretKeyHint).toBe('aaaa');
    expect(await activeStripe()).toEqual({ secretKey: KEY_A, webhookSecret: HOOK });
  });

  it('keep no hint for a secret too short to hint at safely', async () => {
    const doc = await stripe('Short', false, 's'.repeat(8));

    expect(doc.secretKeyHint).toBe('');
  });

  it('require both secrets when an account is added', async () => {
    await expect(
      gatewayService.createStripe({
        label: 'X',
        secretKey: ' ',
        webhookSecret: HOOK,
        isActive: false,
      }),
    ).rejects.toThrow('secretKey is required.');
    await expect(
      gatewayService.createStripe({
        label: 'X',
        secretKey: KEY_A,
        webhookSecret: null,
        isActive: false,
      }),
    ).rejects.toThrow('webhookSecret is required.');
  });

  it('keep exactly one active account: activating one switches the rest off', async () => {
    const first = await stripe('First', true);
    const second = await stripe('Second', true);
    expect((await StripeConfigModel.findById(first._id).lean())?.isActive).toBe(false);

    await gatewayService.updateStripe(String(first._id), {
      label: 'First',
      isActive: true,
      secretKey: KEY_B,
    });

    expect((await StripeConfigModel.findById(second._id).lean())?.isActive).toBe(false);
    expect((await activeStripe())?.secretKey).toBe(KEY_B);
  });

  it('keep the stored secret when an edit leaves it blank', async () => {
    const doc = await stripe('Main', false);

    const edited = await gatewayService.updateStripe(String(doc._id), {
      label: 'Renamed',
      isActive: false,
      secretKey: '',
      webhookSecret: undefined,
    });

    expect(edited).toMatchObject({ label: 'Renamed', secretKeyHint: 'aaaa' });
    expect(await activeStripe()).toBeNull();
  });

  it('refuse to edit or test an account that does not exist', async () => {
    await expect(
      gatewayService.updateStripe(MISSING, { label: 'X', isActive: false }),
    ).rejects.toThrow('Stripe account not found');
    await expect(gatewayService.testStripe(MISSING)).rejects.toThrow('Stripe account not found');
  });

  it('say whether a delete removed anything', async () => {
    const doc = await stripe('Main', false);

    expect(await gatewayService.deleteStripe(String(doc._id))).toBe(true);
    expect(await gatewayService.deleteStripe(String(doc._id))).toBe(false);
  });

  it('pass on the gateway’s refusal when the stored key is tested', async () => {
    const doc = await stripe('Main', false);
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), { status: 401 }),
      );

    await expect(gatewayService.testStripe(String(doc._id))).rejects.toThrow(
      'Stripe: Invalid API Key',
    );
  });
});

describe('Razorpay accounts', () => {
  it('open the active account’s keys, or null with none active', async () => {
    expect(await activeRazorpay()).toBeNull();

    await razorpay('India', true);

    expect(await activeRazorpay()).toEqual({
      keyId: 'rzp_id',
      keySecret: KEY_A,
      webhookSecret: HOOK,
    });
  });

  it('require the key secret when an account is added', async () => {
    await expect(
      gatewayService.createRazorpay({
        label: 'X',
        keyId: 'id',
        keySecret: null,
        webhookSecret: HOOK,
        isActive: false,
      }),
    ).rejects.toThrow('keySecret is required.');
  });

  it('keep exactly one active account', async () => {
    const first = await razorpay('First', true);
    await razorpay('Second', false);

    const edited = await gatewayService.updateRazorpay(String(first._id), {
      label: 'First',
      keyId: 'rzp_new',
      isActive: true,
    });

    expect(edited).toMatchObject({ keyId: 'rzp_new', isActive: true });
    expect(await RazorpayConfigModel.countDocuments({ isActive: true })).toBe(1);
  });

  it('save an inactive edit without touching the others', async () => {
    const first = await razorpay('First', true);
    const second = await razorpay('Second', false);

    await gatewayService.updateRazorpay(String(second._id), {
      label: 'Second',
      keyId: 'rzp_id',
      keySecret: KEY_B,
      isActive: false,
    });

    expect((await RazorpayConfigModel.findById(first._id).lean())?.isActive).toBe(true);
  });

  it('refuse to edit or test an account that does not exist', async () => {
    await expect(
      gatewayService.updateRazorpay(MISSING, { label: 'X', keyId: 'id', isActive: false }),
    ).rejects.toThrow('Razorpay account not found');
    await expect(gatewayService.testRazorpay(MISSING)).rejects.toThrow(
      'Razorpay account not found',
    );
  });

  it('say whether a delete removed anything', async () => {
    expect(await gatewayService.deleteRazorpay(MISSING)).toBe(false);
  });
});
