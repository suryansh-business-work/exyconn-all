import { Types } from 'mongoose';
import { findingResolvers } from '../../../../src/modules/compliance/finding.resolvers';
import { FindingModel } from '../../../../src/modules/compliance/finding.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

const officer: GraphQLContext = {
  user: { id: 'u1', roles: [ROLES.COMPLIANCE], email: 'meera@exyconn.com' },
};
const anonymous: GraphQLContext = { user: null };
const VERIFIED_ON = new Date('2026-10-01T00:00:00.000Z');
const evidenceFile = { url: ' https://cdn.example.com/fix.png ', name: ' fix.png ' };

const input = (over: Record<string, unknown> = {}) => ({
  title: 'Leavers kept access',
  description: '',
  source: 'INTERNAL_AUDIT',
  auditId: '',
  riskId: '',
  standards: ['ISO_27001'],
  category: 'INFORMATION_SECURITY',
  clause: '27001:A.5.18',
  type: 'MINOR_NONCONFORMITY',
  immediateAction: '',
  rootCause: '',
  correctiveAction: '',
  ownerId: 'u1',
  ownerName: 'Meera',
  raisedOn: new Date('2026-09-01T00:00:00.000Z'),
  status: 'OPEN',
  ...over,
});

const create = (over: Record<string, unknown> = {}, ctx: GraphQLContext = officer) =>
  findingResolvers.Mutation.createFinding(null, { input: input(over) } as never, ctx) as Promise<{
    id: string;
    reference: string;
  }>;

const update = (id: string, over: Record<string, unknown>, ctx: GraphQLContext = officer) =>
  findingResolvers.Mutation.updateFinding(
    null,
    { id, input: input(over) } as never,
    ctx,
  ) as Promise<{
    status: string;
  }>;

const stored = (id: string) => FindingModel.findById(id).lean();

describe('raising and closing a finding', () => {
  it('refuses a caller who is not signed in, before drawing a reference', async () => {
    await expect(create({}, anonymous)).rejects.toThrow();
    await expect(update(new Types.ObjectId().toHexString(), {}, anonymous)).rejects.toThrow();
    await expect(FindingModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses to close on a verification date without a verdict on effectiveness', async () => {
    await expect(create({ status: 'CLOSED', verifiedOn: VERIFIED_ON })).rejects.toThrow(
      /verified/i,
    );
  });

  it('accepts "not effective" as a verdict, since it was still checked', async () => {
    const created = await create({ status: 'CLOSED', verifiedOn: VERIFIED_ON, effective: false });

    const row = await stored(created.id);
    expect(row).toMatchObject({ status: 'CLOSED', effective: false });
  });

  it('closes on a verification recorded earlier, without asking for it again', async () => {
    const created = await create({
      status: 'IMPLEMENTED',
      verifiedOn: VERIFIED_ON,
      effective: true,
    });

    const closed = await update(created.id, { status: 'CLOSED' });

    expect(closed.status).toBe('CLOSED');
  });

  it('still refuses to close when the stored verification has no verdict', async () => {
    // `effective` is stored as null until somebody records one.
    const created = await create({ status: 'IMPLEMENTED', verifiedOn: VERIFIED_ON });

    await expect(update(created.id, { status: 'CLOSED' })).rejects.toThrow(/verified/i);
    await expect(stored(created.id)).resolves.toMatchObject({ status: 'IMPLEMENTED' });
  });

  it('reports a finding that does not exist as not found', async () => {
    await expect(update(new Types.ObjectId().toHexString(), { status: 'OPEN' })).rejects.toThrow(
      /not found/i,
    );
  });
});

describe('evidence on a finding', () => {
  it('trims what the client sent and stamps the uploader', async () => {
    const created = await create({ evidence: [evidenceFile] });

    const row = await stored(created.id);
    expect(row?.evidence[0]).toMatchObject({
      url: 'https://cdn.example.com/fix.png',
      name: 'fix.png',
      contentType: '',
      uploadedBy: 'meera@exyconn.com',
    });
  });

  it('stamps no name when the session carries no email', async () => {
    const noEmail = {
      user: { id: 'u1', roles: [ROLES.COMPLIANCE] },
    } as unknown as GraphQLContext;

    const created = await create({ evidence: [evidenceFile] }, noEmail);

    const row = await stored(created.id);
    expect(row?.evidence[0].uploadedBy).toBe('');
  });

  it('keeps the evidence when an edit does not mention it', async () => {
    const created = await create({ evidence: [evidenceFile] });

    await update(created.id, { status: 'ACTION_AGREED' });

    const row = await stored(created.id);
    expect(row?.status).toBe('ACTION_AGREED');
    expect(row?.evidence).toHaveLength(1);
  });

  it('replaces the evidence with what an edit sends', async () => {
    const created = await create({ evidence: [evidenceFile] });

    await update(created.id, {
      evidence: [
        { url: 'https://cdn.example.com/b.pdf', name: 'b.pdf', contentType: 'application/pdf' },
      ],
    });

    const row = await stored(created.id);
    expect(row?.evidence).toHaveLength(1);
    expect(row?.evidence[0]).toMatchObject({ name: 'b.pdf', contentType: 'application/pdf' });
  });

  it('reads stored evidence back as it is', () => {
    const evidence = [
      {
        url: 'https://cdn.example.com/a.png',
        name: 'a.png',
        contentType: 'image/png',
        uploadedBy: 'meera@exyconn.com',
        uploadedAt: VERIFIED_ON,
      },
    ];

    expect(findingResolvers.Finding.evidence({ evidence })).toBe(evidence);
    expect(findingResolvers.Finding.evidence({ evidence: null })).toEqual([]);
  });
});
