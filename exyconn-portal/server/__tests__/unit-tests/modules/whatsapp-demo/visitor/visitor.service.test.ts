import { Types } from 'mongoose';
import {
  deleteVisitor,
  getVisitor,
  listVisitors,
  setVisitorBlocked,
  visitorForPass,
  visitorStats,
} from '../../../../../src/modules/whatsapp-demo/visitor/visitor.service';
import { WhatsappDemoVisitorModel } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.model';
import { signVisitorPass } from '../../../../../src/modules/whatsapp-demo/visitor/visitor.token';
import { signPass } from '../../../../../src/lib/scopedPass';
import { codeOf } from '../../codeOf';
import { seedVisitor, useOperatorOrganization, withoutOperator } from './visitor.fixtures';

const operatorId = useOperatorOrganization();
const missingId = () => new Types.ObjectId().toHexString();

describe('visitorForPass', () => {
  it('is the visitor a pass was signed for, in the operator company', async () => {
    const visitor = await seedVisitor();

    await expect(visitorForPass(signVisitorPass(visitor._id.toHexString(), 0))).resolves.toEqual({
      id: visitor._id.toHexString(),
      name: 'Dana Reyes',
      email: 'dana@acme.test',
      phone: '+91 98000 00001',
      company: 'Acme',
      organizationId: operatorId,
    });
  });

  it('is nobody for a forged pass or another kind of pass', async () => {
    const visitor = await seedVisitor();

    await expect(visitorForPass('not-a-pass')).resolves.toBeNull();
    const other = signPass('client-hub', { sub: visitor._id.toHexString(), tv: 0 });
    await expect(visitorForPass(other)).resolves.toBeNull();
  });

  it('is nobody once the visitor is blocked, retired or deleted', async () => {
    const blocked = await seedVisitor({ email: 'b@acme.test', blocked: true });
    const retired = await seedVisitor({ email: 'r@acme.test', tokenVersion: 2 });

    await expect(visitorForPass(signVisitorPass(blocked._id.toHexString(), 0))).resolves.toBeNull();
    await expect(visitorForPass(signVisitorPass(retired._id.toHexString(), 1))).resolves.toBeNull();
    await expect(visitorForPass(signVisitorPass(missingId(), 0))).resolves.toBeNull();
  });

  it('is nobody while no company operates the platform', async () => {
    const visitor = await seedVisitor();
    await withoutOperator(operatorId);

    await expect(visitorForPass(signVisitorPass(visitor._id.toHexString(), 0))).resolves.toBeNull();
  });
});

describe('getVisitor', () => {
  it('reads one visitor with its id', async () => {
    const visitor = await seedVisitor();

    const read = await getVisitor(visitor._id.toHexString());

    expect(read.id).toBe(visitor._id.toHexString());
    expect(read.email).toBe('dana@acme.test');
  });

  it('says so when the visitor does not exist', async () => {
    expect(await codeOf(getVisitor(missingId()))).toBe('NOT_FOUND');
  });
});

describe('listVisitors and visitorStats', () => {
  beforeEach(async () => {
    await seedVisitor({ name: 'Ann', email: 'ann@one.test', company: 'One' });
    await seedVisitor({ name: 'Bob', email: 'bob@two.test', source: 'DEMO_LOGIN', blocked: true });
    await seedVisitor({ name: 'Cat', email: 'cat@three.test', source: 'DEMO_LOGIN' });
  });

  it('pages the leads newest first, each with its id', async () => {
    const page = await listVisitors({ page: 0, pageSize: 2 });

    expect(page.totalCount).toBe(3);
    expect(page.rows.map((row) => row.id)).toHaveLength(2);
    expect(page.rows.every((row) => typeof row.id === 'string')).toBe(true);
  });

  it('searches the leads by name, email, company or phone', async () => {
    const page = await listVisitors({ page: 0, pageSize: 10, search: 'one' });

    expect(page.totalCount).toBe(1);
    expect((page.rows[0] as unknown as { name: string }).name).toBe('Ann');
  });

  it('counts the leads by where they came from and whether they are blocked', async () => {
    const stats = await visitorStats();
    const bucket = (field: string, value: string) =>
      stats.counts.find((c) => c.field === field)?.buckets.find((b) => b.value === value)?.count;

    expect(stats.total).toBe(3);
    expect(bucket('source', 'WEBSITE')).toBe(1);
    expect(bucket('source', 'DEMO_LOGIN')).toBe(2);
    expect(bucket('blocked', 'true')).toBe(1);
    expect(bucket('blocked', 'false')).toBe(2);
  });
});

describe('setVisitorBlocked', () => {
  it('blocks a visitor and retires every pass they hold', async () => {
    const visitor = await seedVisitor();
    const pass = signVisitorPass(visitor._id.toHexString(), 0);

    const blocked = await setVisitorBlocked(visitor._id.toHexString(), true);

    expect(blocked).toEqual(expect.objectContaining({ blocked: true, tokenVersion: 1 }));
    await expect(visitorForPass(pass)).resolves.toBeNull();
  });

  it('unblocks a visitor without bringing an old pass back', async () => {
    const visitor = await seedVisitor({ blocked: true, tokenVersion: 1 });

    const unblocked = await setVisitorBlocked(visitor._id.toHexString(), false);

    expect(unblocked).toEqual(expect.objectContaining({ blocked: false, tokenVersion: 1 }));
    await expect(visitorForPass(signVisitorPass(visitor._id.toHexString(), 0))).resolves.toBeNull();
  });

  it('says so when the visitor does not exist', async () => {
    expect(await codeOf(setVisitorBlocked(missingId(), true))).toBe('NOT_FOUND');
  });
});

describe('deleteVisitor', () => {
  it('removes the lead', async () => {
    const visitor = await seedVisitor();

    await expect(deleteVisitor(visitor._id.toHexString())).resolves.toBe(true);
    expect(await WhatsappDemoVisitorModel.countDocuments()).toBe(0);
  });

  it('says so when the visitor does not exist', async () => {
    expect(await codeOf(deleteVisitor(missingId()))).toBe('NOT_FOUND');
  });
});
