import {
  RhfChipsInput,
  RhfImageField,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { useT } from '@exyconn/i18n';
import { Divider } from '@exyconn/shell/components/ui';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { ContactStatus, LifecycleStage } from '@exyconn/shell/graphql/generated';
import { ContactPointsField, ProfileFields } from '../../../../records/profile';
import { QuickCreateSelect } from '../../../../records/quick-create/QuickCreateSelect';
import { CreateCompanyPanel } from '../../../../records/quick-create/CreateCompanyPanel';

const STATUS_OPTIONS = enumOptions(Object.values(ContactStatus));
const STAGE_OPTIONS = enumOptions(Object.values(LifecycleStage));

/** Who the person is, how to reach them, and where they stand with us. */
export function ContactDetailsFields({
  companyOptions,
  onRefreshCompanies,
}: Readonly<{ companyOptions: SelectOption[]; onRefreshCompanies: () => Promise<unknown> }>) {
  const t = useT();
  return (
    <>
      <RhfImageField
        name="avatarUrl"
        label={t('Profile picture')}
        folder="crm-contacts"
        helperText={t('Shown on the contact page and in the company’s people')}
      />
      <RhfTextField name="name" label="Full name" />
      <RhfTextField name="title" label="Job title" />
      <RhfTextField name="department" label="Department" />
      <QuickCreateSelect
        name="companyId"
        label="Company"
        options={companyOptions}
        createLabel="Create Company"
        onRefresh={onRefreshCompanies}
        renderCreate={(done, cancel) => <CreateCompanyPanel done={done} cancel={cancel} />}
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
      <RhfSelect name="lifecycleStage" label="Lifecycle stage" options={STAGE_OPTIONS} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField
        name="leadSource"
        label="Lead source"
        helperText="Where they first came from, e.g. Website contact form, Referral"
      />
      <RhfChipsInput
        name="languages"
        label="Languages"
        helperText="Type a language and press Enter"
      />
      <RhfTextField
        name="owner"
        label="Contact owner"
        helperText="Who looks after this person; leave blank until someone takes them on"
      />
      <ProfileFields aboutLabel="About" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </>
  );
}
