import { Types } from 'mongoose';
import {
  OrganizationModel,
  ensurePlatformOperatorOrganization,
  forEachOrganization,
  repairStoredCurrencies,
} from '../../../../src/modules/organizations';
import { BudgetModel } from '../../../../src/modules/finance/budget.model';
import {
  currentOrganizationId,
  runAsPlatform,
  runForOrganization,
} from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';

async function company(name: string, fields: Record<string, unknown> = {}): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD', ...fields }),
  );
  return created._id.toHexString();
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('forEachOrganization', () => {
  it('runs the work once inside each active company, and skips a suspended one', async () => {
    const alpha = await company('Alpha');
    const beta = await company('Beta');
    await company('Gamma', { status: 'SUSPENDED' });
    const seen: Array<string | null> = [];

    await forEachOrganization(async () => {
      seen.push(currentOrganizationId());
    });

    expect(seen).toHaveLength(2);
    expect(seen).toEqual(expect.arrayContaining([alpha, beta]));
  });

  it('logs one company failing and still runs the rest', async () => {
    const alpha = await company('Alpha');
    const beta = await company('Beta');
    const failure = new Error('bad setting');
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const finished: Array<string | null> = [];

    await forEachOrganization(async () => {
      if (currentOrganizationId() === alpha) {
        throw failure;
      }
      finished.push(currentOrganizationId());
    });

    expect(finished).toEqual([beta]);
    expect(logged).toHaveBeenCalledWith(failure, 'scheduled work failed for Alpha');
  });

  it('names the work it was given in the failure', async () => {
    await company('Alpha');
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await forEachOrganization(() => Promise.reject(new Error('down')), 'nightly digest');

    expect(logged).toHaveBeenCalledWith(expect.any(Error), 'nightly digest failed for Alpha');
  });

  it('does nothing when there is no active company', async () => {
    const work = jest.fn().mockResolvedValue(undefined);

    await forEachOrganization(work);

    expect(work).not.toHaveBeenCalled();
  });
});

describe('ensurePlatformOperatorOrganization', () => {
  it('flags the oldest company and says so', async () => {
    const oldest = await company('Exyconn', { createdAt: new Date('2024-01-01') });
    await company('Acme', { createdAt: new Date('2025-01-01') });
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await ensurePlatformOperatorOrganization();

    const flagged = await runAsPlatform(() =>
      OrganizationModel.find({ isPlatformOperator: true }).lean(),
    );
    expect(flagged.map((row) => String(row._id))).toEqual([oldest]);
    expect(warned).toHaveBeenCalledWith(`Flagged Exyconn (${oldest}) as the platform operator`);
  });

  it('stays quiet when a racing instance flagged the company first', async () => {
    await company('Exyconn', { isPlatformOperator: true });
    // The other instance's write lands between this one's check and its update.
    jest.spyOn(OrganizationModel, 'exists').mockResolvedValueOnce(null);
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await ensurePlatformOperatorOrganization();

    expect(warned).not.toHaveBeenCalled();
    expect(
      await runAsPlatform(() => OrganizationModel.countDocuments({ isPlatformOperator: true })),
    ).toBe(1);
  });
});

describe('repairStoredCurrencies for a company without an ISO currency', () => {
  it('leaves every record alone and warns, rather than guessing a currency', async () => {
    const id = await company('Legacy', { currency: 'rupees' });
    const _id = new Types.ObjectId();
    await BudgetModel.collection.insertOne({
      _id,
      organizationId: new Types.ObjectId(id),
      costCenterId: 'CC-1',
      month: '2026-03',
      amount: 1000,
      currency: '₹',
    });
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const repaired = await runForOrganization(id, repairStoredCurrencies);

    expect(repaired).toBe(0);
    expect(warned).toHaveBeenCalledWith(
      { currency: 'RUPEES' },
      'Organization currency is not ISO 4217; stored currencies left',
    );
    expect((await BudgetModel.collection.findOne({ _id }))?.currency).toBe('₹');
  });
});
