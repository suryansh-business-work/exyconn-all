import { CounterModel } from './counter.model';
import { getBranding } from '../branding/branding.service';

const INVOICE_SERIES = 'invoice';

/** Numbers are padded so they sort as text the way they count: INV-0009 before INV-0010. */
const SEQUENCE_WIDTH = 4;

/**
 * The next invoice number: the prefix Admin › Branding sets (INV- unless changed) followed
 * by a zero-padded sequence drawn from the counter. Every generated invoice — from a deal,
 * from tracked time — comes through here, so the series has no gaps and no repeats.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const [branding, counter] = await Promise.all([
    getBranding(),
    CounterModel.findOneAndUpdate(
      { key: INVOICE_SERIES },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean(),
  ]);
  const seq = counter?.seq ?? 1;
  return `${branding.invoicePrefix}${String(seq).padStart(SEQUENCE_WIDTH, '0')}`;
}
