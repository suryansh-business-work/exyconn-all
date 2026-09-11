import { useEffect, useState } from 'react';
import type { TrackerTask } from '@exyconn/tracker-core';
import { tracker } from '../tracker/instance';

/**
 * The tickets on one project, the employee's own assigned ones first.
 *
 * Read for the project chosen in a form, not the one the next session is booked against —
 * browsing tickets in a claim must not re-point what the tracker records to.
 */
export function useProjectTasks(projectId: string): TrackerTask[] {
  const [tasks, setTasks] = useState<TrackerTask[]>([]);

  useEffect(() => {
    let active = true;
    setTasks([]);
    if (projectId === '') {
      return undefined;
    }
    tracker
      .getTasks(projectId)
      .then((rows) => {
        if (active) {
          setTasks(rows);
        }
      })
      .catch((cause: unknown) => {
        console.error('Loading tickets failed', cause);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  return tasks;
}
