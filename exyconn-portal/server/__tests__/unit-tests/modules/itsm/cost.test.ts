import { AssetModel } from '../../../../src/modules/assets/asset.model';
import { LicenceModel } from '../../../../src/modules/assets/licence.model';
import { itCostSummary, monthKey } from '../../../../src/modules/itsm/cost';
import { ItCloudResourceModel, ItPurchaseRequestModel } from '../../../../src/modules/itsm/models';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, itQuery as q } from './itsm.fixtures';

const NOW = new Date('2026-03-15T12:00:00.000Z');
const on = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('IT cost summary', () => {
  useTestOrganization();

  it('keys a month in UTC', () => {
    expect(monthKey(new Date('2026-12-31T23:59:59.000Z'))).toBe('2026-12');
  });

  it('is all zeros, with twelve empty months, when nothing is paid for', async () => {
    const cost = await itCostSummary(NOW);

    expect(cost).toMatchObject({
      saasMonthly: 0,
      cloudMonthly: 0,
      annualRunRate: 0,
      hardwareThisYear: 0,
      procurementThisYear: 0,
      byVendor: [],
    });
    expect(cost.oneOffByMonth).toHaveLength(12);
    expect(cost.oneOffByMonth[0]).toEqual({ label: '2025-04', value: 0 });
    expect(cost.oneOffByMonth[11]).toEqual({ label: '2026-03', value: 0 });
  });

  it('buckets one-off spend by month and splits this year from last', async () => {
    await AssetModel.create([
      { assetTag: 'A-1', name: 'Laptop', purchaseDate: on('2025-11-10'), purchaseCost: 1000 },
      { assetTag: 'A-2', name: 'Laptop', purchaseDate: on('2026-02-03'), purchaseCost: 1500 },
      { assetTag: 'A-3', name: 'Ancient', purchaseDate: on('2024-01-01'), purchaseCost: 999 },
    ]);
    await ItPurchaseRequestModel.create([
      {
        title: 'Audit',
        kind: 'SERVICE',
        estimatedCost: 700,
        justification: 'j',
        status: 'RECEIVED',
        receivedAt: on('2026-02-20'),
      },
      {
        title: 'Old licence',
        kind: 'SOFTWARE',
        estimatedCost: 300,
        justification: 'j',
        status: 'RECEIVED',
        receivedAt: on('2025-12-01'),
      },
      {
        title: 'Not here yet',
        kind: 'SOFTWARE',
        estimatedCost: 5000,
        justification: 'j',
        status: 'ORDERED',
      },
    ]);

    const cost = await itCostSummary(NOW);
    const month = (label: string) => cost.oneOffByMonth.find((row) => row.label === label)?.value;

    expect(cost.hardwareThisYear).toBe(1500);
    expect(cost.procurementThisYear).toBe(700);
    expect(month('2025-11')).toBe(1000);
    expect(month('2025-12')).toBe(300);
    expect(month('2026-02')).toBe(2200);
    expect(cost.byCategory).toEqual([
      { label: 'SaaS licences (yearly)', value: 0 },
      { label: 'Cloud (yearly)', value: 0 },
      { label: 'Hardware (this year)', value: 1500 },
      { label: 'Software & services (this year)', value: 700 },
    ]);
  });

  it('files a resource with no provider under "Other"', async () => {
    await ItCloudResourceModel.create({ name: 'box', monthlyCost: 5 });

    const cost = await itCostSummary(NOW);

    expect(cost.byVendor).toEqual([{ label: 'Other', value: 60 }]);
    expect(cost.annualRunRate).toBe(60);
  });

  it('skips retired resources and ranks only the top ten vendors', async () => {
    await ItCloudResourceModel.create([
      { name: 'box', monthlyCost: 5 },
      { name: 'gone', provider: 'Legacy', monthlyCost: 999, status: 'RETIRED' },
    ]);
    await LicenceModel.create(
      Array.from({ length: 11 }, (_, index) => ({
        name: `Tool ${index}`,
        vendor: `Vendor ${index}`,
        seatsTotal: 1,
        cost: (index + 1) * 10,
        billingCycle: 'MONTHLY',
        renewalDate: on('2026-06-01'),
      })),
    );

    const cost = await itCostSummary(NOW);
    const labels = cost.byVendor.map((row) => row.label);

    expect(cost.cloudMonthly).toBe(5);
    expect(labels).toHaveLength(10);
    expect(labels[0]).toBe('Vendor 10');
    expect(labels).not.toContain('Legacy');
    expect(labels).not.toContain('Vendor 0');
    expect(labels).not.toContain('Other');
    expect(cost.byVendor[0].value).toBe(1320);
  });

  it('answers the resolver for IT and refuses everyone else', async () => {
    await ItCloudResourceModel.create({ name: 'box', provider: 'Hetzner', monthlyCost: 20 });

    const cost = (await q.itCostSummary(null, {}, ctxFor('it-1', [ROLES.IT]))) as {
      byVendor: Array<{ label: string; value: number }>;
    };

    expect(cost.byVendor).toEqual([{ label: 'Hetzner', value: 240 }]);
    expect(await codeOf(q.itCostSummary(null, {}, ctxFor('e-1', [ROLES.EMPLOYEE])))).toBe(
      'FORBIDDEN',
    );
  });
});
