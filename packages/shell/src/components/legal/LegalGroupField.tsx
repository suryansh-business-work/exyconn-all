import { useMemo } from 'react';
import { RhfSelect } from '@/components/form/rhf';
import { useListLegalGroupsQuery, type LegalItemKind } from '@/graphql/generated';

const NO_GROUP = { value: '', label: 'No group' };

interface Props {
  /** Which register's groups to offer. */
  kind: LegalItemKind;
  name?: string;
}

/**
 * Picks the group a contract, policy or document belongs to, from Legal › Groups. Only
 * groups of the same kind are offered; "No group" leaves it ungrouped.
 */
export function LegalGroupField({ kind, name = 'groupId' }: Readonly<Props>) {
  const { data } = useListLegalGroupsQuery({ fetchPolicy: 'cache-and-network' });
  const options = useMemo(
    () => [
      NO_GROUP,
      ...(data?.listLegalGroups ?? [])
        .filter((group) => group.kind === kind)
        .map((group) => ({ value: group.id, label: group.name })),
    ],
    [data, kind],
  );
  return (
    <RhfSelect
      name={name}
      label="Group"
      options={options}
      helperText="Optional. Groups like “Part Time Employee Contracts” are managed in Legal › Groups and can be handed to an employee together."
    />
  );
}
