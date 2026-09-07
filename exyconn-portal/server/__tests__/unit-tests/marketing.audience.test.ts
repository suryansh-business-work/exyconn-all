import {
  dedupeMembers,
  resolveAudienceMembers,
  type AudienceMember,
} from '../../src/modules/marketing/marketing.audience';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { ContactModel } from '../../src/modules/crm/contact.model';
import { marketingCustomResolvers } from '../../src/modules/marketing/marketing.resolvers';

const member = (over: Partial<AudienceMember>): AudienceMember => ({
  id: 'id',
  email: 'ada@example.com',
  name: 'Ada',
  company: 'Acme',
  status: 'ACTIVE',
  kind: 'CLIENT',
  ...over,
});

const seedClient = (name: string, email: string, status = 'ACTIVE') =>
  ClientModel.create({ name, email, phone: '000', company: 'Acme', status });

const seedContact = (name: string, email: string, over: Record<string, unknown> = {}) =>
  ContactModel.create({ name, email, owner: 'growth@exyconn.com', ...over });

describe('De-duplicating audience members', () => {
  it('keeps one copy per address, the first mention winning', () => {
    const rows = [
      member({ id: 'client-1', kind: 'CLIENT' }),
      member({ id: 'contact-1', kind: 'CONTACT' }),
    ];

    expect(dedupeMembers(rows)).toEqual([expect.objectContaining({ id: 'client-1' })]);
  });

  it('treats addresses that differ only by case or spacing as the same person', () => {
    const rows = [member({ email: ' Ada@Example.com ' }), member({ id: 'b' })];

    const deduped = dedupeMembers(rows);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].email).toBe('ada@example.com');
  });

  it('drops a row with no address, which could never be emailed', () => {
    expect(dedupeMembers([member({ email: '  ' })])).toEqual([]);
  });
});

describe('Resolving an audience', () => {
  it('merges named clients, named contacts and the segment into one list', async () => {
    const client = await seedClient('Ada', 'ada@example.com');
    const contact = await seedContact('Bo', 'bo@example.com');
    await seedContact('Cy', 'cy@example.com');

    const members = await resolveAudienceMembers({
      clientIds: [String(client._id)],
      contactIds: [String(contact._id)],
      dynamicSegment: 'ALL_ACTIVE_CONTACTS',
    });

    expect(members.map((row) => row.email).sort((a, b) => a.localeCompare(b))).toEqual([
      'ada@example.com',
      'bo@example.com',
      'cy@example.com',
    ]);
  });

  it('carries the kind and company each member came with', async () => {
    const contact = await seedContact('Bo', 'bo@example.com', { companyName: 'Initech' });

    const [resolved] = await resolveAudienceMembers({ contactIds: [String(contact._id)] });

    expect(resolved).toMatchObject({ kind: 'CONTACT', company: 'Initech', status: 'ACTIVE' });
  });

  it('never lets a segment re-add somebody who is no longer active', async () => {
    await seedContact('Bo', 'bo@example.com', { status: 'UNSUBSCRIBED' });

    const members = await resolveAudienceMembers({ dynamicSegment: 'ALL_ACTIVE_CONTACTS' });

    expect(members).toEqual([]);
  });

  it('keeps a named contact even after they unsubscribed, so the send can say it skipped them', async () => {
    const contact = await seedContact('Bo', 'bo@example.com', { status: 'UNSUBSCRIBED' });

    const members = await resolveAudienceMembers({ contactIds: [String(contact._id)] });

    expect(members).toMatchObject([{ email: 'bo@example.com', status: 'UNSUBSCRIBED' }]);
  });

  it('picks up the active clients for the all-clients segment only', async () => {
    await seedClient('Ada', 'ada@example.com');
    await seedClient('Zed', 'zed@example.com', 'INACTIVE');

    const members = await resolveAudienceMembers({ dynamicSegment: 'ALL_ACTIVE_CLIENTS' });

    expect(members.map((row) => row.email)).toEqual(['ada@example.com']);
  });

  it('segments contacts by the status of the account they belong to', async () => {
    const customer = await CompanyModel.create({
      name: 'Initech',
      domain: 'initech.com',
      status: 'CUSTOMER',
      owner: 'growth@exyconn.com',
    });
    const prospect = await CompanyModel.create({
      name: 'Acme',
      domain: 'acme.com',
      status: 'PROSPECT',
      owner: 'growth@exyconn.com',
    });
    await seedContact('Bo', 'bo@initech.com', { companyId: String(customer._id) });
    await seedContact('Cy', 'cy@acme.com', { companyId: String(prospect._id) });

    const members = await resolveAudienceMembers({
      dynamicSegment: 'CONTACTS_BY_COMPANY_STATUS',
      segmentValue: 'CUSTOMER',
    });

    expect(members.map((row) => row.email)).toEqual(['bo@initech.com']);
  });

  it('resolves to nobody when there is neither a member nor a segment', async () => {
    await expect(resolveAudienceMembers({ dynamicSegment: 'NONE' })).resolves.toEqual([]);
  });
});

describe('Audiences saved before contacts and segments existed', () => {
  it('reads back as an empty membership rather than failing the non-null fields', () => {
    expect(marketingCustomResolvers.AudienceList.contactIds({})).toEqual([]);
    expect(marketingCustomResolvers.AudienceList.dynamicSegment({})).toBe('NONE');
    expect(marketingCustomResolvers.AudienceList.segmentValue({})).toBe('');
  });
});
