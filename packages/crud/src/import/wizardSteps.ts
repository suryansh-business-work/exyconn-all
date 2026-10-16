import type { ImportStatus } from './useImportRun';

/** The wizard's steps, in order. The first three are chosen by the person; the run sets the rest. */
export const UPLOAD = 0;
export const MAP = 1;
export const OPTIONS = 2;
export const RUNNING = 3;
export const RESULTS = 4;

export const STEP_LABELS = ['Upload', 'Map columns', 'Options', 'Import', 'Results'];

/** The step on show: the run's own while it is going or finished, else the chosen one. */
export function activeStep(step: number, status: ImportStatus): number {
  if (status === 'running') {
    return RUNNING;
  }
  return status === 'done' ? RESULTS : step;
}
