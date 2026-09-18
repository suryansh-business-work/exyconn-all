import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Autocomplete, TextField } from '@exyconn/shell/components/ui';
import { useListAssetAssigneesQuery } from '@exyconn/shell/graphql/generated';

interface Person {
  id: string;
  name: string;
  email: string;
}

/** Finds an employee by name or email and opens their IT profile. */
export function EmployeePicker({ selectedId }: Readonly<{ selectedId: string }>) {
  const t = useT();
  const navigate = useNavigate();
  const { data, loading } = useListAssetAssigneesQuery();
  const people: Person[] = data?.listAssetAssignees ?? [];
  const selected = people.find((person) => person.id === selectedId) ?? null;
  return (
    <Autocomplete
      options={people}
      value={selected}
      loading={loading}
      onChange={(_event, person) => navigate(person ? `/it/people/${person.id}` : '/it/people')}
      getOptionLabel={(person) => `${person.name} (${person.email})`}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      renderInput={(params) => <TextField {...params} label={t('Employee')} size="small" />}
      sx={{ maxWidth: 480 }}
    />
  );
}
