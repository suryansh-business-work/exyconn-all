import mongoose, { Schema, Types } from 'mongoose';
import {
  ORGANIZATION_FIELD,
  TenantScopeError,
  runAsPlatform,
  runForOrganization,
  runInScope,
  setDefaultScope,
} from '../../../../src/lib/tenant';

// Indexes are only inspected here, never built: the behaviour under test is the declaration.
const probeSchema = new Schema(
  {
    code: { type: String, unique: true },
    handle: { type: String, unique: true, sparse: true },
    tag: { type: String, index: true },
    plain: String,
    year: Number,
  },
  { autoIndex: false },
);
probeSchema.index({ plain: 1, year: 1 }, { unique: true });
probeSchema.index({ year: -1 });
const Probe = mongoose.model('TenantPluginProbe', probeSchema);

const orgA = new Types.ObjectId().toHexString();
const orgB = new Types.ObjectId().toHexString();
const inA = <T>(fn: () => T | Promise<T>) => runForOrganization(orgA, fn);
const inB = <T>(fn: () => T | Promise<T>) => runForOrganization(orgB, fn);

afterEach(() => setDefaultScope({ organizationId: null, platform: true }));

describe('the schema a tenant model gets', () => {
  const indexes = probeSchema.indexes();
  const keysOf = (fields: Record<string, unknown>) => Object.keys(fields);

  it('carries an indexed organization reference', () => {
    expect(probeSchema.path(ORGANIZATION_FIELD)).toBeDefined();
    expect(indexes.some(([fields]) => keysOf(fields).join() === ORGANIZATION_FIELD)).toBe(true);
  });

  it('makes a path-level unique field unique within the organization', () => {
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ organizationId: 1, code: 1 }, expect.objectContaining({ unique: true, sparse: false })],
        [{ organizationId: 1, handle: 1 }, expect.objectContaining({ unique: true, sparse: true })],
      ]),
    );
    expect(indexes.some(([fields]) => keysOf(fields).join() === 'code')).toBe(false);
  });

  it('puts the organization first in a declared compound unique', () => {
    const compound = indexes.find(([fields]) => 'plain' in fields);
    expect(compound && keysOf(compound[0])).toEqual([ORGANIZATION_FIELD, 'plain', 'year']);
  });

  it('leaves plain indexes alone', () => {
    expect(indexes.some(([fields]) => keysOf(fields).join() === 'year')).toBe(true);
    expect(indexes.some(([fields]) => keysOf(fields).join() === 'tag')).toBe(true);
  });
});

describe('reads and writes', () => {
  it('stamps a write and filters every read by the organization', async () => {
    const created = await inA(() => Probe.create({ code: 'A-1' }));
    expect(String(created.get(ORGANIZATION_FIELD))).toBe(orgA);

    await expect(inA(() => Probe.find().lean())).resolves.toHaveLength(1);
    await expect(inB(() => Probe.find().lean())).resolves.toHaveLength(0);
    await expect(inB(() => Probe.findById(created._id).lean())).resolves.toBeNull();
    await expect(inB(() => Probe.countDocuments())).resolves.toBe(0);
    await expect(inB(() => Probe.updateMany({}, { tag: 'x' }))).resolves.toMatchObject({
      modifiedCount: 0,
    });
    await expect(runAsPlatform(() => Probe.countDocuments())).resolves.toBe(1);
  });

  it('confines an aggregation to the organization', async () => {
    await inA(() => Probe.create({ code: 'A' }));
    await inB(() => Probe.create({ code: 'B' }));
    const count = [{ $count: 'n' }];
    await expect(inA(() => Probe.aggregate(count))).resolves.toEqual([{ n: 1 }]);
    await expect(runAsPlatform(() => Probe.aggregate(count))).resolves.toEqual([{ n: 2 }]);
  });

  it('stamps every document of a bulk insert', async () => {
    const docs = await inA(() => Probe.insertMany([{ code: 'x' }, { code: 'y' }]));
    expect(docs.map((doc) => String(doc.get(ORGANIZATION_FIELD)))).toEqual([orgA, orgA]);
  });

  it('refuses a bulk insert that carries another organization’s record', async () => {
    const foreign = { code: 'z', organizationId: new Types.ObjectId(orgB) };
    await expect(inA(() => Probe.insertMany([foreign]))).rejects.toThrow(
      /insertMany\(\) tried to write another organization's record/,
    );
  });

  it('refuses to save a record into another organization, but accepts its own', async () => {
    const foreign = new Probe({ code: 'f', organizationId: new Types.ObjectId(orgB) });
    await expect(inA(() => foreign.save())).rejects.toBeInstanceOf(TenantScopeError);

    const own = new Probe({ code: 'o', organizationId: new Types.ObjectId(orgA) });
    await expect(inA(() => own.save())).resolves.toBe(own);
  });

  it('writes a platform record without an organization', async () => {
    const doc = await runAsPlatform(() => Probe.create({ code: 'P' }));
    expect(doc.get(ORGANIZATION_FIELD)).toBeUndefined();
  });
});

describe('without an organization', () => {
  it('refuses every operation when no scope exists', async () => {
    setDefaultScope(null);
    await expect(Probe.find().exec()).rejects.toThrow(/TenantPluginProbe\.find\(\)/);
    await expect(Probe.aggregate([{ $count: 'n' }]).exec()).rejects.toThrow(
      /TenantPluginProbe\.aggregate\(\)/,
    );
    await expect(Probe.create({ code: 'n' })).rejects.toThrow(/TenantPluginProbe\.save\(\)/);
  });

  it('refuses a company scope that names no company', async () => {
    const empty = { organizationId: null, platform: false };
    await expect(runInScope(empty, () => Probe.findOne().exec())).rejects.toBeInstanceOf(
      TenantScopeError,
    );
    await expect(runInScope(empty, () => Probe.insertMany([{ code: 'q' }]))).rejects.toThrow(
      /insertMany\(\)/,
    );
  });
});
