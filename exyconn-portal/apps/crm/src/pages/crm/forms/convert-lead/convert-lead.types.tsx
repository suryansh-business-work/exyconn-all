import type { PagedLeadRow } from '../../leads-grid';

/** The lead being turned into a company, a contact and a deal. */
export type ConvertLeadTarget = PagedLeadRow;

export interface ConvertLeadFormValues {
  companyName: string;
  dealTitle: string;
  value: number;
  expectedCloseDate: Date | null;
  contactName: string;
  contactEmail: string;
}
