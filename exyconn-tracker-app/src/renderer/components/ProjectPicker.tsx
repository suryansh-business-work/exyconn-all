import type { ReactElement } from 'react';
import { MenuItem, TextField } from '@exyconn/ui';
import type { TrackerProject } from '@shared/types';
import { run } from '../run';

interface Props {
  projects: TrackerProject[];
  selectedProjectId: string;
  /** A running session is already booked; changing it mid-flight would rewrite the record. */
  disabled: boolean;
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
}: Readonly<Props>): ReactElement {
  return (
    <TextField
      select
      size="small"
      fullWidth
      label="Project"
      value={selectedProjectId}
      disabled={disabled || projects.length === 0}
      helperText={disabled ? 'Locked while tracking — stop to book to another project.' : undefined}
      onChange={(event) => run(() => window.tracker.setProject(event.target.value))}
    >
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
