import { Types } from 'mongoose';
import { crmEntitiesResolvers } from '../../../../src/modules/crm';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { emitWebhookBestEffort } from '../../../../src/modules/integrations';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

// Webhook delivery is an outbound side effect; the announcement itself is what is asserted.
jest.mock('../../../../src/modules/integrations', () => ({
  ...jest.requireActual('../../../../src/modules/integrations'),
  emitWebhookBestEffort: jest.fn(),
}));

const emitted = jest.mocked(emitWebhookBestEffort);
const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};
const missingId = () => new Types.ObjectId().toHexString();

type DealRow = { id: string; stage: string; clientId: string; value: number };

async function seedWinnableDeal(stage = 'NEGOTIATION') {
  const company = await CompanyModel.create({ name: 'Acme Ltd', domain: 'acme.com', owner: 'A' });
  await ContactModel.create({
    name: 'Ravi',
    email: 'ravi@acme.com',
    companyId: company._id.toHexString(),
    status: 'ACTIVE',
    owner: 'A',
  });
  const deal = await DealModel.create({
    title: 'Acme rollout',
    companyId: company._id.toHexString(),
    companyName: 'Acme Ltd',
    contactName: 'Ravi',
    stage,
    value: 1000,
    owner: 'A',
  });
  return { company, deal };
}

const setStage = (id: string, stage: string, ctx: GraphQLContext = asSales) =>
  crmEntitiesResolvers.Mutation.setDealStage(null, { id, stage }, ctx) as Promise<DealRow>;

const saveDeal = (id: string, input: Record<string, unknown>, ctx: GraphQLContext = asSales) =>
  crmEntitiesResolvers.Mutation.updateDeal(null, { id, input } as never, ctx) as Promise<DealRow>;

const dealInput = (companyId: string, stage: string) => ({
  title: 'Acme rollout',
  companyId,
  companyName: 'Acme Ltd',
  stage,
  value: 2000,
  probability: 60,
  owner: 'A',
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('moving a deal on the board', () => {
  it('announces the win with the client it was billed to', async () => {
    const { deal } = await seedWinnableDeal();

    const won = await setStage(deal._id.toHexString(), 'WON');

    expect(emitted).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveBeenCalledWith(
      'deal.won',
      expect.objectContaining({
        dealId: won.id,
        title: 'Acme rollout',
        companyName: 'Acme Ltd',
        contactName: 'Ravi',
        value: 1000,
        owner: 'A',
        clientId: won.clientId,
        wonAt: expect.any(String),
      }),
    );
  });

  it('refuses somebody outside the CRM role', async () => {
    const { deal } = await seedWinnableDeal();

    await expect(setStage(deal._id.toHexString(), 'WON', asEmployee)).rejects.toThrow();
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });

  it('reports a deal that does not exist', async () => {
    await expect(setStage(missingId(), 'PROPOSAL')).rejects.toThrow('Deal not found');
  });

  it('reports a deal deleted between the read and the write', async () => {
    const { deal } = await seedWinnableDeal();
    jest
      .spyOn(DealModel, 'findByIdAndUpdate')
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

    await expect(setStage(deal._id.toHexString(), 'PROPOSAL')).rejects.toThrow('Deal not found');
    expect(emitted).not.toHaveBeenCalled();
  });

  it('gives a legacy deal with no client field an empty one when it moves', async () => {
    const { insertedId } = await DealModel.collection.insertOne({
      title: 'Legacy deal',
      stage: 'QUALIFYING',
      value: 10,
      probability: 10,
      owner: 'A',
    });

    const moved = await setStage(String(insertedId), 'DISCOVERY');

    expect(moved).toMatchObject({ stage: 'DISCOVERY', clientId: '' });
    expect(emitted).not.toHaveBeenCalled();
  });
});

describe('saving a deal from the form', () => {
  it('saves a deal that is not won without filing a client or announcing anything', async () => {
    const { company, deal } = await seedWinnableDeal();

    const saved = await saveDeal(
      deal._id.toHexString(),
      dealInput(company._id.toHexString(), 'PROPOSAL'),
    );

    expect(saved).toMatchObject({ stage: 'PROPOSAL', value: 2000 });
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
    expect(emitted).not.toHaveBeenCalled();
  });

  it('announces a win saved from the form once', async () => {
    const { company, deal } = await seedWinnableDeal();

    const saved = await saveDeal(
      deal._id.toHexString(),
      dealInput(company._id.toHexString(), 'WON'),
    );

    expect(emitted).toHaveBeenCalledWith(
      'deal.won',
      expect.objectContaining({ dealId: saved.id, clientId: saved.clientId, value: 2000 }),
    );
  });

  it('does not announce a deal that was already won when it is saved again', async () => {
    const { company, deal } = await seedWinnableDeal('WON');

    const saved = await saveDeal(
      deal._id.toHexString(),
      dealInput(company._id.toHexString(), 'WON'),
    );

    expect(saved.clientId).not.toBe('');
    expect(emitted).not.toHaveBeenCalled();
  });

  it('reports a won deal that does not exist', async () => {
    await expect(saveDeal(missingId(), dealInput('', 'WON'))).rejects.toThrow('Deal not found');
  });

  it('refuses a caller without the CRM role before filing any client', async () => {
    const { company, deal } = await seedWinnableDeal();

    await expect(
      saveDeal(deal._id.toHexString(), dealInput(company._id.toHexString(), 'WON'), asEmployee),
    ).rejects.toThrow();
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });
});

describe('the pipeline forecast and read fields', () => {
  it('reads an empty pipeline as zeros', async () => {
    await expect(crmEntitiesResolvers.Query.dealForecast(null, {}, asSales)).resolves.toEqual({
      openCount: 0,
      openValue: 0,
      weightedValue: 0,
    });
  });

  it('is refused to somebody outside the CRM role', async () => {
    await expect(crmEntitiesResolvers.Query.dealForecast(null, {}, asEmployee)).rejects.toThrow();
  });

  it('reads a missing client link as empty and not a client', () => {
    expect(crmEntitiesResolvers.Company.clientId({})).toBe('');
    expect(crmEntitiesResolvers.Company.isClient({})).toBe(false);
    expect(crmEntitiesResolvers.Company.clientId({ clientId: 'c-1' })).toBe('c-1');
    expect(crmEntitiesResolvers.Deal.clientId({ clientId: null })).toBe('');
    expect(crmEntitiesResolvers.Deal.clientId({ clientId: 'c-2' })).toBe('c-2');
  });
});
