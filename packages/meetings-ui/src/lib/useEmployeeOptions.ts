import { useMemo } from 'react';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { useListEmployeeOptionsQuery } from '@exyconn/shell/graphql/generated';

/** The company's active employees as picker options, "Name (email)" so namesakes read apart. */
export function useEmployeeOptions(): SelectOption[] {
  const { data } = useListEmployeeOptionsQuery();
  return useMemo(
    () =>
      (data?.listEmployeeOptions ?? []).map((person) => ({
        value: person.id,
        label: `${person.name} (${person.email})`,
      })),
    [data],
  );
}
