import { assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import { AssetModel } from '../assets/asset.model';
import { LicenceModel } from '../assets/licence.model';
import { ItCloudResourceModel, ItPurchaseRequestModel } from './models';
import { INSIGHTS_MODULE, itOnly } from './dashboard';
import { monthlyCostOf } from './itsm.queries';

/** A labelled amount — money here, a count elsewhere in the reports. */
export interface ItMetric {
  label: string;
  value: number;
}

const MONTHS_SHOWN = 12;
const TOP_VENDORS = 10;

/** `YYYY-MM` of a date, in UTC, so a month bucket is the same on every server. */
export const monthKey = (date: Date): string => date.toISOString().slice(0, 7);

/** The last `count` month keys, oldest first, ending with the current month. */
export function lastMonths(count: number, now = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - index), 1),
    );
    return monthKey(month);
  });
}

/** Adds `value` to `label`'s running total. */
function addTo(totals: Map<string, number>, label: string, value: number): void {
  totals.set(label, (totals.get(label) ?? 0) + value);
}

const toMetrics = (totals: Map<string, number>): ItMetric[] =>
  [...totals].map(([label, value]) => ({ label, value }));

/** The cheapest quote when there are quotes, otherwise the estimate. */
const purchaseAmount = (row: { estimatedCost: number; quotes?: Array<{ amount: number }> }) =>
  row.quotes && row.quotes.length > 0
    ? Math.min(...row.quotes.map((quote) => quote.amount))
    : row.estimatedCost;

/**
 * What IT costs. Running costs (licences and cloud) are normalised to a month so they add
 * up; one-off spend is bought hardware (from the asset register) and delivered software or
 * services (from procurement). Received HARDWARE purchases are left out of procurement on
 * purpose — that hardware is in the asset register already, and counting it twice would
 * double the spend.
 */
export async function itCostSummary(now = new Date()) {
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_SHOWN - 1), 1),
  );
  const [licences, cloud, assets, purchases] = await Promise.all([
    LicenceModel.find({ status: 'ACTIVE' }).select('vendor cost billingCycle').lean(),
    ItCloudResourceModel.find({ status: { $ne: 'RETIRED' } })
      .select('provider monthlyCost')
      .lean(),
    AssetModel.find({ purchaseDate: { $gte: windowStart } })
      .select('purchaseDate purchaseCost')
      .lean(),
    ItPurchaseRequestModel.find({
      status: 'RECEIVED',
      kind: { $ne: 'HARDWARE' },
      receivedAt: { $gte: windowStart },
    })
      .select('receivedAt estimatedCost quotes')
      .lean(),
  ]);

  const vendors = new Map<string, number>();
  const saasMonthly = licences.reduce((sum, licence) => {
    const monthly = monthlyCostOf(licence);
    addTo(vendors, licence.vendor, monthly * 12);
    return sum + monthly;
  }, 0);
  const cloudMonthly = cloud.reduce((sum, row) => {
    addTo(vendors, row.provider || 'Other', row.monthlyCost * 12);
    return sum + row.monthlyCost;
  }, 0);

  const months = new Map(lastMonths(MONTHS_SHOWN, now).map((key) => [key, 0]));
  let hardwareThisYear = 0;
  for (const asset of assets) {
    const date = asset.purchaseDate as Date;
    addTo(months, monthKey(date), asset.purchaseCost);
    hardwareThisYear += date >= yearStart ? asset.purchaseCost : 0;
  }
  let procurementThisYear = 0;
  for (const purchase of purchases) {
    const date = purchase.receivedAt as Date;
    addTo(months, monthKey(date), purchaseAmount(purchase));
    procurementThisYear += date >= yearStart ? purchaseAmount(purchase) : 0;
  }

  const byVendor = toMetrics(vendors)
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_VENDORS);
  return {
    saasMonthly,
    cloudMonthly,
    annualRunRate: (saasMonthly + cloudMonthly) * 12,
    hardwareThisYear,
    procurementThisYear,
    byCategory: [
      { label: 'SaaS licences (yearly)', value: saasMonthly * 12 },
      { label: 'Cloud (yearly)', value: cloudMonthly * 12 },
      { label: 'Hardware (this year)', value: hardwareThisYear },
      { label: 'Software & services (this year)', value: procurementThisYear },
    ],
    byVendor,
    oneOffByMonth: toMetrics(months),
  };
}

export async function itCostSummaryResolver(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  return itCostSummary();
}
