import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircularProgress, Flex } from '@/components/ui';
import {
  RhfDatePicker,
  RhfMultiSelect,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  Role,
  useCreateUserMutation,
  useUpdateUserMutation,
  useListDepartmentsQuery,
  useListPositionsQuery,
  useEmployeeSalaryQuery,
  useSaveEmployeeSalaryMutation,
} from '@/graphql/generated';
import { EmploymentFields, ProfileFields, WorkArrangementFields } from './user.fields';
import { CompensationFields, toSalaryInput, type EmployeeSalary } from '@/components/pay';
import { toFormValues, toUserInput, userSchema, type UserValues } from './user.schema';
import type { UserRow } from './user.types';

const ACTIVE_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

/** Builds select options from HR-managed names, keeping any existing value selectable. */
const nameOptions = (names: string[], current?: string | null): SelectOption[] => {
  const unique = Array.from(new Set([...names, ...(current ? [current] : [])].filter(Boolean)));
  return unique.map((value) => ({ value, label: value }));
};

interface UserFormProps {
  initial: UserRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** Called after a successful create with the one-time credentials to reveal. */
  onCreated?: (creds: { name: string; email: string; password: string }) => void;
}

type FieldsProps = UserFormProps & { salary: EmployeeSalary | null };

/** React Hook Form + Zod form to create or update a portal user. */
function UserFormFields({ initial, salary, onDone, onCancel, onCreated }: Readonly<FieldsProps>) {
  const notify = useNotify();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [saveSalary] = useSaveEmployeeSalaryMutation();
  const { data: deptData } = useListDepartmentsQuery();
  const { data: posData } = useListPositionsQuery();
  const isEdit = Boolean(initial);
  const methods = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: toFormValues(initial, salary),
  });

  const departmentOptions = nameOptions(
    (deptData?.listDepartments ?? []).map((d) => d.name),
    initial?.department,
  );
  const positionOptions = nameOptions(
    (posData?.listPositions ?? []).map((p) => p.name),
    initial?.designation,
  );

  const onSubmit = async (values: UserValues) => {
    const isActive = values.isActive === 'true';
    try {
      // The employee the compensation is saved against: the one being edited, or the one the
      // create returns. Compensation is saved second on purpose — a salary structure for an
      // account that failed to create would be an orphan nobody ever finds.
      let employeeId = initial?.id ?? '';
      if (isEdit && initial) {
        await updateUser({
          variables: {
            id: initial.id,
            input: {
              name: values.name,
              email: values.email,
              roles: values.roles,
              isActive,
              ...toUserInput(values),
              ...(values.password ? { password: values.password } : {}),
            },
          },
        });
      } else {
        const { data } = await createUser({
          variables: {
            input: {
              name: values.name,
              email: values.email,
              roles: values.roles,
              isActive,
              ...toUserInput(values),
            },
          },
        });
        employeeId = data?.createUser?.user.id ?? '';
        if (data?.createUser) {
          onCreated?.({
            name: values.name,
            email: values.email,
            password: data.createUser.password,
          });
        }
      }

      if (employeeId) {
        await saveSalary({ variables: { employeeId, input: toSalaryInput(values) } });
      }
      notify(isEdit ? 'User updated' : 'User created — credentials emailed');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="email" label="Email" type="email" />
      {isEdit && <RhfTextField name="password" label="New password (optional)" type="password" />}
      <RhfMultiSelect
        name="roles"
        label="Roles"
        options={enumOptions(Object.values(Role))}
        helperText={
          isEdit
            ? 'The same roles the Admin console shows — this is one user record.'
            : 'A temporary password will be emailed to the user.'
        }
      />
      <ProfileFields />
      <EmploymentFields departmentOptions={departmentOptions} positionOptions={positionOptions} />
      <RhfDatePicker name="joinDate" label="Join date" />
      <RhfDatePicker name="dateOfBirth" label="Date of birth (optional)" />
      <WorkArrangementFields />
      <CompensationFields />
      <RhfSelect name="isActive" label="Account access" options={ACTIVE_OPTIONS} />
    </EntityForm>
  );
}

/**
 * Loads an existing employee's compensation before the form mounts.
 *
 * React Hook Form reads `defaultValues` once, on the first render, so a salary structure that
 * arrives afterwards would never reach the fields — the pay type would silently show FIXED
 * for a stipend, and saving would overwrite it. Waiting is the honest fix.
 */
export function UserForm(props: Readonly<UserFormProps>) {
  const { data, loading } = useEmployeeSalaryQuery({
    variables: { employeeId: props.initial?.id ?? '' },
    skip: !props.initial,
    fetchPolicy: 'cache-and-network',
  });

  if (props.initial && loading && !data) {
    return (
      <Flex direction="column" alignItems="center" sx={{ py: 4 }}>
        <CircularProgress size={22} aria-label="Loading compensation" />
      </Flex>
    );
  }

  return <UserFormFields {...props} salary={data?.employeeSalary ?? null} />;
}
