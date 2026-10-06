/**
 * The kinds of business tax number a client can carry, as the API stores them, with the name
 * an invoice prints beside the number. The shapes are checked by the portal's forms
 * (@exyconn/regex TAX_ID_TYPES, the same codes); the server keeps the codes and names, and a
 * loose sanity check, so an invoice can label whatever is on file.
 */
export const TAX_ID_LABELS = {
  IN_GST: 'GSTIN',
  EU_VAT: 'VAT number',
  GB_VAT: 'VAT number',
  US_EIN: 'EIN',
  CA_BN: 'Business Number',
  AU_ABN: 'ABN',
  NZ_GST: 'GST number',
  AE_TRN: 'TRN',
  SA_VAT: 'VAT number',
  SG_UEN: 'UEN',
  CH_UID: 'UID / VAT number',
  BR_CNPJ: 'CNPJ',
  MX_RFC: 'RFC',
  ZA_VAT: 'VAT number',
  JP_CN: 'Corporate Number',
  OTHER: 'Tax ID',
} as const;

export type TaxIdCode = keyof typeof TAX_ID_LABELS;

export const TAX_ID_CODES = Object.keys(TAX_ID_LABELS) as TaxIdCode[];

/** What an invoice prints beside a client's number: "VAT number", "GSTIN"; '' for none. */
export function taxIdLabel(code: string | null | undefined): string {
  return code && code in TAX_ID_LABELS ? TAX_ID_LABELS[code as TaxIdCode] : '';
}
