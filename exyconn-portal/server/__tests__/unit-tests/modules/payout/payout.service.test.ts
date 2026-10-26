import { PayoutAccountModel } from '../../../../src/modules/payout/payout-account.model';
import { payoutService } from '../../../../src/modules/payout/payout.service';
import { useTestOrganization } from '../../../helpers';
import { indianBank, upi } from './payout.fixtures';

useTestOrganization();

const employee = { type: 'EMPLOYEE' as const, id: 'e1' };
const client = { type: 'CLIENT' as const, id: 'c1' };

const sealedRow = (id: string) =>
  PayoutAccountModel.findById(id).select('+accountNumber +upiId +phone').lean();

describe('payoutService.save', () => {
  it('seals the account number, keeps a masked hint and makes the first account the default', async () => {
    const { before, account } = await payoutService.save(employee, null, indianBank());

    expect(before).toBeNull();
    expect(account).toMatchObject({
      summary: 'HDFC0001234 · •••• 6789',
      routingCode: 'HDFC0001234',
      isPrimary: true,
      hints: { accountNumber: '•••• 6789' },
    });
    expect(account).not.toHaveProperty('accountNumber');
    const stored = await sealedRow(String(account.id));
    expect(stored?.accountNumber).toMatch(/^v1\./);
    expect(stored?.accountNumber).not.toContain('50100');
  });

  it('stores the UPI ID in lower case and the phone without spaces', async () => {
    const { account } = await payoutService.save(employee, null, upi({ upiId: 'Ravi@OKHDFCBANK' }));

    expect(account.summary).toBe('ra••••@okhdfcbank');
    expect(account.hints).toMatchObject({ phone: '•••• 3210' });
    expect((await payoutService.reveal(employee, String(account.id), 'phone')).value).toBe(
      '+919876543210',
    );
  });

  it('keeps a stored secret when an edit leaves it blank, and validates it against the new details', async () => {
    const { account } = await payoutService.save(employee, null, indianBank());
    const id = String(account.id);

    const edited = await payoutService.save(
      employee,
      id,
      indianBank({ accountNumber: '', bankName: 'HDFC' }),
    );
    expect(edited.account.bankName).toBe('HDFC');
    expect((await payoutService.reveal(employee, id, 'accountNumber')).value).toBe(
      '50100123456789',
    );

    // The stored 14 digits are not a UK account: moving the account to GB without one fails.
    await expect(
      payoutService.save(
        employee,
        id,
        indianBank({ country: 'GB', currency: 'GBP', accountNumber: '', routingCode: '123456' }),
      ),
    ).rejects.toThrow('This account number has the wrong format for the chosen country.');
  });

  it('drops details the method no longer asks for', async () => {
    const { account } = await payoutService.save(employee, null, upi());
    const id = String(account.id);

    const moved = await payoutService.save(employee, id, indianBank({ upiId: '', phone: '' }));

    expect(moved.account.hints).toMatchObject({ upiId: '', phone: '' });
    const stored = await sealedRow(id);
    expect(stored?.upiId).toBe('');
    expect(stored?.phone).toBe('');
  });

  it('moves the default when another account is chosen, keeping exactly one', async () => {
    const first = (await payoutService.save(employee, null, indianBank())).account;
    const second = (await payoutService.save(employee, null, { ...upi(), isPrimary: true }))
      .account;

    const rows = await payoutService.list(employee);
    expect(rows.map((row) => [row.id, row.isPrimary])).toEqual([
      [second.id, true],
      [first.id, false],
    ]);
  });

  it('refuses a method the account kind does not offer, and an invalid country or currency', async () => {
    await expect(
      payoutService.save(employee, null, {
        ...indianBank(),
        method: 'PAYPAL',
        walletEmail: 'a@b.co',
      }),
    ).rejects.toThrow('That payout method is not offered for this account.');
    await expect(payoutService.save(client, null, indianBank({ country: 'XX' }))).rejects.toThrow(
      'Choose the country the account is in.',
    );
    await expect(payoutService.save(client, null, indianBank({ currency: 'ABC' }))).rejects.toThrow(
      'Choose the currency the account is paid in.',
    );
  });

  it('accepts PayPal and Western Union for a refund account', async () => {
    const paypal = await payoutService.save(client, null, {
      ...indianBank({ method: 'PAYPAL', country: 'US', currency: 'USD' }),
      walletEmail: 'Billing@Acme.com',
    });
    expect(paypal.account.summary).toBe('bi••••@acme.com');

    const wu = await payoutService.save(client, null, {
      ...indianBank({ method: 'WESTERN_UNION', country: 'US', currency: 'USD' }),
      city: 'Austin',
      region: 'TX',
    });
    expect(wu.account.summary).toBe('Austin, TX, US');
  });

  it('never reaches another owner’s account', async () => {
    const { account } = await payoutService.save(employee, null, indianBank());
    const id = String(account.id);
    const other = { type: 'EMPLOYEE' as const, id: 'e2' };

    await expect(payoutService.save(other, id, indianBank())).rejects.toThrow(
      'Payout account not found',
    );
    await expect(payoutService.reveal(other, id, 'accountNumber')).rejects.toThrow(
      'Payout account not found',
    );
    await expect(payoutService.remove(client, id)).rejects.toThrow('Payout account not found');
  });
});

describe('payoutService.remove and reveal', () => {
  it('hands the default to the oldest remaining account when the default is removed', async () => {
    const first = (await payoutService.save(employee, null, indianBank())).account;
    const second = (await payoutService.save(employee, null, upi())).account;

    await payoutService.remove(employee, String(first.id));

    const rows = await payoutService.list(employee);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: second.id, isPrimary: true });
  });

  it('removes the last account without looking for another default', async () => {
    const { account } = await payoutService.save(employee, null, indianBank());
    await payoutService.remove(employee, String(account.id));
    expect(await payoutService.list(employee)).toEqual([]);
  });

  it('says so when the detail asked for was never saved', async () => {
    const { account } = await payoutService.save(employee, null, indianBank());
    await expect(payoutService.reveal(employee, String(account.id), 'iban')).rejects.toThrow(
      'That detail not found',
    );
  });
});
