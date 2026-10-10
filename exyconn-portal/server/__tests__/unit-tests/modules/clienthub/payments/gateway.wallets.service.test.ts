import {
  activePayoneer,
  activePaypal,
  walletGatewayService,
  type PayoneerConfigInput,
  type PaypalConfigInput,
} from '../../../../../src/modules/clienthub/payments/gateway.wallets.service';
import {
  PayoneerConfigModel,
  PaypalConfigModel,
} from '../../../../../src/modules/clienthub/payments/gateway.model';

/** Never a literal credential: each only has to look like a long key. */
const SECRET = `pp_${'s'.repeat(24)}`;
const TOKEN = `po_${'t'.repeat(24)}`;
const MISSING = '64b000000000000000000099';

const paypalInput = (fields: Partial<PaypalConfigInput> = {}): PaypalConfigInput => ({
  label: 'Wallet',
  clientId: 'client',
  clientSecret: SECRET,
  webhookId: 'WH-1',
  mode: 'SANDBOX',
  isActive: true,
  ...fields,
});

const payoneerInput = (fields: Partial<PayoneerConfigInput> = {}): PayoneerConfigInput => ({
  label: 'Payoneer',
  merchantCode: 'MERCHANT',
  apiToken: TOKEN,
  mode: 'LIVE',
  isActive: true,
  ...fields,
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PayPal accounts', () => {
  it('open the active account’s keys and webhook id, or null with none active', async () => {
    expect(await activePaypal()).toBeNull();

    await walletGatewayService.createPaypal(paypalInput());

    expect(await activePaypal()).toEqual({
      clientId: 'client',
      clientSecret: SECRET,
      mode: 'SANDBOX',
      webhookId: 'WH-1',
    });
  });

  it('keep no hint for a secret too short to hint at safely', async () => {
    const doc = await walletGatewayService.createPaypal(
      paypalInput({ clientSecret: 'p'.repeat(8) }),
    );

    expect(doc.clientSecretHint).toBe('');
  });

  it('require the client secret when an account is added', async () => {
    await expect(
      walletGatewayService.createPaypal(paypalInput({ clientSecret: '' })),
    ).rejects.toThrow('clientSecret is required.');
  });

  it('keep exactly one active account', async () => {
    const first = await walletGatewayService.createPaypal(paypalInput({ label: 'First' }));
    const second = await walletGatewayService.createPaypal(paypalInput({ label: 'Second' }));
    expect((await PaypalConfigModel.findById(first._id).lean())?.isActive).toBe(false);

    await walletGatewayService.updatePaypal(
      first._id.toHexString(),
      paypalInput({ clientSecret: null }),
    );

    expect((await PaypalConfigModel.findById(second._id).lean())?.isActive).toBe(false);
    expect((await activePaypal())?.clientSecret).toBe(SECRET);
  });

  it('save an inactive account without touching the active one', async () => {
    const active = await walletGatewayService.createPaypal(paypalInput());
    const idle = await walletGatewayService.createPaypal(paypalInput({ isActive: false }));

    await walletGatewayService.updatePaypal(
      idle._id.toHexString(),
      paypalInput({ isActive: false }),
    );

    expect((await PaypalConfigModel.findById(active._id).lean())?.isActive).toBe(true);
  });

  it('refuse to edit or test an account that does not exist, and report empty deletes', async () => {
    await expect(walletGatewayService.updatePaypal(MISSING, paypalInput())).rejects.toThrow(
      'PayPal account not found',
    );
    await expect(walletGatewayService.testPaypal(MISSING)).rejects.toThrow(
      'PayPal account not found',
    );
    expect(await walletGatewayService.deletePaypal(MISSING)).toBe(false);
  });
});

describe('Payoneer accounts', () => {
  it('open the active account’s keys, reading no division as none', async () => {
    expect(await activePayoneer()).toBeNull();

    await walletGatewayService.createPayoneer(payoneerInput());

    expect(await activePayoneer()).toEqual({
      merchantCode: 'MERCHANT',
      apiToken: TOKEN,
      division: '',
      mode: 'LIVE',
    });
  });

  it('read an account stored without a division as having none', async () => {
    await PayoneerConfigModel.collection.insertOne({
      label: 'Legacy',
      merchantCode: 'OLD',
      apiToken: (await walletGatewayService.createPayoneer(payoneerInput({ isActive: false })))
        .apiToken,
      mode: 'SANDBOX',
      isActive: true,
    });

    expect((await activePayoneer())?.division).toBe('');
  });

  it('require the API token when an account is added', async () => {
    await expect(
      walletGatewayService.createPayoneer(payoneerInput({ apiToken: null })),
    ).rejects.toThrow('apiToken is required.');
  });

  it('keep exactly one active account', async () => {
    const first = await walletGatewayService.createPayoneer(payoneerInput({ label: 'First' }));
    await walletGatewayService.createPayoneer(payoneerInput({ label: 'Second' }));

    await walletGatewayService.updatePayoneer(
      first._id.toHexString(),
      payoneerInput({ division: 'EU' }),
    );

    expect(await PayoneerConfigModel.countDocuments({ isActive: true })).toBe(1);
    expect((await activePayoneer())?.division).toBe('EU');
  });

  it('save an inactive account without touching the active one', async () => {
    const active = await walletGatewayService.createPayoneer(payoneerInput());
    const idle = await walletGatewayService.createPayoneer(payoneerInput({ isActive: false }));

    await walletGatewayService.updatePayoneer(
      idle._id.toHexString(),
      payoneerInput({ isActive: false }),
    );

    expect((await PayoneerConfigModel.findById(active._id).lean())?.isActive).toBe(true);
  });

  it('pass on the gateway’s refusal when the stored token is tested', async () => {
    const doc = await walletGatewayService.createPayoneer(payoneerInput());
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify({ resultInfo: 'Unauthorized' }), { status: 401 }),
      );

    await expect(walletGatewayService.testPayoneer(doc._id.toHexString())).rejects.toThrow(
      'Payoneer: Unauthorized (HTTP 401)',
    );
  });

  it('refuse to edit or test an account that does not exist, and report empty deletes', async () => {
    await expect(walletGatewayService.updatePayoneer(MISSING, payoneerInput())).rejects.toThrow(
      'Payoneer account not found',
    );
    await expect(walletGatewayService.testPayoneer(MISSING)).rejects.toThrow(
      'Payoneer account not found',
    );
    expect(await walletGatewayService.deletePayoneer(MISSING)).toBe(false);
  });
});
