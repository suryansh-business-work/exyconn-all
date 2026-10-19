import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { CrmTagObject, type CompanyFieldsFragment } from '@exyconn/shell/graphql/generated';
import { DetailActions, EditRecordButton, TagsEditor } from '../../../records/detail';
import { ReachOutActions, emailsOf, phonesOf } from '../../../records/comms';
import { GoogleMapCard } from '../../../maps/GoogleMapCard';
import { DraftColdEmailButton } from '../../../records/cold-email';
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
        extra={
          <DraftColdEmailButton
            target={{
              object: 'COMPANY',
              id: company.id,
              name: company.name,
              emails: emailsOf(company),
              website: company.website || company.domain,
            }}
          />
        }
      />
      <Divider />
      <Text component="h2" size="label" weight="bold">
        {t('Company details')}
      </Text>
      <CompanyFields company={company} />
      <TagsEditor object={CrmTagObject.Company} id={company.id} tags={company.tags} />
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
