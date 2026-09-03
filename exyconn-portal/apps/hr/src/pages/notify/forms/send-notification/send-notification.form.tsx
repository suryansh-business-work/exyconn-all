import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfMultiSelect } from '@exyconn/shell/components/form/rhf';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  NotificationAudience,
  NotificationKind,
  useListUsersQuery,
  useSendNotificationMutation,
} from '@exyconn/shell/graphql/generated';

const schema = z
  .object({
    kind: z.nativeEnum(NotificationKind),
    title: z.string().trim().min(1, 'Title is required').max(120, 'Keep it under 120 characters'),
    body: z.string().trim(),
    link: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || v.startsWith('/'),
        'Link must be an in-portal path like /me/announcements',
      ),
    audience: z.nativeEnum(NotificationAudience),
    department: z.string().trim(),
    employeeIds: z.array(z.string()),
  })
  .refine((v) => v.audience !== NotificationAudience.Department || v.department.length > 0, {
    path: ['department'],
    message: 'Pick a department',
  })
  .refine((v) => v.audience !== NotificationAudience.Employees || v.employeeIds.length > 0, {
    path: ['employeeIds'],
    message: 'Pick at least one employee',
  });
type Values = z.infer<typeof schema>;

const INITIAL: Values = {
  kind: NotificationKind.General,
  title: '',
  body: '',
  link: '',
  audience: NotificationAudience.All,
  department: '',
  employeeIds: [],
};

interface SendNotificationFormProps {
  onSent: (recipients: number) => void;
}

/** React Hook Form + Zod form for HR to broadcast an in-app notification. */
export function SendNotificationForm({ onSent }: Readonly<SendNotificationFormProps>) {
  const notify = useNotify();
  const [send, { loading }] = useSendNotificationMutation();
  const { data } = useListUsersQuery();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });
  const audience = methods.watch('audience');

  const users = data?.listUsers ?? [];
  const employeeOptions = users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));
  const departmentOptions = [
    ...new Set(users.map((u) => u.department).filter((d): d is string => Boolean(d))),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((d) => ({ value: d, label: d }));

  const onSubmit = async (values: Values) => {
    try {
      const { data: result } = await send({
        variables: {
          input: {
            kind: values.kind,
            title: values.title,
            body: values.body || null,
            link: values.link || null,
            audience: values.audience,
            department:
              values.audience === NotificationAudience.Department ? values.department : null,
            employeeIds:
              values.audience === NotificationAudience.Employees ? values.employeeIds : null,
          },
        },
      });
      const count = result?.sendNotification.recipients ?? 0;
      notify(`Sent to ${count} ${count === 1 ? 'person' : 'people'}.`, 'success');
      methods.reset(INITIAL);
      onSent(count);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not send', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2}>
          <RhfSelect
            name="kind"
            label="Type"
            options={enumOptions(Object.values(NotificationKind))}
          />
          <RhfTextField name="title" label="Title" />
          <RhfTextField name="body" label="Message (optional)" multiline minRows={3} />
          <RhfTextField name="link" label="Opens (optional path, e.g. /me/announcements)" />
          <RhfSelect
            name="audience"
            label="Send to"
            options={enumOptions(Object.values(NotificationAudience))}
          />
          {audience === NotificationAudience.Department && (
            <RhfSelect name="department" label="Department" options={departmentOptions} />
          )}
          {audience === NotificationAudience.Employees && (
            <RhfMultiSelect name="employeeIds" label="Employees" options={employeeOptions} />
          )}
          <Flex direction="row" justifyContent="flex-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send notification'}
            </Button>
          </Flex>
        </Flex>
      </form>
    </FormProvider>
  );
}
