import type { GraphQLError } from 'graphql';
import { assertNotOwnRecord, refuseOwnRecordWrites } from '../../../src/lib/permissions';
import { ROLES } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const CALLER = '64b000000000000000000001';
const OTHER = '64b000000000000000000002';

const caller: GraphQLContext = {
  user: { id: CALLER, email: 'hr@example.com', roles: [ROLES.HR] },
};

const codeOf = (fn: () => unknown) => {
  try {
    fn();
    return 'ALLOWED';
  } catch (error) {
    return (error as GraphQLError).extensions?.code;
  }
};

describe('assertNotOwnRecord', () => {
  it('refuses a decision about the caller’s own record', () => {
    expect(() => assertNotOwnRecord(caller, CALLER, 'approve leave')).toThrow(
      'You cannot approve leave for yourself.',
    );
  });

  it('compares ids as strings, so an ObjectId-like value is caught too', () => {
    const objectIdLike = { toString: () => CALLER };
    expect(codeOf(() => assertNotOwnRecord(caller, objectIdLike, 'set salary'))).toBe('FORBIDDEN');
  });

  it('allows a decision about somebody else, or about nobody in particular', () => {
    expect(codeOf(() => assertNotOwnRecord(caller, OTHER, 'approve leave'))).toBe('ALLOWED');
    expect(codeOf(() => assertNotOwnRecord(caller, null, 'approve leave'))).toBe('ALLOWED');
    expect(codeOf(() => assertNotOwnRecord(caller, undefined, 'approve leave'))).toBe('ALLOWED');
  });

  it('has nothing to compare when nobody is signed in', () => {
    expect(codeOf(() => assertNotOwnRecord({ user: null }, CALLER, 'approve leave'))).toBe(
      'ALLOWED',
    );
  });
});

describe('refuseOwnRecordWrites', () => {
  const build = (storedEmployee: string | null) => {
    const createLeave = jest.fn().mockResolvedValue('created');
    const updateLeave = jest.fn().mockResolvedValue('updated');
    const deleteLeave = jest.fn().mockResolvedValue(true);
    const employeeIdOf = jest.fn().mockResolvedValue(storedEmployee);
    const wrapped = refuseOwnRecordWrites(
      { createLeave, updateLeave, deleteLeave },
      'Leave',
      employeeIdOf,
    );
    return { wrapped, createLeave, updateLeave, deleteLeave, employeeIdOf };
  };

  it('creates a record for somebody else', async () => {
    const { wrapped, createLeave } = build(null);
    const args = { input: { employeeId: OTHER } } as never;
    await expect(wrapped.createLeave(null, args, caller)).resolves.toBe('created');
    expect(createLeave).toHaveBeenCalledWith(null, args, caller);
  });

  it('refuses to create the caller’s own record', () => {
    const { wrapped, createLeave } = build(null);
    const args = { input: { employeeId: CALLER } } as never;
    expect(() => wrapped.createLeave(null, args, caller)).toThrow(
      'You cannot edit your own Leave for yourself.',
    );
    expect(createLeave).not.toHaveBeenCalled();
  });

  it('creates without an input employee', async () => {
    const { wrapped } = build(null);
    await expect(wrapped.createLeave(null, {}, caller)).resolves.toBe('created');
  });

  it('updates somebody else’s stored record', async () => {
    const { wrapped, updateLeave, employeeIdOf } = build(OTHER);
    const args = { id: 'leave-1', input: { status: 'APPROVED' } } as never;
    await expect(wrapped.updateLeave(null, args, caller)).resolves.toBe('updated');
    expect(employeeIdOf).toHaveBeenCalledWith('leave-1');
    expect(updateLeave).toHaveBeenCalledWith(null, args, caller);
  });

  it('refuses an update whose input names the caller', async () => {
    const { wrapped, employeeIdOf } = build(OTHER);
    const args = { id: 'leave-1', input: { employeeId: CALLER } } as never;
    await expect(wrapped.updateLeave(null, args, caller)).rejects.toThrow('edit your own Leave');
    expect(employeeIdOf).not.toHaveBeenCalled();
  });

  it('refuses an update to the caller’s stored record, whatever the input says', async () => {
    const { wrapped, updateLeave } = build(CALLER);
    const args = { id: 'leave-1', input: { employeeId: OTHER } } as never;
    await expect(wrapped.updateLeave(null, args, caller)).rejects.toThrow('edit your own Leave');
    expect(updateLeave).not.toHaveBeenCalled();
  });

  it('skips the stored-record read when nobody is signed in', async () => {
    const { wrapped, employeeIdOf } = build(CALLER);
    await expect(wrapped.updateLeave(null, { id: 'leave-1' }, { user: null })).resolves.toBe(
      'updated',
    );
    expect(employeeIdOf).not.toHaveBeenCalled();
  });

  it('leaves the other mutations untouched', () => {
    const { wrapped, deleteLeave } = build(null);
    expect(wrapped.deleteLeave).toBe(deleteLeave);
  });
});
