import { useT } from '@exyconn/i18n';
import { Checkbox, FormControlLabel, FormGroup, Stack, Text } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListProjectsQuery,
  useUpdateProjectMutation,
  type ListProjectsQuery,
} from '@exyconn/shell/graphql/generated';

type Project = ListProjectsQuery['listProjects'][number];

interface ClientProjectsPickerProps {
  clientId: string;
}

/** The same project with only its client changed — the update takes the whole project. */
const withClient = (project: Project, clientId: string | null) => ({
  name: project.name,
  description: project.description,
  status: project.status,
  startDate: project.startDate,
  endDate: project.endDate,
  budgetAmount: project.budgetAmount,
  budgetHours: project.budgetHours,
  clientId,
});

/**
 * Which projects this client follows in the client hub. Ticking a project makes this client
 * its client (the same field as Projects › Project › Client); unticking clears it. A project
 * that belongs to another client says so, and moving it asks first.
 */
export function ClientProjectsPicker({ clientId }: Readonly<ClientProjectsPickerProps>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { data, loading, refetch } = useListProjectsQuery({ fetchPolicy: 'cache-and-network' });
  const [updateProject] = useUpdateProjectMutation();
  const projects = data?.listProjects ?? [];

  const toggle = async (project: Project, share: boolean) => {
    if (share && project.clientId && project.clientId !== clientId) {
      const ok = await confirm({
        title: 'Move project',
        message: '{project} belongs to {client}. Show it to this client instead?',
        messageValues: { project: project.name, client: project.clientName },
        confirmText: 'Move',
      });
      if (!ok) return;
    }
    try {
      await updateProject({
        variables: { id: project.id, input: withClient(project, share ? clientId : null) },
      });
      await refetch();
    } catch (err) {
      notify(errorMessage(err, t('Could not change the project')), 'error');
    }
  };

  return (
    <Stack spacing={1}>
      <Text weight="semibold">{t('Projects in the client hub')}</Text>
      <Text size="sm" color="text.secondary">
        {t('Ticked projects show in this client’s hub: status, dates, hours and milestones.')}
      </Text>
      {!loading && projects.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('No projects yet. Create one in the Projects portal.')}
        </Text>
      )}
      <FormGroup>
        {projects.map((project) => {
          const mine = project.clientId === clientId;
          const elsewhere = Boolean(project.clientId) && !mine;
          const label = elsewhere
            ? t('{project} — currently {client}', {
                project: project.name,
                client: project.clientName,
              })
            : project.name;
          return (
            <FormControlLabel
              key={project.id}
              control={
                <Checkbox
                  checked={mine}
                  onChange={(event) => {
                    toggle(project, event.target.checked).catch((err: unknown) =>
                      notify(errorMessage(err, t('Could not change the project')), 'error'),
                    );
                  }}
                />
              }
              label={label}
            />
          );
        })}
      </FormGroup>
    </Stack>
  );
}
