import { Grid } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useGstStateOptions } from '@exyconn/shell/hooks/useGstStateOptions';

/** Invoicing tab — what a tax invoice prints about us, and how it is numbered and taxed. */
export function BrandingInvoicingFields() {
  const stateOptions = useGstStateOptions();
  return (
    <Grid container spacing={2.5}>
      <Grid
        size={{
          xs: 12,
          sm: 6,
        }}
      >
        <RhfTextField
          name="gstin"
          label="GSTIN"
          helperText="15-character GST registration, printed on every tax invoice"
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
        }}
      >
        <RhfSelect
          name="stateCode"
          label="GST state"
          options={stateOptions}
          helperText="Decides CGST + SGST (same state) versus IGST on an invoice"
        />
      </Grid>
      <Grid size={12}>
        <RhfTextField
          name="addressLine"
          label="Registered address"
          helperText="As printed on invoices"
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
        }}
      >
        <RhfTextField
          name="invoicePrefix"
          label="Invoice number prefix"
          helperText="Generated invoice numbers start with this, e.g. INV-"
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
        }}
      >
        <RhfTextField
          name="defaultTaxPercent"
          label="Default tax %"
          type="number"
          helperText="The rate a generated invoice line starts at"
        />
      </Grid>
      <Grid size={12}>
        <RhfTextField
          name="bankDetails"
          label="Bank details"
          multiline
          minRows={3}
          helperText="Bank, account number and IFSC, printed on invoices so the client knows where to pay"
        />
      </Grid>
    </Grid>
  );
}
