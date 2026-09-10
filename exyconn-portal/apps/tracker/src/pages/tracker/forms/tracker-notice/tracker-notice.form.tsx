import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Grid } from '@exyconn/shell/components/ui';
import { RhfMultiSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useSendTrackerNoticeMutation } from '@exyconn/shell/graphql/generated';
import type { SelectOption } from '@exyconn/shell/components/form/rhf/types';

/** The server enforces these too; the form stops before the round trip does. */
const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'A notice needs a title')
    .max(120, 'Keep the title under 120 characters'),
  body: z
    .string()
    .trim()
    .min(1, 'A notice needs something to say')
    .max(2000, 'Keep the message under 2000 characters'),
  userIds: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

interface TrackerNoticeFormProps {
  /** Every employee who could receive one, for the optional narrowing. */
  employees: SelectOption[];
}

/**
 * Sends an announcement to tracked desktops.
 *
 * It lands as a desktop notification on every recipient's machine, wherever they are and
 * whatever they are doing — which is exactly why it asks for confirmation first, and why the
 * default of "everyone" is stated in words rather than left as an empty field somebody might
 * read as "nobody".
 */
export function TrackerNoticeForm({ employees }: Readonly<TrackerNoticeFormProps>) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [sendNotice] = useSendTrackerNoticeMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '', userIds: [] },
  });

  const chosen = methods.watch('userIds') ?? [];
  const audience =
    chosen.length === 0 ? 'every employee with tracker access' : `${chosen.length} employee(s)`;

  const onSubmit = async (values: Values) => {
    const ok = await confirm({
      title: 'Send this notice?',
      message: `It appears immediately as a desktop notification for ${audience}. It cannot be recalled.`,
      confirmText: 'Send',
    });
    if (!ok) return;
    try {
      const result = await sendNotice({ variables: { input: values } });
      const reached = result.data?.sendTrackerNotice ?? 0;
      notify(`Notice sent to ${reached} employee(s)`);
      methods.reset({ title: '', body: '', userIds: [] });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send the notice', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Send notice"
      onCancel={() => methods.reset({ title: '', body: '', userIds: [] })}
    >
      <Alert severity="info">
        This appears as a desktop notification on the tracker, and stays under Announcements in the
        app. Leave the recipients empty to reach {audience}.
      </Alert>
      <Grid container spacing={2}>
        <Grid size={12}>
          <RhfTextField name="title" label="Title" />
        </Grid>
        <Grid size={12}>
          <RhfTextField name="body" label="Message" multiline minRows={4} />
        </Grid>
        <Grid size={12}>
          <RhfMultiSelect
            name="userIds"
            label="Recipients (optional)"
            options={employees}
            helperText="Leave empty to send to everyone with tracker access."
          />
        </Grid>
      </Grid>
    </EntityForm>
  );
}
