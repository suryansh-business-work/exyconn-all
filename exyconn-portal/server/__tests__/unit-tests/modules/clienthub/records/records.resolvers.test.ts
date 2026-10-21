import { clientRecordsResolvers } from '../../../../../src/modules/clienthub/records';
import { emailer } from '../../../../../src/modules/email/email.service';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { ContractModel } from '../../../../../src/modules/legal/legal.model';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { contactContext, seedClient, staffContext } from './fixtures';

const organizationId = useTestOrganization();
const PAGE = { input: { page: 0, pageSize: 20 } };
const { Query, Mutation } = clientRecordsResolvers;
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const ALL = { ...Query, ...Mutation } as unknown as Record<string, Resolver>;

let acme: string;
let globex: string;
let admin: GraphQLContext;
let send: jest.SpyInstance;

beforeEach(async () => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  acme = await seedClient('Acme', 'dana@acme.test');
  globex = await seedClient('Globex', 'hank@globex.test');
  admin = staffContext(organizationId);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const STAFF_OPERATIONS = [
  'clientSummary',
  'clientLinks',
  'listClientCommunicationsPaged',
  'clientSharedItems',
  'clientShareOptions',
  'clientEmailRecipients',
  'createClientLink',
  'updateClientLink',
  'deleteClientLink',
  'createClientCommunication',
  'updateClientCommunication',
  'deleteClientCommunication',
  'shareWithClient',
  'unshareWithClient',
  'emailClient',
];
const HUB_OPERATIONS = [
  'clientHubLinks',
  'clientHubCommunications',
  'clientHubSharedItems',
  'clientHubSharedContent',
];

describe('who may reach the client records', () => {
  it.each(STAFF_OPERATIONS)('%s is refused to a role outside Clients', async (name) => {
    const finance = staffContext(organizationId, [ROLES.FINANCE]);
    const call = Promise.resolve().then(() => ALL[name](null, { clientId: acme }, finance));

    expect(await codeOf(call)).toBe('FORBIDDEN');
  });

  it.each(HUB_OPERATIONS)('%s is refused without a client hub pass', async (name) => {
    const call = Promise.resolve().then(() => ALL[name](null, { id: acme, ...PAGE }, admin));

    expect(await codeOf(call)).toBe('UNAUTHENTICATED');
  });
});

describe('client scope in the hub', () => {
  it('shows a contact only their own client’s links, log and shares', async () => {
    await Mutation.createClientLink(
      null,
      { clientId: acme, input: { title: 'Acme staging', url: 'https://staging.acme.test' } },
      admin,
    );
    await Mutation.createClientLink(
      null,
      { clientId: globex, input: { title: 'Globex drive', url: 'https://drive.globex.test' } },
      admin,
    );
    await Mutation.createClientCommunication(
      null,
      {
        clientId: globex,
        input: { type: 'CALL', occurredAt: new Date(), subject: 'Globex pricing call' },
      },
      admin,
    );
    const contract = await ContractModel.create({
      title: 'Globex MSA',
      party: 'Globex',
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 86_400_000),
    });
    const globexShare = await Mutation.shareWithClient(
      null,
      { clientId: globex, input: { kind: 'CONTRACT', refId: contract._id.toHexString() } },
      admin,
    );
    const dana = contactContext(organizationId, acme, 'dana@acme.test');

    const links = await Query.clientHubLinks(null, null, dana);
    const log = await Query.clientHubCommunications(null, PAGE, dana);
    const shares = await Query.clientHubSharedItems(null, null, dana);
    const content = Query.clientHubSharedContent(null, { id: globexShare.id }, dana);

    expect(links.map((link) => link.title)).toEqual(['Acme staging']);
    expect(log.totalCount).toBe(0);
    expect(shares).toEqual([]);
    expect(await codeOf(content)).toBe('NOT_FOUND');
  });

  it('ignores a clientId filter a contact smuggles into the log query', async () => {
    await Mutation.createClientCommunication(
      null,
      { clientId: globex, input: { type: 'EMAIL', occurredAt: new Date(), subject: 'Secret' } },
      admin,
    );
    const dana = contactContext(organizationId, acme, 'dana@acme.test');
    const smuggled = {
      input: {
        ...PAGE.input,
        filters: [{ field: 'clientId', op: 'EQUALS' as const, value: globex }],
      },
    };

    const page = await Query.clientHubCommunications(null, smuggled, dana);

    expect(page.totalCount).toBe(0);
  });
});

describe('staff writes', () => {
  it('audits a new link and emails only the active hub contacts when asked', async () => {
    const link = await Mutation.createClientLink(
      null,
      {
        clientId: acme,
        input: { title: 'Design files', url: 'https://figma.test/acme', notify: true },
      },
      admin,
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'client-hub-shared', to: 'dana@acme.test' }),
    );
    expect(await AuditLogModel.countDocuments({ module: 'Client', entityId: link.id })).toBe(1);
  });

  it('refuses a link that is not a web address', async () => {
    const call = Mutation.createClientLink(
      null,
      { clientId: acme, input: { title: 'Bad', url: 'javascript:alert(1)' } },
      admin,
    );

    expect(await codeOf(call)).toBe('BAD_USER_INPUT');
  });

  it('updates and deletes a link, auditing each', async () => {
    const link = await Mutation.createClientLink(
      null,
      { clientId: acme, input: { title: 'Old', url: 'https://old.test' } },
      admin,
    );

    const updated = await Mutation.updateClientLink(
      null,
      { id: link.id, input: { title: 'New', url: 'https://new.test', details: 'Use SSO' } },
      admin,
    );
    const removed = await Mutation.deleteClientLink(null, { id: link.id }, admin);

    expect(updated).toMatchObject({ title: 'New', url: 'https://new.test', details: 'Use SSO' });
    expect(removed).toBe(true);
    expect(await Query.clientLinks(null, { clientId: acme }, admin)).toEqual([]);
    expect(await AuditLogModel.countDocuments({ entityId: link.id })).toBe(3);
  });

  it('counts what sits under each tab', async () => {
    await Mutation.createClientLink(
      null,
      { clientId: acme, input: { title: 'Site', url: 'https://acme.test' } },
      admin,
    );

    const summary = await Query.clientSummary(null, { clientId: acme }, admin);

    expect(summary).toMatchObject({ contacts: 2, links: 1, communications: 0, invoices: 0 });
  });

  it('refuses records for a client that does not exist', async () => {
    const call = Mutation.createClientLink(
      null,
      { clientId: '64b000000000000000000099', input: { title: 'X', url: 'https://x.test' } },
      admin,
    );

    expect(await codeOf(call)).toBe('NOT_FOUND');
  });
});
