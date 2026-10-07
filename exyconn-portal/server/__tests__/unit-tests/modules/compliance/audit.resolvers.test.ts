import { auditResolvers } from '../../../../src/modules/compliance/audit.resolvers';
import { InternalAuditModel } from '../../../../src/modules/compliance/audit.model';
import { FindingModel } from '../../../../src/modules/compliance/finding.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

const auditor: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.COMPLIANCE], email: 'ravi@exyconn.com' },
};
const employee: GraphQLContext = {
  user: { id: 'u2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};
const plan = {
  url: 'https://cdn.example.com/plan.pdf',
  name: 'plan.pdf',
  contentType: ' application/pdf ',
};

const input = (over: Record<string, unknown> = {}) => ({
  title: 'Quality audit — Q4',
  kind: 'INTERNAL',
  standards: ['ISO_9001'],
  scope: 'Order handling',
  criteria: 'ISO 9001:2015 clause 8',
  leadAuditorId: 'u1',
  leadAuditorName: 'Ravi',
  auditeeName: 'Operations',
  plannedOn: new Date('2026-11-10T00:00:00.000Z'),
  status: 'PLANNED',
  summary: '',
  conclusion: '',
  ...over,
});

type AuditRow = { id: string; reference: string; status: string };

const create = (over: Record<string, unknown> = {}, ctx: GraphQLContext = auditor) =>
  auditResolvers.Mutation.createInternalAudit(
    null,
    { input: input(over) } as never,
    ctx,
  ) as Promise<AuditRow>;

const update = (id: string, over: Record<string, unknown>, ctx: GraphQLContext = auditor) =>
  auditResolvers.Mutation.updateInternalAudit(
    null,
    { id, input: input(over) } as never,
    ctx,
  ) as Promise<AuditRow>;

describe('the audit programme', () => {
  it('numbers each audit from its own series', async () => {
    const first = await create();
    const second = await create({ title: 'Security audit' });

    expect([first.reference, second.reference]).toEqual(['AUD-0001', 'AUD-0002']);
  });

  it('refuses somebody who is not signed in, and somebody outside compliance', async () => {
    await expect(create({}, { user: null })).rejects.toThrow();
    await expect(update('missing', {}, { user: null })).rejects.toThrow();
    await expect(create({}, employee)).rejects.toThrow();
    await expect(InternalAuditModel.countDocuments()).resolves.toBe(0);
  });

  it('files the audit papers with who attached them', async () => {
    const created = await create({ evidence: [plan] });

    const row = await InternalAuditModel.findById(created.id).lean();
    expect(row?.evidence[0]).toMatchObject({
      name: 'plan.pdf',
      contentType: 'application/pdf',
      uploadedBy: 'ravi@exyconn.com',
    });
  });

  it('updates the report without touching papers the edit does not mention', async () => {
    const created = await create({ evidence: [plan] });

    const updated = await update(created.id, { status: 'REPORTED', conclusion: 'Conforms.' });

    expect(updated.status).toBe('REPORTED');
    const row = await InternalAuditModel.findById(created.id).lean();
    expect(row?.evidence).toHaveLength(1);
    expect(row?.conclusion).toBe('Conforms.');
  });

  it('replaces the papers with the ones an edit sends, stamped again', async () => {
    const created = await create({ evidence: [plan] });
    const editor: GraphQLContext = {
      user: { id: 'u3', roles: [ROLES.COMPLIANCE], email: 'asha@exyconn.com' },
    };

    await update(
      created.id,
      { evidence: [{ url: 'https://cdn.example.com/r.pdf', name: 'report.pdf' }] },
      editor,
    );

    const row = await InternalAuditModel.findById(created.id).lean();
    expect(row?.evidence).toHaveLength(1);
    expect(row?.evidence[0]).toMatchObject({ name: 'report.pdf', uploadedBy: 'asha@exyconn.com' });
  });

  it('clears the papers when an edit sends none', async () => {
    const created = await create({ evidence: [plan] });

    await update(created.id, { evidence: null });

    const row = await InternalAuditModel.findById(created.id).lean();
    expect(row?.evidence).toEqual([]);
  });

  it('stamps no uploader name when the session has no email', async () => {
    const noEmail = { user: { id: 'u1', roles: [ROLES.COMPLIANCE] } } as unknown as GraphQLContext;

    const created = await create({ evidence: [plan] }, noEmail);

    const row = await InternalAuditModel.findById(created.id).lean();
    expect(row?.evidence[0].uploadedBy).toBe('');
  });
});

describe('reading an audit', () => {
  it('reads an audit written before evidence existed as having none', () => {
    expect(auditResolvers.InternalAudit.evidence({})).toEqual([]);
  });

  it('lists the findings it raised in the order they were raised', async () => {
    const audit = await create();
    const base = {
      category: 'QUALITY',
      raisedOn: new Date('2026-11-11T00:00:00.000Z'),
      auditId: audit.id,
    };
    await FindingModel.create({ ...base, reference: 'NC-0001', title: 'First' });
    await FindingModel.create({ ...base, reference: 'NC-0002', title: 'Second' });
    await FindingModel.create({
      ...base,
      reference: 'NC-0003',
      title: 'Elsewhere',
      auditId: 'other',
    });

    const found = (await auditResolvers.InternalAudit.findings(audit)) as Array<{
      id: string;
      title: string;
    }>;

    expect(found.map((row) => row.title)).toEqual(['First', 'Second']);
    expect(typeof found[0].id).toBe('string');
  });
});
