import { Types } from 'mongoose';
import {
  AuditLogModel,
  SYSTEM_ACTOR,
  diffChanges,
  entityLabelOf,
  recordAudit,
  recordSystemAudit,
} from '../../src/modules/audit';
import { UserModel } from '../../src/modules/admin/user.model';
import { logger } from '../../src/utils/logger';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import ips from '../fixtures/ips.json';

afterEach(() => jest.restoreAllMocks());

describe('entityLabelOf', () => {
  it('has nothing to say about a missing or non-object row', () => {
    expect(entityLabelOf(null)).toBe('');
    expect(entityLabelOf(undefined)).toBe('');
    expect(entityLabelOf('INV-1')).toBe('');
  });

  it('skips blank naming fields and falls back to the module s own fields', () => {
    expect(entityLabelOf({ name: '   ', vendor: 'Acme Supplies' }, ['vendor'])).toBe(
      'Acme Supplies',
    );
    expect(entityLabelOf({ key: 'SMTP_HOST' })).toBe('SMTP_HOST');
    expect(entityLabelOf({ vendor: 7 }, ['vendor'])).toBe('');
  });
});

describe('diffChanges', () => {
  it('reads a missing previous row as empty', () => {
    expect(diffChanges(null, { name: 'New' })).toEqual({ name: { from: null, to: 'New' } });
  });

  it('ignores bookkeeping keys and treats undefined and null as the same', () => {
    const changes = diffChanges(
      { _id: 'a', updatedAt: new Date('2026-01-01'), note: null },
      { _id: 'b', id: 'b', __v: 3, createdAt: new Date(), updatedAt: new Date(), note: undefined },
    );
    expect(changes).toEqual({});
  });

  it('compares ids by their hex string and nested values field by field', () => {
    const id = new Types.ObjectId();
    const before = {
      ownerId: id,
      tags: ['a'],
      address: { city: 'Pune', since: new Date('2026-01-01') },
    };

    expect(diffChanges(before, { ownerId: new Types.ObjectId(String(id)) })).toEqual({});
    expect(
      diffChanges(before, {
        tags: ['a', 'b'],
        address: { city: 'Pune', since: new Date('2026-01-01') },
      }),
    ).toEqual({ tags: { from: ['a'], to: ['a', 'b'] } });
    expect(diffChanges(before, { address: { city: 'Goa' } })).toEqual({
      address: {
        from: { city: 'Pune', since: '2026-01-01T00:00:00.000Z' },
        to: { city: 'Goa' },
      },
    });
  });

  it('never records a token hash, even when it changed', () => {
    expect(
      diffChanges({ tokenHash: 'a', password: 'b' }, { tokenHash: 'c', password: 'd' }),
    ).toEqual({});
  });
});

describe('recordAudit', () => {
  const entry = { action: 'UPDATE' as const, module: 'Invoice', summary: 'Changed the amount' };

  it('writes the actor it is given, without looking anybody up', async () => {
    const lookup = jest.spyOn(UserModel, 'findById');

    await recordAudit(
      { user: null, ip: ips.ip10_1_1_1 },
      {
        ...entry,
        entityId: 42,
        entityLabel: 'INV-9',
        actor: { id: 'u1', name: 'Asha', email: 'a@x.com' },
      },
    );

    const row = await AuditLogModel.findOne().lean();
    expect(row).toMatchObject({
      actorId: 'u1',
      actorName: 'Asha',
      actorEmail: 'a@x.com',
      entityId: '42',
      entityLabel: 'INV-9',
      ip: ips.ip10_1_1_1,
      changes: '',
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('looks up the signed-in caller s name when the token carries none', async () => {
    const user = await UserModel.create({
      name: 'Ravi Kumar',
      email: 'ravi@exyconn.com',
      passwordHash: 'x',
      roles: [ROLES.FINANCE],
    });
    const ctx: GraphQLContext = {
      user: { id: String(user._id), roles: [], email: 'ravi@exyconn.com' },
    };

    await recordAudit(ctx, { ...entry, changes: { amount: { from: 1, to: 2 } } });

    const row = await AuditLogModel.findOne().lean();
    expect(row).toMatchObject({ actorName: 'Ravi Kumar', actorEmail: 'ravi@exyconn.com', ip: '' });
    expect(JSON.parse(row?.changes ?? '')).toEqual({ amount: { from: 1, to: 2 } });
  });

  it('leaves the name blank for an id that is not a user id, or a user who has gone', async () => {
    await recordAudit({ user: { id: 'api-key', roles: [], email: '' } }, entry);
    await recordAudit(
      { user: { id: String(new Types.ObjectId()), roles: [], email: '' } },
      { ...entry, changes: {} },
    );

    const rows = await AuditLogModel.find().lean();
    expect(rows.map((row) => row.actorName)).toEqual(['', '']);
    expect(rows.map((row) => row.changes)).toEqual(['', '']);
  });

  it('writes an anonymous row when there is neither an actor nor a caller', async () => {
    await recordAudit({ user: null }, entry);

    const row = await AuditLogModel.findOne().lean();
    expect(row).toMatchObject({ actorId: '', actorName: '', actorEmail: '', entityId: '' });
  });

  it('logs a failed write instead of throwing it', async () => {
    jest.spyOn(AuditLogModel, 'create').mockRejectedValueOnce(new Error('disk full'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await expect(recordAudit({ user: null }, entry)).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ entry: expect.objectContaining({ module: 'Invoice' }) }),
      'Audit log write failed',
    );
  });

  it('files a scheduled job s change under the system', async () => {
    await recordSystemAudit({ ...entry, summary: 'Marked overdue' });

    const row = await AuditLogModel.findOne().lean();
    expect(row).toMatchObject({
      actorId: SYSTEM_ACTOR.id,
      actorName: 'System',
      summary: 'Marked overdue',
    });
    expect(Object.isFrozen(SYSTEM_ACTOR)).toBe(true);
  });
});
