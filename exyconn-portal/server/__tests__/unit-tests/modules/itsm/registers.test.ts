import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, firstPage, itMutation as m, itQuery as q, itStaff } from './itsm.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Page = { rows: Array<Record<string, unknown>>; totalCount: number };
type Stats = {
  total: number;
  counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
  sums: Array<{ field: string; total: number }>;
};

describe('IT registers', () => {
  useTestOrganization();
  let ctx: GraphQLContext;

  beforeEach(async () => {
    ({ ctx } = await itStaff());
  });

  it('keeps the network register searchable and sorted by name', async () => {
    for (const [name, kind] of [
      ['Office Wi-Fi', 'WIFI'],
      ['Branch VPN', 'VPN'],
    ]) {
      await m.createItNetworkItem(null, { input: { name, kind, location: 'Pune' } }, ctx);
    }

    const page = (await q.listItNetworkItemsPaged(null, firstPage, ctx)) as Page;
    const found = (await q.listItNetworkItemsPaged(
      null,
      { input: { ...firstPage.input, search: 'vpn' } },
      ctx,
    )) as Page;

    expect(page.rows.map((row) => row.name)).toEqual(['Branch VPN', 'Office Wi-Fi']);
    expect(found.rows.map((row) => row.kind)).toEqual(['VPN']);
  });

  it('sums the monthly cost of the cloud register', async () => {
    await m.createItCloudResource(null, { input: { name: 'api', monthlyCost: 40 } }, ctx);
    await m.createItCloudResource(
      null,
      { input: { name: 'db', kind: 'DATABASE', monthlyCost: 60 } },
      ctx,
    );

    const stats = (await q.listItCloudResourcesStats(null, {}, ctx)) as Stats;

    expect(stats.total).toBe(2);
    expect(stats.sums).toEqual([{ field: 'monthlyCost', total: 100 }]);
  });

  it('refuses a negative cloud cost', async () => {
    await expect(
      m.createItCloudResource(null, { input: { name: 'api', monthlyCost: -1 } }, ctx),
    ).rejects.toThrow();
  });

  it('lists vulnerabilities newest discovery first under their irregular plural', async () => {
    const vulnerability = (title: string, discoveredAt: Date) => ({
      title,
      affectedSystem: 'Portal',
      discoveredAt,
    });
    await m.createItVulnerability(
      null,
      { input: vulnerability('Old XSS', new Date('2026-01-01T00:00:00.000Z')) },
      ctx,
    );
    await m.createItVulnerability(
      null,
      { input: vulnerability('New SSRF', new Date('2026-06-01T00:00:00.000Z')) },
      ctx,
    );

    const page = (await q.listItVulnerabilitiesPaged(null, firstPage, ctx)) as Page;
    const stats = (await q.listItVulnerabilitiesStats(null, {}, ctx)) as Stats;

    expect(page.rows.map((row) => row.title)).toEqual(['New SSRF', 'Old XSS']);
    expect(stats.counts.find((row) => row.field === 'severity')?.buckets).toEqual([
      { value: 'MEDIUM', count: 2 },
    ]);
  });

  it('keeps the registers to IT', async () => {
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    expect(await codeOf(q.listItNetworkItems(null, {}, employee))).toBe('FORBIDDEN');
    expect(await codeOf(q.listItCloudResources(null, {}, employee))).toBe('FORBIDDEN');
    expect(await codeOf(q.listItVulnerabilities(null, {}, employee))).toBe('FORBIDDEN');
  });
});
