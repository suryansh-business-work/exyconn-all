import type { ReactElement } from 'react';
import { MenuItem, TextField } from '@exyconn/ui';
import type { TrackerProject } from '@shared/types';
import { useT } from '@exyconn/i18n';
import { projectHint } from '@exyconn/tracker-core';
import { run } from '../run';
import SelectSpinner from './SelectSpinner';

interface Props {
  projects: TrackerProject[];
  selectedProjectId: string;
  /** A running session is already booked; changing it mid-flight would rewrite the record. */
  disabled: boolean;
  /** The portal has not answered yet, so there is no list to choose from. */
  loading: boolean;
}

/**
 * What the next session books its time against.
 *
 * The list comes from the Projects module, never from this app, and always leads with the
 * house-wide "Global Project" — time that belongs to no particular project still belongs
 * somewhere. Locked while tracking, because the project was fixed when the session opened.
 */
export default function ProjectPicker({
  projects,
  selectedProjectId,
  disabled,
  loading,
}: Readonly<Props>): ReactElement {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={t('Project')}
      value={selectedProjectId}
      disabled={disabled || loading || projects.length === 0}
      helperText={projectHint(t, { loading, locked: disabled })}
      onChange={(event) => run(() => window.tracker.setProject(event.target.value))}
      slotProps={{ select: { IconComponent: loading ? SelectSpinner : undefined } }}
    >
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
