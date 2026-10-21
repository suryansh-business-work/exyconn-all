import { clientRecordsResolvers } from '../../../../../src/modules/clienthub/records';
import { emailer } from '../../../../../src/modules/email/email.service';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { LegalDocumentModel } from '../../../../../src/modules/legal/document.model';
import { PolicyModel } from '../../../../../src/modules/legal/policy.model';
import { UserModel } from '../../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { useTestOrganization } from '../../../../helpers';
import { contactContext, seedClient, staffContext } from './fixtures';

const organizationId = useTestOrganization();
const { Query, Mutation } = clientRecordsResolvers;
const PAGE = { input: { page: 0, pageSize: 20 } };

let acme: string;
let admin: GraphQLContext;
let dana: GraphQLContext;

beforeEach(async () => {
  jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  acme = await seedClient('Acme', 'dana@acme.test');
  admin = staffContext(organizationId);
  dana = contactContext(organizationId, acme, 'dana@acme.test');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('communication log, end to end', () => {
  it('logs, corrects and removes an entry the client reads in the hub', async () => {
    const entry = await Mutation.createClientCommunication(
      null,
      { clientId: acme, input: { type: 'MEETING', occurredAt: new Date(), subject: 'Review' } },
      admin,
    );
    await Mutation.updateClientCommunication(
      null,
      {
        id: entry.id,
        input: { type: 'MEETING', occurredAt: new Date(), subject: 'Quarterly review' },
      },
      admin,
    );

    const staff = await Query.listClientCommunicationsPaged(null, PAGE, admin);
    const hub = await Query.clientHubCommunications(null, PAGE, dana);
    expect(staff.rows.map((row) => row.subject)).toEqual(['Quarterly review']);
    expect(hub.rows.map((row) => row.subject)).toEqual(['Quarterly review']);

    expect(await Mutation.deleteClientCommunication(null, { id: entry.id }, admin)).toBe(true);
    expect((await Query.clientHubCommunications(null, PAGE, dana)).totalCount).toBe(0);
    expect(await AuditLogModel.countDocuments({ entityId: entry.id })).toBe(3);
  });

  it('files who logged it by their portal name', async () => {
    const user = await UserModel.create({
      name: 'Arjun Mehta',
      email: 'arjun@exyconn.test',
      passwordHash: 'x',
      roles: ['ADMIN'],
    });
    const named = staffContext(organizationId, [ROLES.ADMIN], user._id.toHexString());

    const entry = await Mutation.createClientCommunication(
      null,
      { clientId: acme, input: { type: 'CALL', occurredAt: new Date(), subject: 'Hello' } },
      named,
    );

    expect(entry.loggedByName).toBe('Arjun Mehta');
  });
});

describe('documents and policies shared with the client', () => {
  it('shares a document and a policy, shows their text, and takes one back', async () => {
    const doc = await LegalDocumentModel.create({
      title: 'Security overview',
      status: 'FINAL',
      fileUrl: 'https://files.test/sec.pdf',
      content: '<p>We encrypt</p>',
    });
    const policy = await PolicyModel.create({
      title: 'Privacy policy',
      slug: 'privacy',
      body: '<p>Your data</p>',
      status: 'PUBLISHED',
      audience: 'PUBLIC',
      effectiveDate: new Date(),
    });
    const docShare = await Mutation.shareWithClient(
      null,
      { clientId: acme, input: { kind: 'DOCUMENT', refId: doc._id.toHexString() } },
      admin,
    );
    const policyShare = await Mutation.shareWithClient(
      null,
      { clientId: acme, input: { kind: 'POLICY', refId: policy._id.toHexString() } },
      admin,
    );

    const hub = await Query.clientHubSharedItems(null, null, dana);
    expect(hub.map((item) => [item.kind, item.title, item.fileUrl])).toEqual([
      ['POLICY', 'Privacy policy', ''],
      ['DOCUMENT', 'Security overview', 'https://files.test/sec.pdf'],
    ]);
    expect(await Query.clientHubSharedContent(null, { id: docShare.id }, dana)).toContain(
      'We encrypt',
    );
    expect(await Query.clientHubSharedContent(null, { id: policyShare.id }, dana)).toContain(
      'Your data',
    );

    expect(await Mutation.unshareWithClient(null, { id: docShare.id }, admin)).toBe(true);
    const staff = await Query.clientSharedItems(null, { clientId: acme }, admin);
    expect(staff.map((item) => item.kind)).toEqual(['POLICY']);
    expect(await Query.clientShareOptions(null, { kind: 'POLICY' }, admin)).toHaveLength(1);
  });
});

describe('emailing the client', () => {
  it('lists the addresses on file and sends to the ones picked', async () => {
    const recipients = await Query.clientEmailRecipients(null, { clientId: acme }, admin);
    const sent = await Mutation.emailClient(
      null,
      {
        clientId: acme,
        input: { to: ['billing@acme.test'], subject: 'Renewal', message: 'Due next month' },
      },
      admin,
    );

    expect(recipients.map((person) => person.email)).toEqual([
      'billing@acme.test',
      'dana@acme.test',
    ]);
    expect(sent).toBe(1);
    expect(await AuditLogModel.countDocuments({ entityId: acme, module: 'Client' })).toBe(1);
  });
});
