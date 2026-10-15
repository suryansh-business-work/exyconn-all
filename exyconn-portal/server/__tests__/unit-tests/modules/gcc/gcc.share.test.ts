import { gccResolvers } from '../../../../src/modules/gcc';
import { GccShareModel } from '../../../../src/modules/gcc/gcc.model';
import { createGccShare, sharedGccEstimate } from '../../../../src/modules/gcc/gcc.share';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { solvedCaptcha } from '../../../helpers';
import { codeOf } from '../codeOf';
import { gccEstimateJson } from './gcc.fixtures';

const IP = '198.51.100.41';
const visitor: GraphQLContext = { user: null, ip: IP };

const create = (input: { estimateJson: string; expiresInDays: number; consent: boolean }) =>
  gccResolvers.Mutation.createGccShare(null, { input, captcha: solvedCaptcha() }, visitor);

const read = (token: string) => gccResolvers.Query.sharedGccEstimate(null, { token }, visitor);

const revoke = (token: string, revokeKey: string) =>
  gccResolvers.Mutation.revokeGccShare(null, { token, revokeKey }, visitor);

describe('GCC estimate share links', () => {
  it('stores the estimate behind a link that can be read, then revoked', async () => {
    const estimateJson = gccEstimateJson();
    const link = await create({ estimateJson, expiresInDays: 7, consent: true });

    expect(link.token).toMatch(/^[a-f\d]{64}$/);
    expect(link.revokeKey).toMatch(/^[a-f\d]{64}$/);
    expect(await read(link.token)).toEqual({ estimateJson, expiresAt: link.expiresAt });

    expect(await revoke(link.token, link.revokeKey)).toBe(true);
    expect(await read(link.token)).toBeNull();
    const stored = await GccShareModel.findOne().lean();
    expect(stored?.estimateJson).toBe('');
  });

  it('keeps only hashes of the token and the revoke key', async () => {
    const link = await create({ estimateJson: gccEstimateJson(), expiresInDays: 1, consent: true });

    const stored = await GccShareModel.findOne().lean();
    expect(stored?.tokenHash).not.toBe(link.token);
    expect(stored?.revokeKeyHash).not.toBe(link.revokeKey);
    expect(JSON.stringify(stored)).not.toContain(link.token);
  });

  it('will not revoke with the wrong key', async () => {
    const link = await create({ estimateJson: gccEstimateJson(), expiresInDays: 7, consent: true });

    expect(await revoke(link.token, 'f'.repeat(64))).toBe(false);
    expect(await revoke(link.token, 'not-a-key')).toBe(false);
    expect(await read(link.token)).not.toBeNull();
  });

  it('answers null for an expired link', async () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const link = await createGccShare(
      { estimateJson: gccEstimateJson(), expiresInDays: 1, consent: true },
      solvedCaptcha(),
      IP,
      created,
    );

    expect(
      await sharedGccEstimate(link.token, IP, new Date('2026-01-01T23:59:00.000Z')),
    ).not.toBeNull();
    expect(
      await sharedGccEstimate(link.token, IP, new Date('2026-01-02T00:00:01.000Z')),
    ).toBeNull();
  });

  it('answers null for a malformed or unknown token', async () => {
    expect(await read('../../etc/passwd')).toBeNull();
    expect(await read('a'.repeat(64))).toBeNull();
  });

  it('needs the visitor to agree to the estimate being stored', async () => {
    expect(
      await codeOf(create({ estimateJson: gccEstimateJson(), expiresInDays: 7, consent: false })),
    ).toBe('BAD_USER_INPUT');
    expect(await GccShareModel.countDocuments()).toBe(0);
  });

  it.each([0, 31, 1.5])('refuses a link that expires in %s days', async (expiresInDays) => {
    expect(
      await codeOf(create({ estimateJson: gccEstimateJson(), expiresInDays, consent: true })),
    ).toBe('BAD_USER_INPUT');
  });

  it('refuses an estimate that fails the schema or carries a prototype key', async () => {
    for (const estimateJson of [gccEstimateJson({ scenarios: [] }), '{"constructor":{}}']) {
      expect(await codeOf(create({ estimateJson, expiresInDays: 7, consent: true }))).toBe(
        'BAD_USER_INPUT',
      );
    }
    expect(await GccShareModel.countDocuments()).toBe(0);
  });

  it('purges links once they expire', () => {
    expect(GccShareModel.schema.indexes()).toContainEqual([
      { expiresAt: 1 },
      expect.objectContaining({ expireAfterSeconds: 0 }),
    ]);
  });
});
