import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import type { CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { DetailActions, EditRecordButton } from '../../../records/detail';
import { ReachOutActions, emailsOf, phonesOf } from '../../../records/comms';
import { GoogleMapCard } from '../../../maps/GoogleMapCard';
import { CompanyForm } from '../forms/company';
import { CompanyFields } from './CompanyFields';
import { CompanyHeader } from './CompanyHeader';

/** The left column of a company's page: the account, how to reach it, and the actions. */
export function CompanyProfile({
  company,
  onSaved,
}: Readonly<{ company: CompanyFieldsFragment; onSaved: () => void }>) {
  const t = useT();
  return (
    <Stack spacing={2}>
      <CompanyHeader
        company={company}
        action={
          <EditRecordButton
            label="Edit company"
            onSaved={onSaved}
            renderForm={(handlers) => <CompanyForm initial={company} {...handlers} />}
          />
        }
      />
      <DetailActions
        target={{ relatedType: 'COMPANY', relatedId: company.id, relatedName: company.name }}
      />
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Company details')}
      </Text>
      <CompanyFields company={company} />
      <ReachOutActions
        record={{
          object: 'COMPANY',
          id: company.id,
          name: company.name,
          phones: phonesOf(company),
          emails: emailsOf(company),
        }}
      />
      <GoogleMapCard target={company} title={company.name} />
    </Stack>
  );
}
