import { useApolloClient } from '@apollo/client/react';
import { SALARY_METHODS } from '@exyconn/payout';
import { useCompanyCurrency } from '@/components/form/rhf';
import { PayoutAccountsPanel, fetchSecret, type PayoutAccountApi } from '@/components/payout';
import { usePermissions } from '@/hooks/usePermissions';
import {
  EmployeePayoutSecretDocument,
  useDeleteEmployeePayoutAccountMutation,
  useEmployeePayoutAccountsQuery,
  useSaveEmployeePayoutAccountMutation,
  type EmployeePayoutSecretQuery,
  type EmployeePayoutSecretQueryVariables,
} from '@/graphql/generated';

/** Re-read after every change: saving one account may move the default off another. */
const REFETCH = ['EmployeePayoutAccounts'];

interface EmployeePayoutPanelProps {
  employeeId: string;
  /** The employee's country of employment (ISO 3166-1), where a new account starts. */
  country: string;
}

/**
 * HR's salary accounts for one employee: bank accounts by each country's ISO rules (IBAN, IFSC,
 * ABA, sort code, BSB…) and UPI. Shown to whoever may set salary structures; full numbers are
 * fetched one at a time and every look is logged.
 */
export function EmployeePayoutPanel({ employeeId, country }: Readonly<EmployeePayoutPanelProps>) {
  const client = useApolloClient();
  const currency = useCompanyCurrency();
  const { can } = usePermissions();
  const editable = can('SalaryStructure', 'edit');
  const list = useEmployeePayoutAccountsQuery({
    variables: { employeeId },
    fetchPolicy: 'cache-and-network',
    skip: !can('SalaryStructure', 'view'),
  });
  const [save] = useSaveEmployeePayoutAccountMutation({ refetchQueries: REFETCH });
  const [remove] = useDeleteEmployeePayoutAccountMutation({ refetchQueries: REFETCH });

  if (!can('SalaryStructure', 'view')) {
    return null;
  }

  const api: PayoutAccountApi = {
    save: (id, input) => save({ variables: { employeeId, id, input } }),
    reveal: (row, field) =>
      fetchSecret<EmployeePayoutSecretQuery, EmployeePayoutSecretQueryVariables>(
        client,
        EmployeePayoutSecretDocument,
        { employeeId, id: row.id, field },
        (data) => data.employeePayoutSecret,
      ),
  };

  return (
    <PayoutAccountsPanel
      title="Salary accounts"
      description="Where this employee's salary is paid: a bank account or UPI. The default account is the one payroll pays into."
      rows={list.data?.employeePayoutAccounts ?? []}
      loading={list.loading}
      error={list.error?.message}
      onRefresh={list.refetch}
      methods={SALARY_METHODS}
      defaultCountry={country}
      defaultCurrency={currency}
      api={api}
      editable={editable}
      onDelete={(row) => remove({ variables: { employeeId, id: row.id } })}
    />
  );
}
