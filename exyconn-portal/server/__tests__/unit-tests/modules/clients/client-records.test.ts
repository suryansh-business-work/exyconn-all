import { Types } from 'mongoose';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { clientNameFor, migrateClientTaxIds } from '../../../../src/modules/clients';
import {
  clientProjectOptions,
  setClientProjects,
} from '../../../../src/modules/clients/client-projects';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';

const seedClient = (name: string, extra: Record<string, unknown> = {}) =>
  ClientModel.create({
    name,
    email: `${name.toLowerCase()}@acme.test`,
    company: 'Acme',
    status: 'ACTIVE',
    ...extra,
  });

describe('clientNameFor', () => {
  it('is empty when no client is named', async () => {
    await expect(clientNameFor('')).resolves.toBe('');
    await expect(clientNameFor(null)).resolves.toBe('');
    await expect(clientNameFor(undefined)).resolves.toBe('');
  });

  it('reads the client name for an existing id', async () => {
    const client = await seedClient('Priya');

    await expect(clientNameFor(client._id.toHexString())).resolves.toBe('Priya');
  });

  it('refuses an id that is not an id, and an id that matches nobody', async () => {
    await expect(clientNameFor('not-an-id')).rejects.toThrow('That client does not exist.');
    await expect(clientNameFor(new Types.ObjectId().toHexString())).rejects.toThrow(
      'That client does not exist.',
    );
  });
});

describe('clients model', () => {
  it('defaults the optional fields and normalises codes', async () => {
    const client = await seedClient('Rahul', { country: 'in', taxId: 'ab12', currency: 'inr' });

    expect(client.toObject()).toMatchObject({
      phone: '',
      status: 'ACTIVE',
      country: 'IN',
      currency: 'INR',
      taxId: 'AB12',
      taxIdType: '',
    });
  });

  it('refuses a status that is not one of the client statuses', async () => {
    await expect(seedClient('Bad', { status: 'GONE' })).rejects.toThrow(/status/);
  });
});

describe('migrateClientTaxIds', () => {
  it('turns a legacy GSTIN into an Indian tax number, keeping a recorded country', async () => {
    await seedClient('Plain', { gstin: '27AAPFU0939F1ZV' });
    await seedClient('Abroad', { gstin: '29AAPFU0939F1ZV', country: 'AE' });
    const missing = await seedClient('Missing', { gstin: '24AAPFU0939F1ZV' });
    await ClientModel.collection.updateOne({ _id: missing._id }, { $unset: { country: '' } });

    await migrateClientTaxIds();

    const rows = await ClientModel.find().sort({ name: 1 }).lean();
    const byName = new Map(rows.map((row) => [row.name, row]));
    expect(byName.get('Plain')).toMatchObject({
      taxIdType: 'IN_GST',
      taxId: '27AAPFU0939F1ZV',
      country: 'IN',
    });
    expect(byName.get('Abroad')).toMatchObject({ taxIdType: 'IN_GST', country: 'AE' });
    expect(byName.get('Missing')).toMatchObject({ taxId: '24AAPFU0939F1ZV', country: 'IN' });
  });

  it('leaves clients that already have a tax number or no GSTIN alone', async () => {
    await seedClient('Done', { gstin: '27AAPFU0939F1ZV', taxId: 'GB123', taxIdType: 'GB_VAT' });
    await seedClient('None');

    await migrateClientTaxIds();

    const done = await ClientModel.findOne({ name: 'Done' }).lean();
    const none = await ClientModel.findOne({ name: 'None' }).lean();
    expect(done).toMatchObject({ taxId: 'GB123', taxIdType: 'GB_VAT' });
    expect(none).toMatchObject({ taxId: '', taxIdType: '', country: '' });
  });
});

describe('client projects', () => {
  it('lists every project by name with its current client', async () => {
    const client = await seedClient('Priya');
    await ProjectModel.create({
      name: 'Billing',
      status: 'ACTIVE',
      clientId: client._id.toHexString(),
      clientName: 'Priya',
    });
    const loose = await ProjectModel.create({ name: 'Alpha', status: 'ACTIVE' });

    const options = await clientProjectOptions();

    expect(options.map((option) => option.name)).toEqual(['Alpha', 'Billing']);
    expect(options[0]).toEqual({
      id: loose._id.toHexString(),
      name: 'Alpha',
      key: loose.key,
      clientId: '',
      clientName: '',
    });
    expect(options[1]).toMatchObject({ clientId: client._id.toHexString(), clientName: 'Priya' });
  });

  it('reads blanks for a project stored without key or client fields', async () => {
    const legacy = await ProjectModel.create({ name: 'Old', status: 'ACTIVE' });
    await ProjectModel.collection.updateOne(
      { _id: legacy._id },
      { $unset: { key: '', clientId: '', clientName: '' } },
    );

    const [option] = await clientProjectOptions();

    expect(option).toMatchObject({ key: '', clientId: '', clientName: '' });
  });

  it('links exactly the listed projects, moving them off other clients', async () => {
    const priya = await seedClient('Priya');
    const rahul = await seedClient('Rahul');
    const priyaId = priya._id.toHexString();
    const kept = await ProjectModel.create({ name: 'Kept', status: 'ACTIVE' });
    await ProjectModel.create({
      name: 'Dropped',
      status: 'ACTIVE',
      clientId: priyaId,
      clientName: 'Priya',
    });
    const moved = await ProjectModel.create({
      name: 'Moved',
      status: 'ACTIVE',
      clientId: rahul._id.toHexString(),
      clientName: 'Rahul',
    });

    await expect(setClientProjects(priyaId, [kept.id, moved.id])).resolves.toBe(true);

    const rows = await ProjectModel.find().lean();
    const byName = new Map(rows.map((row) => [row.name, row]));
    expect(byName.get('Kept')).toMatchObject({ clientId: priyaId, clientName: 'Priya' });
    expect(byName.get('Moved')).toMatchObject({ clientId: priyaId, clientName: 'Priya' });
    expect(byName.get('Dropped')).toMatchObject({ clientId: null, clientName: '' });
  });

  it('refuses a client that does not exist', async () => {
    await expect(setClientProjects(new Types.ObjectId().toHexString(), [])).rejects.toThrow(
      'Client not found',
    );
  });
});
