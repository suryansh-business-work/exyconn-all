import { nextSequence } from '../../lib/sequence';
import { getBranding } from '../branding/branding.service';

const INVOICE_SERIES = 'invoice';

/**
 * The next invoice number: the prefix Admin › Branding sets (INV- unless changed) followed
 * by a zero-padded sequence. Every generated invoice — from a deal, from tracked time, from a
 * retainer — comes through here, so the series has no gaps and no repeats.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const branding = await getBranding();
  return nextSequence(INVOICE_SERIES, branding.invoicePrefix);
}
