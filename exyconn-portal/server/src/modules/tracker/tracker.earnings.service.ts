import { SalaryStructureModel } from '../employee/salary.model';
import { DEFAULT_PAY_TYPE } from '../../constants/pay';
import { companyProfile } from '../../lib/company';
import { normalizeCurrency } from '../../utils/iso';
import { badRequest } from '../../utils/errors';
import { trackerAdminService } from './tracker.admin.service';
import { priceTime } from './tracker.billing.pricing';

const MS_PER_DAY = 86_400_000;
/** A year of earnings is the widest view anybody reads; more is a caller asking us to loop. */
const MAX_RANGE_DAYS = 366;

/** An ISO range as two dates, refused when it is unreadable, backwards or too wide. */
function rangeOf(fromText: string, toText: string) {
  const from = new Date(fromText);
  const to = new Date(toText);
  const span = to.getTime() - from.getTime();
  if (Number.isNaN(span) || span <= 0 || span > MAX_RANGE_DAYS * MS_PER_DAY) {
    badRequest(
      `The range must be valid dates between one moment and ${MAX_RANGE_DAYS} days apart.`,
    );
  }
  return { from, to };
}

/**
 * What an employee's tracked time over a range pays at their salary structure's rate.
 *
 * The time is the calendar's own figure — measured active time plus approved off-computer
 * time — so the earnings and the hours the employee sees can never disagree. Only HOURLY pay
 * is paid by the hour; any other pay type answers with no amount rather than a made-up one.
 */
async function earnings(userId: string, fromText: string, toText: string) {
  const { from, to } = rangeOf(fromText, toText);
  const [days, structure, company] = await Promise.all([
    // The zone only decides which day a session is filed under; the range total is the same.
    trackerAdminService.calendar(userId, from, to, 'UTC'),
    SalaryStructureModel.findOne({ employeeId: userId }).select('payType rate currency').lean(),
    companyProfile(),
  ]);
  const trackedMs = days.reduce((sum, day) => sum + day.activeMs + day.manualMs, 0);
  const payType = structure?.payType ?? DEFAULT_PAY_TYPE;
  const rate = structure?.rate ?? 0;
  return {
    payType,
    rate,
    currency: normalizeCurrency(structure?.currency) ?? company.currency,
    trackedMs,
    amount: payType === 'HOURLY' ? priceTime(trackedMs, rate).amount : null,
  };
}

export const trackerEarningsService = { earnings };
