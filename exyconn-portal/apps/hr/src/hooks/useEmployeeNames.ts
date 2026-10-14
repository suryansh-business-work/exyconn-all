import { useCallback, useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import {
  useListEmployeeNamesQuery,
  type ListEmployeeNamesQuery,
} from '@exyconn/shell/graphql/generated';

type EmployeeName = ListEmployeeNamesQuery['listEmployeeNames'][number];

/** The word a deactivated or deleted person's name carries. */
export const DEACTIVATED = 'Deactivated';

/** A person's name as a record shows it: marked when the account is deactivated or deleted. */
export function employeeLabel(employee: EmployeeName, deactivated: string): string {
  return employee.isActive ? employee.name : `${employee.name} (${deactivated})`;
}

/**
 * Resolves an employee id to a display name for every HR grid that stores only the
 * id. One `listEmployeeNames` read, cached by Apollo, so the grids share it. Deleted
 * accounts are kept (and marked), so their old records still name them.
 */
export function useEmployeeNames(): (employeeId: string) => string {
  const t = useT();
  const { data } = useListEmployeeNamesQuery();
  const nameById = useMemo(() => {
    const deactivated = t(DEACTIVATED);
    return new Map(
      (data?.listEmployeeNames ?? []).map((employee) => [
        employee.id,
        employeeLabel(employee, deactivated),
      ]),
    );
  }, [data, t]);
  return useCallback((employeeId: string) => nameById.get(employeeId) ?? employeeId, [nameById]);
}
