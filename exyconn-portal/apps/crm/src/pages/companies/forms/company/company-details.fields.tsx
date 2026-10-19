import { useT } from '@exyconn/i18n';
import { Divider } from '@exyconn/shell/components/ui';
import {
  RhfImageField,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { CompanyStatus } from '@exyconn/shell/graphql/generated';
import { COMPANY_SIZES } from '../../crm.constants';
import { ContactPointsField, ProfileFields } from '../../../../records/profile';

const STATUS_OPTIONS = enumOptions(Object.values(CompanyStatus));

/** A logo lands square, whole and centred, on its own edge colour. */
const LOGO_CROP = { aspect: 'square', fit: 'fit', background: 'auto' } as const;

/** The account itself, how to reach it, how big it is, and where it is. */
export function CompanyDetailsFields() {
  const t = useT();
  const sizeOptions: SelectOption[] = [
    { value: '', label: t('Not known') },
    ...COMPANY_SIZES.map((size) => ({ value: size, label: t('{size} people', { size }) })),
  ];
  return (
    <>
      <RhfImageField
        name="logoUrl"
        label={t('Company logo')}
        folder="crm-companies"
        helperText={t('Shown on the company page and beside its people')}
        cropOptions={LOGO_CROP}
      />
      <RhfTextField name="name" label="Company name" />
      <RhfTextField name="domain" label="Domain" helperText="e.g. exyconn.com" />
      <RhfTextField name="industry" label="Industry" />
      <RhfSelect name="size" label="Size" options={sizeOptions} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField
        name="owner"
        label="Company owner"
        helperText="Who looks after this account; leave blank until someone takes it on"
      />
      <Divider />
      <ContactPointsField
        name="emails"
        title="Email addresses"
        inputLabel="Email"
        addLabel="Add email"
      />
      <ContactPointsField
        name="phones"
        title="Phone numbers"
        inputLabel="Phone"
        addLabel="Add phone"
      />
      <Divider />
      <RhfTextField name="annualRevenue" label="Annual revenue" inputMode="numeric" />
      <RhfTextField name="employeeCount" label="Employees" inputMode="numeric" />
      <RhfTextField name="foundedYear" label="Founded" inputMode="numeric" />
      <RhfTextField
        name="location"
        label="Location"
        helperText="How the account is known, e.g. London HQ"
      />
      <ProfileFields aboutLabel="About the company" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </>
  );
}
