import { clientHubResolvers } from '../../../../src/modules/clienthub';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { ClientHubContact } from '../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';

const organizationId = useTestOrganization();
const MISSING = '64b000000000000000000099';
const PAGE = { input: { page: 0, pageSize: 10 } };

const staff = (roles: Role[]): GraphQLContext => ({
  user: { id: 'admin-1', email: 'admin@exyconn.com', roles, organizationId },
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const RESOLVERS = {
  ...clientHubResolvers.Query,
  ...clientHubResolvers.Mutation,
} as unknown as Record<string, Resolver>;

let clientId: string;
let asContact: GraphQLContext;

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  const client = await ClientModel.create({
    name: 'Dana',
    email: 'dana@acme.test',
    company: 'Acme',
  });
  clientId = String(client._id);
  const contact: ClientHubContact = {
    id: 'contact-1',
    clientId,
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    organizationId,
  };
  asContact = { user: null, clientContact: contact };
});

afterEach(() => {
  jest.restoreAllMocks();
});

const CONTACT_OPERATIONS = [
  'clientHubMe',
  'clientHubInvoices',
  'clientHubInvoicePdf',
  'clientHubPayments',
  'clientHubReminders',
  'clientHubTickets',
  'clientHubTicketReplies',
  'clientHubProjects',
  'clientHubPaymentOptions',
  'clientHubPaymentAttempt',
  'clientHubEmailInvoice',
  'clientHubPayInvoice',
  'clientHubOpenTicket',
  'clientHubReplyToTicket',
];

describe('client hub operations', () => {
  it.each(CONTACT_OPERATIONS)(
    '%s refuses a caller who has not signed in to the hub',
    async (name) => {
      // The refusal is thrown before any promise exists, so it is caught inside one.
      const call = Promise.resolve().then(() =>
        RESOLVERS[name](null, { id: MISSING }, staff([ROLES.ADMIN])),
      );

      expect(await codeOf(call)).toBe('UNAUTHENTICATED');
    },
  );

  it('answer reads for the signed-in contact’s own client', async () => {
    const { Query } = clientHubResolvers;

    expect(await Query.clientHubMe(null, null, asContact)).toMatchObject({ clientName: 'Dana' });
    expect(await Query.clientHubInvoices(null, PAGE, asContact)).toEqual({
      rows: [],
      totalCount: 0,
    });
    expect(await Query.clientHubPayments(null, PAGE, asContact)).toEqual({
      rows: [],
      totalCount: 0,
    });
    expect(await Query.clientHubTickets(null, PAGE, asContact)).toEqual({
      rows: [],
      totalCount: 0,
    });
    expect(await Query.clientHubReminders(null, null, asContact)).toEqual([]);
    expect(await Query.clientHubProjects(null, null, asContact)).toEqual([]);
    expect(await Query.clientHubPaymentOptions(null, null, asContact)).toEqual({
      stripe: false,
      razorpay: false,
      paypal: false,
      payoneer: false,
    });
  });

  it('treat another record id as not found', async () => {
    const { Query, Mutation } = clientHubResolvers;
    const id = { id: MISSING };

    await expect(Query.clientHubInvoicePdf(null, id, asContact)).rejects.toThrow(/not found/);
    await expect(Mutation.clientHubEmailInvoice(null, id, asContact)).rejects.toThrow(/not found/);
    await expect(
      Mutation.clientHubEmailInvoice(null, id, { ...asContact, ip: 'test-conn' }),
    ).rejects.toThrow(/not found/);
    await expect(Query.clientHubPaymentAttempt(null, id, asContact)).rejects.toThrow(/not found/);
    await expect(
      Query.clientHubTicketReplies(null, { ticketId: MISSING }, asContact),
    ).rejects.toThrow(/Ticket not found/);
  });

  it('file and answer tickets, and refuse online payment outside the operator', async () => {
    const { Mutation } = clientHubResolvers;
    const input = {
      subject: 'Invoice total looks wrong',
      category: 'OTHER',
      description: 'The September invoice adds tax twice on the support line.',
      priority: 'LOW',
    };

    const ticket = await Mutation.clientHubOpenTicket(null, { input }, asContact);

    expect(ticket).toMatchObject({ clientId, requesterEmail: 'dana@acme.test' });
    await expect(
      Mutation.clientHubReplyToTicket(null, { ticketId: ticket.id, body: ' ' }, asContact),
    ).rejects.toThrow(/up to 5000/);
    await expect(
      Mutation.clientHubPayInvoice(null, { id: MISSING, gateway: 'STRIPE' }, asContact),
    ).rejects.toThrow(/not available/);
  });
});
