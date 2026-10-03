import { useEffect, useState } from 'react';
import type { TrackerTask } from '@shared/types';

export interface ProjectTasks {
  tasks: TrackerTask[];
  /** True while the project's tickets are on their way from the portal. */
  loading: boolean;
}

/**
 * The tickets on one project, the employee's own assigned ones first.
 *
 * Read for the project chosen in a form, not the one the next session is booked against —
 * browsing tickets in a claim must not re-point what the tracker records to.
 */
export default function useProjectTasks(projectId: string): ProjectTasks {
  const [tasks, setTasks] = useState<TrackerTask[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setTasks([]);
    if (projectId === '') {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    window.tracker
      .getTasks(projectId)
      .then((rows) => {
        if (active) {
          setTasks(rows);
        }
      })
      .catch((cause: unknown) => {
        console.error('Loading tickets failed', cause);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  return { tasks, loading };
}
