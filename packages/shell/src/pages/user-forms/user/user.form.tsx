import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
  type SelectOption,
} from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  Role,
  EmploymentStatus,
  useCreateUserMutation,
  useUpdateUserMutation,
  useListDepartmentsQuery,
  useListPositionsQuery,
} from '@/graphql/generated';
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

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().refine((v) => !v || v.length >= 6, 'Minimum 6 characters'),
  roles: z.array(z.nativeEnum(Role)).min(1, 'Select at least one role'),
  isActive: z.enum(['true', 'false']),
  department: z.string().trim().min(1, 'Department is required'),
  designation: z.string().trim().min(1, 'Designation is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  employmentStatus: z.nativeEnum(EmploymentStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: UserRow | null): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  password: '',
  roles: row?.roles ?? [Role.Employee],
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
  department: row?.department ?? '',
  designation: row?.designation ?? '',
  joinDate: row?.joinDate ?? '',
  employmentStatus: row?.employmentStatus ?? EmploymentStatus.Active,
});

/** Maps form values to the HR portion of the GraphQL input. */
const hrInput = (v: Values) => ({
  department: v.department,
  designation: v.designation,
  joinDate: v.joinDate,
  employmentStatus: v.employmentStatus,
});

interface UserFormProps {
  initial: UserRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** Called after a successful create with the one-time credentials to reveal. */
  onCreated?: (creds: { name: string; email: string; password: string }) => void;
}

/** React Hook Form + Zod form to create or update a portal user. */
export function UserForm({ initial, onDone, onCancel, onCreated }: UserFormProps) {
  const notify = useNotify();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const { data: deptData } = useListDepartmentsQuery();
  const { data: posData } = useListPositionsQuery();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const departmentOptions = nameOptions(
    (deptData?.listDepartments ?? []).map((d) => d.name),
    initial?.department,
  );
  const positionOptions = nameOptions(
    (posData?.listPositions ?? []).map((p) => p.name),
    initial?.designation,
  );

  const onSubmit = async (values: Values) => {
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
              ...hrInput(values),
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
              ...hrInput(values),
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
      <RhfSelect
        name="department"
        label="Department"
        options={departmentOptions}
        helperText={
          departmentOptions.length ? undefined : 'Add departments in HR → Departments first.'
        }
      />
      <RhfSelect
        name="designation"
        label="Designation"
        options={positionOptions}
        helperText={positionOptions.length ? undefined : 'Add positions in HR → Positions first.'}
      />
      <RhfDatePicker name="joinDate" label="Join date" />
      <RhfSelect
        name="employmentStatus"
        label="Employment status"
        options={enumOptions(Object.values(EmploymentStatus))}
      />
      <RhfSelect name="isActive" label="Account access" options={ACTIVE_OPTIONS} />
    </EntityForm>
  );
}
