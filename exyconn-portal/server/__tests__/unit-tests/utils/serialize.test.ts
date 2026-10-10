import { Types } from 'mongoose';
import { withId, withIds } from '../../../src/utils/serialize';

describe('withId', () => {
  it('maps a Mongo _id onto a string id and keeps every other field', () => {
    const _id = new Types.ObjectId();
    const result = withId({ _id, name: 'Asha' });
    expect(result).toEqual({ _id, name: 'Asha', id: _id.toHexString() });
  });

  it('falls back to an existing id when there is no _id', () => {
    expect(withId({ id: 42, name: 'Ravi' }).id).toBe('42');
  });

  it('prefers _id over id when both are present', () => {
    expect(withId({ _id: 'primary', id: 'secondary' }).id).toBe('primary');
  });
});

describe('withIds', () => {
  it('maps every document in order', () => {
    const rows = withIds([{ _id: 'a' }, { _id: 'b' }]);
    expect(rows.map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list for no documents', () => {
    expect(withIds([])).toEqual([]);
  });
});
