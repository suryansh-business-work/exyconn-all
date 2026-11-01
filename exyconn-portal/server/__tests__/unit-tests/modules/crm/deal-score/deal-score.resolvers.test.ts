import { Types } from 'mongoose';
import { dealScoreResolvers, startDealScoring } from '../../../../../src/modules/crm/deal-score';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { OrganizationModel } from '../../../../../src/modules/organizations';
import { findBackgroundJob } from '../../../../../src/modules/tech/jobs.registry';
import { JOB_KEYS, readJobRuns } from '../../../../../src/utils/jobHeartbeat';
import { logger } from '../../../../../src/utils/logger';
import { runAsPlatform, runForOrganization } from '../../../../../src/lib/tenant';
import { ROLES } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};

const openDeal = () => DealModel.create({ title: 'Acme rollout', owner: 'A', stage: 'PROPOSAL' });

/** The first tick runs in the background; wait until it has reported. */
async function heartbeat(): Promise<string | undefined> {
  for (let i = 0; i < 100; i += 1) {
    const run = readJobRuns().get(JOB_KEYS.crmDealScores);
    if (run) return run.summary;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return undefined;
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('Deal fields', () => {
  it('reads a deal saved before scoring existed as unscored', () => {
    const { Deal } = dealScoreResolvers;

    expect(Deal.score({})).toBeNull();
    expect(Deal.scoreReasons({})).toEqual([]);
    expect(Deal.scoredAt({})).toBeNull();
  });

  it('passes a scored deal through as stored', () => {
    const { Deal } = dealScoreResolvers;
    const at = new Date();
    const reasons = [{ text: 'PROPOSAL stage', impact: 50 }];

    expect(Deal.score({ score: 0 })).toBe(0);
    expect(Deal.scoreReasons({ scoreReasons: reasons })).toBe(reasons);
    expect(Deal.scoredAt({ scoredAt: at })).toBe(at);
  });
});

describe('scoreDeal and scoreOpenDeals mutations', () => {
  it('score on demand for the CRM team', async () => {
    const deal = await openDeal();

    await expect(
      dealScoreResolvers.Mutation.scoreDeal(null, { id: deal._id.toHexString() }, asSales),
    ).resolves.toMatchObject({ id: deal._id.toHexString(), score: expect.any(Number) });
    await expect(dealScoreResolvers.Mutation.scoreOpenDeals(null, {}, asSales)).resolves.toBe(1);
  });

  it('refuse somebody outside the CRM team before touching a deal', async () => {
    const deal = await openDeal();

    expect(() =>
      dealScoreResolvers.Mutation.scoreDeal(null, { id: deal._id.toHexString() }, asEmployee),
    ).toThrow();
    expect(() => dealScoreResolvers.Mutation.scoreOpenDeals(null, {}, asEmployee)).toThrow();
    expect(() => dealScoreResolvers.Mutation.scoreOpenDeals(null, {}, { user: null })).toThrow();
    expect((await DealModel.findById(deal._id).lean())?.scoredAt).toBeNull();
  });
});

describe('the background job', () => {
  it('is registered for Run now and scores the open deals of the company it runs for', async () => {
    const job = findBackgroundJob(JOB_KEYS.crmDealScores);
    const organizationId = new Types.ObjectId().toHexString();
    await runForOrganization(organizationId, openDeal);

    expect(job?.label).toBe('CRM deal scores');
    await expect(runForOrganization(organizationId, () => job!.runOnce())).resolves.toBe(1);
  });
});

describe('startDealScoring', () => {
  it('scores every active company now and again every six hours', async () => {
    const setInterval = jest.spyOn(globalThis, 'setInterval');
    const organizationId = new Types.ObjectId();
    await runAsPlatform(() =>
      OrganizationModel.create({
        _id: organizationId,
        name: 'Acme',
        slug: 'acme',
        currency: 'USD',
      }),
    );
    await runForOrganization(organizationId.toHexString(), openDeal);
    await runForOrganization(organizationId.toHexString(), openDeal);

    startDealScoring();

    expect(await heartbeat()).toBe('Scored 2 open deal(s)');
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 6 * 60 * 60_000);
    clearInterval(setInterval.mock.results[0].value as NodeJS.Timeout);
  });

  it('logs a tick that fails as a whole', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(OrganizationModel, 'find').mockImplementationOnce(() => {
      throw new Error('database away');
    });
    const setInterval = jest.spyOn(globalThis, 'setInterval');

    startDealScoring();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(error).toHaveBeenCalledWith(expect.any(Error), 'CRM deal scoring failed');
    clearInterval(setInterval.mock.results[0].value as NodeJS.Timeout);
  });
});
