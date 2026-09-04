import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
} from '@/graphql/generated';
import { EmploymentFields, ProfileFields, WorkArrangementFields } from './user.fields';
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

/** React Hook Form + Zod form to create or update a portal user. */
export function UserForm({ initial, onDone, onCancel, onCreated }: Readonly<UserFormProps>) {
  const notify = useNotify();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const { data: deptData } = useListDepartmentsQuery();
  const { data: posData } = useListPositionsQuery();
  const isEdit = Boolean(initial);
  const methods = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: toFormValues(initial),
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
        if (data?.createUser) {
          onCreated?.({
            name: values.name,
            email: values.email,
            password: data.createUser.password,
          });
        }
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
        helperText={isEdit ? undefined : 'A temporary password will be emailed to the user.'}
      />
      <ProfileFields />
      <EmploymentFields departmentOptions={departmentOptions} positionOptions={positionOptions} />
      <RhfDatePicker name="joinDate" label="Join date" />
      <RhfDatePicker name="dateOfBirth" label="Date of birth (optional)" />
      <WorkArrangementFields />
      <RhfSelect name="isActive" label="Account access" options={ACTIVE_OPTIONS} />
    </EntityForm>
  );
}
