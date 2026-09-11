import { useMemo } from 'react';
import type { TrackerProject } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { PickerField } from '../form/PickerField';

/** Past this many projects the sheet gets a search box; a short list reads faster without. */
const SEARCH_FROM = 8;

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
export function ProjectPicker({ projects, selectedProjectId, disabled }: Readonly<Props>) {
  const options = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );
  const empty = projects.length === 0;

  return (
    <PickerField
      id="project"
      label="Project"
      options={options}
      selected={selectedProjectId}
      placeholder={empty ? 'No projects yet' : 'Choose a project'}
      hint={disabled ? 'Locked while tracking — stop to book to another project.' : undefined}
      disabled={disabled || empty}
      searchable={options.length > SEARCH_FROM}
      onSelect={(projectId) => tracker.setProject(projectId)}
    />
  );
}
