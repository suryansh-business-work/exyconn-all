import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import { projectHint, type TrackerProject } from '@exyconn/tracker-core';
import { tracker } from '../../tracker/instance';
import { PickerField } from '../form/PickerField';

/** Past this many projects the sheet gets a search box; a short list reads faster without. */
const SEARCH_FROM = 8;

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
export function ProjectPicker({ projects, selectedProjectId, disabled, loading }: Readonly<Props>) {
  const t = useT();
  const options = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );
  const empty = projects.length === 0 && !loading;

  return (
    <PickerField
      id="project"
      label={t('Project')}
      options={options}
      selected={selectedProjectId}
      placeholder={empty ? t('No projects yet') : t('Choose a project')}
      hint={projectHint(t, { loading, locked: disabled })}
      disabled={disabled || empty}
      busy={loading}
      searchable={options.length > SEARCH_FROM}
      onSelect={(projectId) => tracker.setProject(projectId)}
    />
  );
}
