import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_COLUMNS,
  durationOrDash,
  projectLabel,
} from '../../../../../src/pages/hr/attendance/attendance-grid';
import { actionKeys, columnIds, formatCell } from '../../../harness/grid';
import { emptyDay, trackedDay } from './attendance-fixture';

const translate = (source: string) => `«${source}»`;

describe('durationOrDash', () => {
  it('writes a duration in hours and minutes', () => {
    expect(durationOrDash(6.5 * 60 * 60 * 1000)).toBe('6h 30m');
    expect(durationOrDash(59 * 1000)).toBe('0m');
  });

  it('writes a dash, not "0m", for a day nothing was recorded', () => {
    expect(durationOrDash(0)).toBe('—');
    expect(durationOrDash(-1)).toBe('—');
  });
});

describe('projectLabel', () => {
  it('uses the project name', () => {
    expect(projectLabel(trackedDay.tracker.projects[0], translate)).toBe('Website');
  });

  it('names time booked without a project, in the viewer’s language', () => {
    expect(projectLabel(trackedDay.tracker.projects[1], translate)).toBe('«No project»');
  });
});

describe('ATTENDANCE_COLUMNS', () => {
  it('lays out the register with a details action at the end', () => {
    expect(columnIds(ATTENDANCE_COLUMNS)).toEqual([
      'employeeName',
      'date',
      'status',
      'activeMs',
      'manualMs',
      'sessions',
      'projects',
      'note',
      'actions',
    ]);
    expect(actionKeys(ATTENDANCE_COLUMNS)).toEqual(['details']);
  });

  it('writes the tracker brief of a tracked day', () => {
    const cell = (id: string) => formatCell(ATTENDANCE_COLUMNS, id, trackedDay);
    expect(cell('employeeName')).toBe('Asha Rao');
    expect(cell('activeMs')).toBe('6h 30m');
    expect(cell('manualMs')).toBe('45m');
    expect(cell('sessions')).toBe('3');
    expect(cell('projects')).toBe('Website, No project');
    expect(cell('note')).toBe('Client visit');
  });

  it('writes dashes for a day with nothing tracked and no note', () => {
    const cell = (id: string) => formatCell(ATTENDANCE_COLUMNS, id, emptyDay);
    expect(cell('activeMs')).toBe('—');
    expect(cell('manualMs')).toBe('—');
    expect(cell('sessions')).toBe('0');
    expect(cell('projects')).toBe('—');
    expect(cell('note')).toBe('—');
  });

  it('writes nothing while a row is still loading', () => {
    expect(formatCell(ATTENDANCE_COLUMNS, 'projects', undefined)).toBe('');
  });
});
