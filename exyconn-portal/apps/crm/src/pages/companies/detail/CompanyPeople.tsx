import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Flex, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { FilterOp, useListContactsPagedQuery } from '@exyconn/shell/graphql/generated';
import { RecordAvatar } from '../../../records/detail';

const PAGE_SIZE = 100;

/** The People tab: everyone at the company, each linking to their own page. */
export function CompanyPeople({ companyId }: Readonly<{ companyId: string }>) {
  const t = useT();
  const { data, loading, error } = useListContactsPagedQuery({
    variables: {
      input: {
        page: 0,
        pageSize: PAGE_SIZE,
        filters: [{ field: 'companyId', op: FilterOp.Equals, value: companyId }],
      },
    },
  });
  if (error) {
    return <Alert severity="error">{errorMessage(error, t('Could not load the people.'))}</Alert>;
  }
  if (loading && !data) {
    return <ListSkeleton toolbar={false} rows={3} columns={2} label="Loading the people" />;
  }
  const people = data?.listContactsPaged.rows ?? [];
  if (people.length === 0) {
    return <Text color="text.secondary">{t('Nobody at this company is in the CRM yet.')}</Text>;
  }
  return (
    <Stack component="ul" spacing={1.5} sx={{ p: 0, m: 0, listStyle: 'none' }}>
      {people.map((person) => (
        <Flex key={person.id} component="li" direction="row" spacing={1.5} alignItems="center">
          <RecordAvatar name={person.name} src={person.avatarUrl} />
          <Stack spacing={0}>
            <Link component={RouterLink} to={`/contacts/${person.id}`} sx={{ fontWeight: 600 }}>
              {person.name}
            </Link>
            <Text size="sm" color="text.secondary">
              {[person.title, person.email].filter(Boolean).join(' · ')}
            </Text>
          </Stack>
        </Flex>
      ))}
    </Stack>
  );
}
