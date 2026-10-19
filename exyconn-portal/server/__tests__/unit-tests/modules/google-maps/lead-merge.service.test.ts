import { Types } from 'mongoose';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { mergeLead } from '../../../../src/modules/google-maps/lead-merge.service';
import type { LeadImportInput } from '../../../../src/modules/google-maps/lead-row';
import { asArg } from '../../../mockAs';

const lead = (over: Partial<LeadImportInput> = {}): LeadImportInput => ({
  placeId: 'place-1',
  name: 'Smile Dental',
  lat: 18.52,
  lng: 73.85,
  ...over,
});

/** A write that finds the company changed under it: no document matched the guard. */
const changedUnderneath = () => asArg({ select: () => ({ lean: async () => null }) });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('mergeLead', () => {
  it('says the company is gone when it was deleted', async () => {
    await expect(mergeLead(lead(), new Types.ObjectId())).resolves.toEqual({ outcome: 'GONE' });
  });

  it('adds nothing to a company that already has everything the lead brings', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });

    const merge = await mergeLead(lead(), company._id);

    expect(merge.outcome).toBe('NOTHING_NEW');
    expect(merge).toMatchObject({ company: { name: 'Smile Dental' } });
  });

  it('fills the empty fields and appends new contact points without changing anything', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: 'Ravi',
      city: 'Pune',
      emails: [{ address: 'old@smile.example', label: 'Work', primary: true }],
      phones: [{ number: '+91 20 1234 5678', label: 'Office', primary: true }],
      phone: '+91 20 1234 5678',
    });

    const merge = await mergeLead(
      lead({
        address: '12 MG Road',
        website: 'https://smile.example',
        emails: ['new@smile.example'],
        phone: '+91 22 5555 0000',
      }),
      company._id,
    );

    expect(merge.outcome).toBe('MERGED');
    const added = merge.outcome === 'MERGED' ? merge.added.map((extra) => extra.field) : [];
    expect(added).toEqual([
      'website',
      'address',
      'placeId',
      'coordinates',
      'emails',
      'phones',
    ]);
    const stored = await CompanyModel.findById(company._id).lean();
    expect(stored).toMatchObject({
      owner: 'Ravi',
      city: 'Pune',
      address: '12 MG Road',
      website: 'https://smile.example',
      placeId: 'place-1',
      lat: 18.52,
      lng: 73.85,
      phone: '+91 20 1234 5678',
    });
    expect(stored?.emails?.map((point) => [point.address, point.primary])).toEqual([
      ['old@smile.example', true],
      ['new@smile.example', false],
    ]);
    expect(stored?.phones?.map((point) => [point.number, point.label, point.primary])).toEqual([
      ['+91 20 1234 5678', 'Office', true],
      ['+91 22 5555 0000', 'Work', false],
    ]);
  });

  it('merges into a company saved before timestamps existed', async () => {
    const _id = new Types.ObjectId();
    await CompanyModel.collection.insertOne({
      _id,
      name: 'Old Row',
      domain: 'old.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });

    const merge = await mergeLead(lead({ address: '1 High St' }), _id);

    expect(merge.outcome).toBe('MERGED');
    await expect(CompanyModel.findById(_id).lean()).resolves.toMatchObject({
      address: '1 High St',
    });
  });

  it('makes a phone-less company’s first phone its primary, and skips a blank one', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });
    const other = await CompanyModel.create({
      name: 'Other',
      domain: 'other.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });

    await mergeLead(lead({ phone: '+91 22 5555 0000' }), company._id);
    const blank = await mergeLead(lead({ phone: '   ' }), other._id);

    await expect(CompanyModel.findById(company._id).lean()).resolves.toMatchObject({
      phone: '+91 22 5555 0000',
      phones: [expect.objectContaining({ number: '+91 22 5555 0000', primary: true })],
    });
    expect(blank.outcome).toBe('MERGED');
    await expect(CompanyModel.findById(other._id).lean()).resolves.toMatchObject({
      phone: '',
      phones: [],
    });
  });

  it('re-reads and tries again when a colleague changed the company in between', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });
    const original = CompanyModel.findOneAndUpdate.bind(CompanyModel);
    const write = jest
      .spyOn(CompanyModel, 'findOneAndUpdate')
      .mockImplementationOnce(changedUnderneath)
      .mockImplementation((...args: Parameters<typeof original>) => original(...args));

    const merge = await mergeLead(lead({ address: '12 MG Road' }), company._id);

    expect(merge.outcome).toBe('MERGED');
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('gives up as busy when the company keeps changing', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
    });
    const write = jest
      .spyOn(CompanyModel, 'findOneAndUpdate')
      .mockImplementation(changedUnderneath);

    await expect(mergeLead(lead({ address: '12 MG Road' }), company._id)).resolves.toEqual({
      outcome: 'BUSY',
    });
    expect(write).toHaveBeenCalledTimes(3);
    await expect(CompanyModel.findById(company._id).lean()).resolves.toMatchObject({
      address: '',
    });
  });

  it('never overwrites a field a colleague filled after it was read', async () => {
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });
    const original = CompanyModel.findOneAndUpdate.bind(CompanyModel);
    jest
      .spyOn(CompanyModel, 'findOneAndUpdate')
      .mockImplementationOnce((...args: Parameters<typeof original>) => {
        // The colleague's edit lands between the merge's read and its write.
        return asArg({
          select: () => ({
            lean: async () => {
              await CompanyModel.collection.updateOne(
                { _id: company._id },
                { $set: { address: 'Typed by Ravi' } },
              );
              return original(...args)
                .select('_id')
                .lean();
            },
          }),
        });
      })
      .mockImplementation((...args: Parameters<typeof original>) => original(...args));

    const merge = await mergeLead(lead({ address: '12 MG Road' }), company._id);

    expect(merge.outcome).toBe('NOTHING_NEW');
    await expect(CompanyModel.findById(company._id).lean()).resolves.toMatchObject({
      address: 'Typed by Ravi',
    });
  });
});
