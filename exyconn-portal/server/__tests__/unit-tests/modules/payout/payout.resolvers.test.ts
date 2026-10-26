import { payoutResolvers } from '../../../../src/modules/payout/payout.resolvers';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { indianBank } from './payout.fixtures';

const organizationId = useTestOrganization();

const staff = (id: string, ...roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@x.com`, roles, organizationId },
  organizationId,
});
const contact = {
  user: null,
  clientContact: { id: 'k1', clientId: 'c1', name: 'Kim', email: 'kim@client.com', organizationId },
} as unknown as GraphQLContext;

const { Query, Mutation } = payoutResolvers;
const hr = staff('hr1', ROLES.HR);

const saveFor = (ctx: GraphQLContext, employeeId: string) =>
  Mutation.saveEmployeePayoutAccount(null, { employeeId, input: indianBank() }, ctx);

const refundInput = {
  ...indianBank(),
  method: 'PAYPAL' as const,
  country: 'US',
  currency: 'USD',
  walletEmail: 'ap@acme.com',
};

beforeEach(() => invalidatePermissionCache());

describe('salary accounts (HR and Finance)', () => {
  it('lets HR add, list, reveal and remove an account, logging each without the number', async () => {
    const account = await saveFor(hr, 'e1');
    const id = String(account.id);
    expect(await Query.employeePayoutAccounts(null, { employeeId: 'e1' }, hr)).toHaveLength(1);

    const full = await Query.employeePayoutSecret(
      null,
      { employeeId: 'e1', id, field: 'ACCOUNT_NUMBER' },
      hr,
    );
    expect(full).toBe('50100123456789');
    await expect(
      Mutation.deleteEmployeePayoutAccount(null, { employeeId: 'e1', id }, hr),
    ).resolves.toBe(true);

    const logs = await AuditLogModel.find().sort({ createdAt: 1 }).lean();
    expect(logs.map((log) => [log.action, log.module])).toEqual([
      ['CREATE', 'SalaryStructure'],
      ['ACCESS', 'SalaryStructure'],
      ['DELETE', 'SalaryStructure'],
    ]);
    expect(logs[0].summary).toBe('Added the Bank transfer salary account HDFC0001234 · •••• 6789');
    expect(logs[1].summary).toContain('Viewed the full account number');
    expect(JSON.stringify(logs)).not.toContain('50100123456789');
  });

  it('records what moved on an edit', async () => {
    const account = await saveFor(hr, 'e1');
    await Mutation.saveEmployeePayoutAccount(
      null,
      {
        employeeId: 'e1',
        id: String(account.id),
        input: indianBank({ bankName: 'HDFC', accountNumber: '' }),
      },
      hr,
    );
    const update = await AuditLogModel.findOne({ action: 'UPDATE' }).lean();
    expect(update?.summary).toBe('Updated the Bank transfer salary account HDFC0001234 · •••• 6789');
    expect(JSON.parse(update?.changes || '{}')).toMatchObject({
      bankName: { from: 'HDFC Bank', to: 'HDFC' },
    });
  });

  it('never lets HR point their own salary at an account', async () => {
    await expect(saveFor(hr, 'hr1')).rejects.toThrow(
      'You cannot change the salary account for yourself.',
    );
    await expect(
      Mutation.deleteEmployeePayoutAccount(null, { employeeId: 'hr1', id: 'x' }, hr),
    ).rejects.toThrow('You cannot remove a salary account for yourself.');
  });

  it('keeps salary accounts from people outside HR and Finance', async () => {
    const sales = staff('s1', ROLES.CRM);
    await expect(Query.employeePayoutAccounts(null, { employeeId: 'e1' }, sales)).rejects.toThrow();
    await expect(saveFor(sales, 'e1')).rejects.toThrow();
  });

  it('answers the account type as null where the country does not ask for one', () => {
    expect(payoutResolvers.PayoutAccount.accountType({ accountType: '' })).toBeNull();
    expect(payoutResolvers.PayoutAccount.accountType({ accountType: 'SAVINGS' })).toBe('SAVINGS');
  });
});

describe('refund accounts (client hub)', () => {
  it('lets a contact manage their client’s refund accounts, logged under their name', async () => {
    const account = await Mutation.clientHubSavePayoutAccount(null, { input: refundInput }, contact);
    const id = String(account.id);
    expect(await Query.clientHubPayoutAccounts(null, null, contact)).toHaveLength(1);
    expect(await Query.clientHubPayoutSecret(null, { id, field: 'WALLET_EMAIL' }, contact)).toBe(
      'ap@acme.com',
    );
    await expect(Mutation.clientHubDeletePayoutAccount(null, { id }, contact)).resolves.toBe(true);

    const logs = await AuditLogModel.find().lean();
    expect(logs).toHaveLength(3);
    expect(logs.every((log) => log.actorEmail === 'kim@client.com' && log.module === 'Client')).toBe(
      true,
    );
  });

  it('shows staff the client’s accounts and, to an administrator, the full detail', async () => {
    const account = await Mutation.clientHubSavePayoutAccount(null, { input: refundInput }, contact);
    const admin = staff('a1', ROLES.ADMIN);

    expect(await Query.clientPayoutAccounts(null, { clientId: 'c1' }, admin)).toHaveLength(1);
    expect(
      await Query.clientPayoutSecret(
        null,
        { clientId: 'c1', id: String(account.id), field: 'WALLET_EMAIL' },
        admin,
      ),
    ).toBe('ap@acme.com');
    await expect(
      Query.clientPayoutAccounts(null, { clientId: 'c1' }, staff('h2', ROLES.HR)),
    ).rejects.toThrow();
  });

  it('refuses the client hub without a signed-in contact', () => {
    expect(() => Query.clientHubPayoutAccounts(null, null, { user: null })).toThrow(
      'Sign in to the client hub.',
    );
  });
});
