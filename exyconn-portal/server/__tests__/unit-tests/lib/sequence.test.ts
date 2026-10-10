import { Types } from 'mongoose';
import { nextSequence } from '../../../src/lib/sequence';
import { CounterModel } from '../../../src/lib/counter.model';
import { runForOrganization } from '../../../src/lib/tenant';
import { asArg } from '../../mockAs';

describe('nextSequence', () => {
  afterEach(() => jest.restoreAllMocks());

  it('draws numbers one after another, zero-padded', async () => {
    await expect(nextSequence('invoice', 'INV-')).resolves.toBe('INV-0001');
    await expect(nextSequence('invoice', 'INV-')).resolves.toBe('INV-0002');
    const row = await CounterModel.findOne({ key: 'invoice' }).lean();
    expect(row?.seq).toBe(2);
  });

  it('keeps each series apart and honours the width', async () => {
    await nextSequence('invoice', 'INV-');
    await expect(nextSequence('po', 'PO', 6)).resolves.toBe('PO000001');
  });

  it('never hands two simultaneous callers the same number', async () => {
    await expect(nextSequence('race', 'R')).resolves.toBe('R0001');
    const drawn = await Promise.all(Array.from({ length: 4 }, () => nextSequence('race', 'R')));
    expect(new Set(drawn).size).toBe(4);
    expect([...drawn].sort((a, b) => a.localeCompare(b))).toEqual([
      'R0002',
      'R0003',
      'R0004',
      'R0005',
    ]);
  });

  it('counts each company on its own series', async () => {
    const first = new Types.ObjectId().toHexString();
    const second = new Types.ObjectId().toHexString();
    await runForOrganization(first, () => nextSequence('invoice', 'INV-'));
    await expect(runForOrganization(first, () => nextSequence('invoice', 'INV-'))).resolves.toBe(
      'INV-0002',
    );
    await expect(runForOrganization(second, () => nextSequence('invoice', 'INV-'))).resolves.toBe(
      'INV-0001',
    );
  });

  it('starts at one when the store hands back no counter', async () => {
    jest
      .spyOn(CounterModel, 'findOneAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));
    await expect(nextSequence('empty', 'E-', 3)).resolves.toBe('E-001');
  });
});
