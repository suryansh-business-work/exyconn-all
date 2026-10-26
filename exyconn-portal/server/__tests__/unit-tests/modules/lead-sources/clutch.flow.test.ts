import { Types } from 'mongoose';
import { clutchResolvers } from '../../../../src/modules/lead-sources/clutch/clutch.resolvers';
import { ClutchRunModel } from '../../../../src/modules/lead-sources/clutch/clutch.models';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();
const { Query, Mutation } = clutchResolvers;

const caller = (...roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'sales@x.com', roles, organizationId },
  organizationId,
});
const sales = caller(ROLES.CRM);

/** One SSE answer from Clutch's MCP server, as fetch hands it back. */
const sse = (result: unknown) =>
  new Response(
    `event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: { structuredContent: { result } } })}\n\n`,
    { status: 200 },
  );

const PROVIDERS = {
  providers: [
    {
      id: 1,
      title: 'rtCamp',
      url: 'https://clutch.co/profile/rtcamp',
      rating: 4.8,
      reviews_number: 17,
      headquarters: 'Atlanta, United States',
      details: '',
    },
    {
      id: 2,
      title: 'Acme',
      url: 'https://clutch.co/profile/acme',
      rating: 4.5,
      reviews_number: 3,
      headquarters: 'Pune, India',
      details: '',
    },
  ],
};

const SEARCH = {
  engine: 'MCP' as const,
  keyword: 'Web Development',
  location: 'Pune',
  industry: '',
  profileUrls: [],
  includeDetails: true,
  includeReviews: true,
  includePortfolio: true,
  maxItems: 5,
};

async function finished(id: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const run = await ClutchRunModel.findById(id).lean();
    if (run && run.status !== 'RUNNING') return run;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('The run never finished');
}

beforeEach(() => invalidatePermissionCache());
afterEach(() => jest.restoreAllMocks());

describe('Clutch on its own MCP server', () => {
  it('searches in the background, adds reviews, notes what only Apify does, and files companies once', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      if (body.params.name === 'recommend_service_providers') return sse(PROVIDERS);
      return sse({
        reviews_sample: [{ title: 'Great', overall_rating: 5, summary: '<p>Fast</p>' }],
      });
    });

    const started = await Mutation.startClutchSearch(null, { input: SEARCH }, sales);
    expect(started.status).toBe('RUNNING');
    const run = await finished(String(started.id));
    expect(run.status).toBe('SUCCEEDED');
    expect(run.companyCount).toBe(2);
    expect(run.notes).toHaveLength(2);
    expect(
      (await Query.clutchRun(null, { id: String(started.id) }, sales)).companies[0].reviews[0]
        .comment,
    ).toBe('Fast');

    const filed = await Mutation.importClutchCompanies(
      null,
      { runId: String(started.id), keys: ['1', '2'] },
      sales,
    );
    expect(filed).toMatchObject({ created: 2, skipped: 0, contactsCreated: 0 });
    const again = await Mutation.importClutchCompanies(
      null,
      { runId: String(started.id), keys: ['1'] },
      sales,
    );
    expect(again.skips[0].reason).toBe('Already in the CRM as rtCamp');

    const company = await CompanyModel.findOne({ name: 'rtCamp' }).lean();
    expect(company).toMatchObject({
      leadSource: 'Clutch',
      city: 'Atlanta',
      country: 'United States',
    });
    expect(company?.origin?.source).toBe('CLUTCH');
    expect(
      (await Query.clutchRunsPaged(null, { input: { page: 0, pageSize: 10 } }, sales)).totalCount,
    ).toBe(1);
    expect(await Mutation.deleteClutchRun(null, { id: String(started.id) }, sales)).toBe(true);
  });

  it('records why a search failed', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('busy', { status: 503 }));
    const started = await Mutation.startClutchSearch(null, { input: SEARCH }, sales);
    const run = await finished(String(started.id));
    expect(run).toMatchObject({
      status: 'FAILED',
      error: 'Clutch answered HTTP 503. Try again in a minute.',
    });
  });

  it('asks for something to search and only Clutch profile links', async () => {
    await expect(
      Mutation.startClutchSearch(null, { input: { ...SEARCH, keyword: ' ' } }, sales),
    ).rejects.toThrow('Type what to search for, or paste a Clutch profile link.');
    await expect(
      Mutation.startClutchSearch(
        null,
        { input: { ...SEARCH, profileUrls: ['https://evil.example/x'] } },
        sales,
      ),
    ).rejects.toThrow('Paste up to 20 Clutch profile links');
  });
});

describe('Clutch on Apify', () => {
  it('needs a token first, then runs the configured actor and files people with an email as contacts', async () => {
    await expect(
      Mutation.startClutchSearch(null, { input: { ...SEARCH, engine: 'APIFY' } }, sales),
    ).rejects.toThrow('Add an Apify API token first');

    const admin = caller(ROLES.ADMIN);
    const saved = await Mutation.saveLeadSourceConfig(
      null,
      {
        input: { apifyToken: 'apify_api_SECRET1234', clutchActorId: 'scrapeai/clutch-co-scraper' },
      },
      admin,
    );
    expect(saved).toMatchObject({ hasApifyToken: true, apifyTokenHint: '1234' });
    expect(await Query.leadSourceConfig(null, null, sales)).not.toHaveProperty('apifyToken');

    const fetched = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              name: 'Beta',
              url: 'https://clutch.co/profile/beta',
              website: 'https://beta.io',
              contacts: [{ name: 'Sam', email: 'sam@beta.io' }],
            },
          ]),
          { status: 200 },
        ),
      );
    const started = await Mutation.startClutchSearch(
      null,
      { input: { ...SEARCH, engine: 'APIFY' } },
      sales,
    );
    const run = await finished(String(started.id));
    expect(run.companyCount).toBe(1);
    const [url, init] = fetched.mock.calls[0];
    expect(String(url)).toContain('/acts/scrapeai~clutch-co-scraper/run-sync-get-dataset-items');
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer apify_api_SECRET1234',
    );

    const filed = await Mutation.importClutchCompanies(
      null,
      { runId: String(started.id), keys: ['https://clutch.co/profile/beta'] },
      sales,
    );
    expect(filed).toMatchObject({ created: 1, contactsCreated: 1 });
    expect(await ContactModel.findOne({ email: 'sam@beta.io' }).lean()).toMatchObject({
      name: 'Sam',
      companyName: 'Beta',
    });

    const cleared = await Mutation.clearApifyToken(null, null, admin);
    expect(cleared.hasApifyToken).toBe(false);
  });

  it('says when Apify refuses the token, and refuses an actor id that is not one', async () => {
    const admin = caller(ROLES.ADMIN);
    await expect(
      Mutation.saveLeadSourceConfig(
        null,
        { input: { apifyToken: '', clutchActorId: 'not an actor' } },
        admin,
      ),
    ).rejects.toThrow('Enter the Apify actor as username/actor-name');
    await Mutation.saveLeadSourceConfig(
      null,
      { input: { apifyToken: 'bad-token', clutchActorId: '' } },
      admin,
    );
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('no', { status: 401 }));
    const started = await Mutation.startClutchSearch(
      null,
      { input: { ...SEARCH, engine: 'APIFY' } },
      sales,
    );
    expect((await finished(String(started.id))).error).toBe(
      'Apify refused the API token. Check it under Lead generators > Clutch > Apify.',
    );
  });
});

describe('who may use it', () => {
  it('keeps Clutch to the sales desk and filing to those who may create companies', async () => {
    const hr = caller(ROLES.HR);
    expect(() => Query.leadSourceConfig(null, null, hr)).toThrow();
    await expect(
      Mutation.importClutchCompanies(null, { runId: 'x', keys: ['1'] }, hr),
    ).rejects.toThrow();
    await expect(
      Mutation.importClutchCompanies(
        null,
        { runId: new Types.ObjectId().toHexString(), keys: [] },
        sales,
      ),
    ).rejects.toThrow('Choose between 1 and 100 companies to add.');
  });
});
