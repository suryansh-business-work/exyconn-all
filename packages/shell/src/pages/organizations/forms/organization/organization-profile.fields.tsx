import { RhfImageField, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { FormSection } from '@/components/form/FormSection';
import { COMPANY_SIZE_OPTIONS } from './organization.options';

/** Who the company is: its name, handle, logo and what it does. */
export function OrganizationProfileFields({ isEdit }: Readonly<{ isEdit: boolean }>) {
  return (
    <FormSection title="Company" hint="Only the company name is required here.">
      <RhfTextField
        name="name"
        label="Company name"
        required
        placeholder="e.g. Acme Manufacturing"
        helperText="How the company is shown across the portals."
      />
      <RhfTextField
        name="slug"
        label="Handle"
        disabled={isEdit}
        placeholder="acme-manufacturing"
        helperText={
          isEdit
            ? 'Set when the company was created; its portal address uses it.'
            : 'Optional. Made from the name when left blank; used in its portal address.'
        }
      />
      <RhfTextField
        name="legalName"
        label="Legal name"
        placeholder="e.g. Acme Manufacturing Pvt Ltd"
        helperText="Optional. As registered; printed on invoices and payslips."
      />
      <RhfTextField
        name="industry"
        label="Industry"
        placeholder="e.g. Manufacturing"
        helperText="Optional. What the company does."
      />
      <RhfSelect
        name="companySize"
        label="Company size"
        options={COMPANY_SIZE_OPTIONS}
        helperText="Optional. Roughly how many people work there."
      />
      <RhfImageField
        name="logoUrl"
        label="Logo"
        folder="organizations"
        helperText="Optional. Shown where a platform administrator picks the company."
      />
      <RhfTextField
        name="description"
        label="About the company"
        multiline
        minRows={2}
        data-wide
        helperText="Optional. A short note for the platform team, up to 2000 characters."
      />
    </FormSection>
  );
}
