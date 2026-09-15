import type { Model, Types } from 'mongoose';
import { companyProfile } from '../../lib/company';
import { normalizeCurrency, supportedCurrencies } from '../../utils/iso';
import { logger } from '../../utils/logger';
import { SalaryStructureModel } from '../employee/salary.model';
import { SalarySlipModel } from '../employee/salarySlip.model';
import { ExpenseClaimModel } from '../expenses/expense.model';
import { BudgetModel } from '../finance/budget.model';
import { CompanyExpenseModel } from '../finance/company-expense.model';
import { InvoiceModel } from '../finance/finance.model';
import { PaymentModel } from '../finance/payment.model';
import { RecurringInvoiceModel } from '../finance/recurring-invoice.model';
import { PurchaseOrderModel } from '../products/purchase-order.model';

/** Every model that stores money with its own currency (see lib/currencyField). */
// Each model is typed by its own document; this only reads and writes `currency` and `_id`.
const MONEY_MODELS = [
  SalaryStructureModel,
  SalarySlipModel,
  ExpenseClaimModel,
  BudgetModel,
  CompanyExpenseModel,
  InvoiceModel,
  PaymentModel,
  RecurringInvoiceModel,
  PurchaseOrderModel,
] as unknown as readonly Model<unknown>[];

/** What people typed for rupees while the currency was still a free-text field. */
const RUPEE_SPELLINGS = new Set(['₹', 'RS', 'RUPEE', 'RUPEES']);
const RUPEE = 'INR';

/** Records sharing one stored currency value. */
interface StoredCurrencyGroup {
  _id: unknown;
  ids: Types.ObjectId[];
}

/**
 * The ISO 4217 code a stored value should have been: the code itself once trimmed and
 * upper-cased, INR for a spelling of rupees, and the company's own currency for anything
 * else — including a missing or empty one.
 */
export function repairedCurrency(stored: unknown, companyCurrency: string): string {
  const text = typeof stored === 'string' ? stored.trim().toUpperCase() : '';
  if (RUPEE_SPELLINGS.has(text)) {
    return RUPEE;
  }
  return normalizeCurrency(text) ?? companyCurrency;
}

/** Rewrites one collection's non-ISO currencies; returns how many records changed. */
async function repairModel(model: Model<unknown>, companyCurrency: string): Promise<number> {
  const groups = await model.aggregate<StoredCurrencyGroup>([
    { $match: { currency: { $nin: supportedCurrencies() } } },
    { $group: { _id: '$currency', ids: { $push: '$_id' } } },
  ]);
  let repaired = 0;
  for (const group of groups) {
    const currency = repairedCurrency(group._id, companyCurrency);
    const result = await model.updateMany({ _id: { $in: group.ids } }, { $set: { currency } });
    repaired += result.modifiedCount;
    logger.info(
      { model: model.modelName, from: group._id, to: currency, count: result.modifiedCount },
      'Repaired stored currencies',
    );
  }
  return repaired;
}

/**
 * Brings the organization in scope's money records to ISO 4217 currencies.
 *
 * Records written before the currency was validated hold '', 'inr ' or '₹', and every screen
 * and document that formats one of them threw "RangeError: Invalid currency code". Runs at
 * boot for each organization and touches only records that are wrong, so every restart after
 * the first changes nothing. Returns how many records were rewritten.
 */
export async function repairStoredCurrencies(): Promise<number> {
  const { currency } = await companyProfile();
  const companyCurrency = normalizeCurrency(currency);
  if (companyCurrency === null) {
    logger.warn({ currency }, 'Organization currency is not ISO 4217; stored currencies left');
    return 0;
  }
  let repaired = 0;
  for (const model of MONEY_MODELS) {
    repaired += await repairModel(model, companyCurrency);
  }
  return repaired;
}
