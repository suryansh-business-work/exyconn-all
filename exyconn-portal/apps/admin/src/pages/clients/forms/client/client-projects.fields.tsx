import { Controller, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Checkbox,
  Chip,
  ListItemText,
  MenuItem,
  TextField,
} from '@exyconn/shell/components/ui';
import type { ClientProjectOptionsQuery } from '@exyconn/shell/graphql/generated';
import type { ClientFormValues } from './client.types';
import { ClientSection } from './client-section';

export type ClientProjectOption = ClientProjectOptionsQuery['clientProjectOptions'][number];

interface ClientProjectsFieldsProps {
  /** The client being edited, or null for a new one. */
  clientId: string | null;
  projects: ClientProjectOption[];
  loading: boolean;
}

const projectTitle = (project: ClientProjectOption) => `${project.key} · ${project.name}`;

/**
 * The projects linked to this client — what its client hub shows. Picking a project that
 * belongs to another client moves it here when the form is saved.
 */
export function ClientProjectsFields({
  clientId,
  projects,
  loading,
}: Readonly<ClientProjectsFieldsProps>) {
  const t = useT();
  const { control } = useFormContext<ClientFormValues>();
  const titleOf = (id: string) => {
    const project = projects.find((option) => option.id === id);
    return project ? projectTitle(project) : id;
  };
  const elsewhere = (project: ClientProjectOption) =>
    project.clientId !== '' && project.clientId !== clientId
      ? t('Currently with {client}', { client: project.clientName })
      : undefined;
  let hint = t('Projects shown in this client’s hub');
  if (loading) {
    hint = t('Loading projects…');
  } else if (projects.length === 0) {
    hint = t('No projects yet. Create one in the Projects portal.');
  }

  return (
    <ClientSection title="Projects">
      <Controller
        name="projectIds"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            select
            fullWidth
            label={t('Projects')}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            disabled={loading}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? hint}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((id) => (
                      <Chip key={id} label={titleOf(id)} size="small" />
                    ))}
                  </Box>
                ),
              },
            }}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                <Checkbox checked={field.value.includes(project.id)} size="small" />
                <ListItemText primary={projectTitle(project)} secondary={elsewhere(project)} />
              </MenuItem>
            ))}
          </TextField>
        )}
      />
    </ClientSection>
  );
}
