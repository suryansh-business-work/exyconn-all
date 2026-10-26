import { PAYOUT_METHOD_LABELS, type PayoutMethod, type SecretField } from '@exyconn/payout';
import { ROLES } from '../../constants/roles';
import { assertNotOwnRecord, assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import { diffChanges, recordAudit, type Actor, type AuditAction } from '../audit';
import { asContact, clientStaffGuard } from '../clienthub/clienthub.scope';
import type { ClientHubContact } from '../clienthub/clienthub.auth';
import type { PermissionAction } from '../permissions/permission.model';
import { payoutService, type PayoutAccountInput, type PayoutOwner } from './payout.service';

type Id = { id: string };
type ForEmployee = { employeeId: string };
type ForClient = { clientId: string };
type Save = { id?: string | null; input: PayoutAccountInput };
type Reveal = Id & { field: SecretFieldEnum };
type SecretFieldEnum = 'ACCOUNT_NUMBER' | 'IBAN' | 'UPI_ID' | 'PHONE' | 'WALLET_EMAIL';

const SECRET_OF: Readonly<Record<SecretFieldEnum, SecretField>> = {
  ACCOUNT_NUMBER: 'accountNumber',
  IBAN: 'iban',
  UPI_ID: 'upiId',
  PHONE: 'phone',
  WALLET_EMAIL: 'walletEmail',
};

/** Salary accounts sit with pay: whoever may set a salary structure may set where it goes. */
const payrollGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'SalaryStructure', [ROLES.HR, ROLES.FINANCE], action);

const employee = (id: string): PayoutOwner => ({ type: 'EMPLOYEE', id });
const client = (id: string): PayoutOwner => ({ type: 'CLIENT', id });
const contactActor = (contact: ClientHubContact): Actor => ({
  id: contact.id,
  name: contact.name,
  email: contact.email,
});

const MODULE_OF = { EMPLOYEE: 'SalaryStructure', CLIENT: 'Client' } as const;
const NOUN_OF = { EMPLOYEE: 'salary account', CLIENT: 'refund account' } as const;

interface AuditFacts {
  action: AuditAction;
  owner: PayoutOwner;
  account: { id?: unknown; method: string; summary: string };
  verb: string;
  changes?: ReturnType<typeof diffChanges>;
  actor?: Actor;
}

/** Every write and every reveal is logged by its masked summary — never by a sealed value. */
const audit = (ctx: GraphQLContext, facts: AuditFacts) => {
  const method = PAYOUT_METHOD_LABELS[facts.account.method as PayoutMethod].label;
  return recordAudit(ctx, {
    action: facts.action,
    module: MODULE_OF[facts.owner.type],
    entityId: facts.owner.id,
    entityLabel: facts.account.summary,
    summary: `${facts.verb} the ${method} ${NOUN_OF[facts.owner.type]} ${facts.account.summary}`,
    changes: facts.changes,
    actor: facts.actor,
  });
};

/** Saves, then logs what moved: only plain fields and the masked summary are diffed. */
async function saveAndAudit(ctx: GraphQLContext, owner: PayoutOwner, args: Save, actor?: Actor) {
  const { before, account } = await payoutService.save(owner, args.id ?? null, args.input);
  const plain = {
    method: account.method,
    country: account.country,
    currency: account.currency,
    holderName: account.holderName,
    bankName: account.bankName,
    routingCode: account.routingCode,
    bic: account.bic,
    summary: account.summary,
  };
  await audit(ctx, {
    action: before ? 'UPDATE' : 'CREATE',
    owner,
    account,
    verb: before ? 'Updated' : 'Added',
    changes: before ? diffChanges(before, plain) : undefined,
    actor,
  });
  return account;
}

async function removeAndAudit(ctx: GraphQLContext, owner: PayoutOwner, id: string, actor?: Actor) {
  const row = await payoutService.remove(owner, id);
  await audit(ctx, { action: 'DELETE', owner, account: row, verb: 'Removed', actor });
  return true;
}

async function revealAndAudit(
  ctx: GraphQLContext,
  owner: PayoutOwner,
  args: Reveal,
  actor?: Actor,
) {
  const { summary, value } = await payoutService.reveal(owner, args.id, SECRET_OF[args.field]);
  await recordAudit(ctx, {
    action: 'ACCESS',
    module: MODULE_OF[owner.type],
    entityId: owner.id,
    entityLabel: summary,
    summary: `Viewed the full ${args.field.toLowerCase().replaceAll('_', ' ')} of the ${NOUN_OF[owner.type]} ${summary}`,
    actor,
  });
  return value;
}

export const payoutResolvers = {
  Query: {
    employeePayoutAccounts: async (
      _p: unknown,
      { employeeId }: ForEmployee,
      ctx: GraphQLContext,
    ) => {
      await payrollGuard(ctx, 'VIEW');
      return payoutService.list(employee(employeeId));
    },
    employeePayoutSecret: async (
      _p: unknown,
      { employeeId, ...args }: ForEmployee & Reveal,
      ctx: GraphQLContext,
    ) => {
      await payrollGuard(ctx, 'EDIT');
      return revealAndAudit(ctx, employee(employeeId), args);
    },
    clientPayoutAccounts: async (_p: unknown, { clientId }: ForClient, ctx: GraphQLContext) => {
      await clientStaffGuard(ctx, 'VIEW');
      return payoutService.list(client(clientId));
    },
    clientPayoutSecret: async (
      _p: unknown,
      { clientId, ...args }: ForClient & Reveal,
      ctx: GraphQLContext,
    ) => {
      await clientStaffGuard(ctx, 'EDIT');
      return revealAndAudit(ctx, client(clientId), args);
    },
    clientHubPayoutAccounts: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => payoutService.list(client(contact.clientId))),
    clientHubPayoutSecret: (_p: unknown, args: Reveal, ctx: GraphQLContext) =>
      asContact(ctx, (contact) =>
        revealAndAudit(ctx, client(contact.clientId), args, contactActor(contact)),
      ),
  },
  Mutation: {
    saveEmployeePayoutAccount: async (
      _p: unknown,
      { employeeId, ...args }: ForEmployee & Save,
      ctx: GraphQLContext,
    ) => {
      await payrollGuard(ctx, 'EDIT');
      // Pointing your own salary at a new account is the classic payroll fraud.
      assertNotOwnRecord(ctx, employeeId, 'change the salary account');
      return saveAndAudit(ctx, employee(employeeId), args);
    },
    deleteEmployeePayoutAccount: async (
      _p: unknown,
      { employeeId, id }: ForEmployee & Id,
      ctx: GraphQLContext,
    ) => {
      await payrollGuard(ctx, 'EDIT');
      assertNotOwnRecord(ctx, employeeId, 'remove a salary account');
      return removeAndAudit(ctx, employee(employeeId), id);
    },
    clientHubSavePayoutAccount: (_p: unknown, args: Save, ctx: GraphQLContext) =>
      asContact(ctx, (contact) =>
        saveAndAudit(ctx, client(contact.clientId), args, contactActor(contact)),
      ),
    clientHubDeletePayoutAccount: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asContact(ctx, (contact) =>
        removeAndAudit(ctx, client(contact.clientId), id, contactActor(contact)),
      ),
  },
  PayoutAccount: {
    // Stored as '' where the country does not ask; the API says null.
    accountType: (row: { accountType?: string }) => row.accountType || null,
  },
};
