import {
  issueUnsubscribeTokens,
  suppress,
  suppressedAmong,
  unsubscribeByToken,
  unsubscribeLimiter,
  withdrawnConsentReason,
} from '../../../../src/modules/marketing/marketing.suppression';
import { marketingCustomResolvers } from '../../../../src/modules/marketing/marketing.resolvers';
import { MarketingSuppressionModel } from '../../../../src/modules/marketing/suppression.model';
import { MarketingUnsubscribeTokenModel } from '../../../../src/modules/marketing/unsubscribe-token.model';
import { logger } from '../../../../src/utils/logger';

beforeEach(async () => {
  await unsubscribeLimiter.reset();
  jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
  jest.spyOn(logger, 'info').mockImplementation(() => undefined);
});

afterEach(() => jest.restoreAllMocks());

describe('withdrawnConsentReason', () => {
  it('maps the CRM statuses that withdraw consent to a suppression reason', () => {
    expect(withdrawnConsentReason('UNSUBSCRIBED')).toBe('UNSUBSCRIBED');
    expect(withdrawnConsentReason('BOUNCED')).toBe('BOUNCED');
  });

  it('leaves an active contact deliverable', () => {
    expect(withdrawnConsentReason('ACTIVE')).toBeUndefined();
  });
});

describe('suppress and suppressedAmong', () => {
  it('stores the address normalised and finds it whatever case it is asked in', async () => {
    await suppress('  Ada@Example.COM ', 'MANUAL', 'growth@exyconn.com');

    const row = await MarketingSuppressionModel.findOne().lean();
    expect(row).toMatchObject({ email: 'ada@example.com', reason: 'MANUAL' });
    await expect(suppressedAmong(['ADA@example.com', 'bo@example.com'])).resolves.toEqual(
      new Set(['ada@example.com']),
    );
  });

  it('keeps the first reason when an address is suppressed a second time', async () => {
    await suppress('ada@example.com', 'BOUNCED', 'bounce');
    await suppress('ada@example.com', 'UNSUBSCRIBED', 'campaign:c1');

    const rows = await MarketingSuppressionModel.find().lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].reason).toBe('BOUNCED');
  });

  it('answers an empty question without asking the database', async () => {
    const find = jest.spyOn(MarketingSuppressionModel, 'find');

    await expect(suppressedAmong([])).resolves.toEqual(new Set());
    expect(find).not.toHaveBeenCalled();
  });
});

describe('issueUnsubscribeTokens', () => {
  it('mints one distinct token per normalised address and stores only their hashes', async () => {
    const issued = await issueUnsubscribeTokens(['A@x.com', 'b@x.com'], 'c1');

    expect([...issued.keys()]).toEqual(['a@x.com', 'b@x.com']);
    expect(new Set(issued.values()).size).toBe(2);
    const rows = await MarketingUnsubscribeTokenModel.find().lean();
    expect(rows.map((row) => row.campaignId)).toEqual(['c1', 'c1']);
    const hashes = new Set(rows.map((row) => row.tokenHash));
    for (const token of issued.values()) {
      expect(hashes.has(token)).toBe(false);
    }
  });

  it('writes nothing for an empty audience', async () => {
    const insert = jest.spyOn(MarketingUnsubscribeTokenModel, 'insertMany');

    await expect(issueUnsubscribeTokens([], 'c1')).resolves.toEqual(new Map());
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('unsubscribing', () => {
  it('honours a freshly issued token and records which campaign prompted it', async () => {
    const issued = await issueUnsubscribeTokens(['ada@x.com'], 'c9');

    await expect(unsubscribeByToken(issued.get('ada@x.com') ?? '', 'caller-1')).resolves.toBe(true);

    const row = await MarketingSuppressionModel.findOne({ email: 'ada@x.com' }).lean();
    expect(row).toMatchObject({ reason: 'UNSUBSCRIBED', source: 'campaign:c9' });
  });

  it('stops a caller that is over the hourly limit before looking at the token', async () => {
    jest.spyOn(unsubscribeLimiter, 'allow').mockResolvedValueOnce(false);
    const lookup = jest.spyOn(MarketingUnsubscribeTokenModel, 'findOne');

    await expect(unsubscribeByToken('anything', 'caller-2')).rejects.toThrow(/Too many attempts/);
    expect(lookup).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Unsubscribe from caller-2 rate-limited');
  });

  it('rate-limits a caller with no known address under one shared key', async () => {
    const allow = jest.spyOn(unsubscribeLimiter, 'allow').mockResolvedValueOnce(false);

    await expect(
      marketingCustomResolvers.Mutation.unsubscribeFromMarketing(
        null,
        { token: 'anything' },
        { user: null },
      ),
    ).rejects.toThrow(/Too many attempts/);
    expect(allow).toHaveBeenCalledWith('unknown');
  });
});
