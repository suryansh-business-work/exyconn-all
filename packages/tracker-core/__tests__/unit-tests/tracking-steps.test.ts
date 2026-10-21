import { describe, expect, it } from 'vitest';
import { trackingSteps, type TrackingStepsInput } from '../../src/tracking-steps';

const BASE: TrackingStepsInput = {
  attendanceMarked: false,
  offDay: false,
  selectedProjectId: '',
  presence: 'WORKING',
};

const stepsFor = (input: Partial<TrackingStepsInput>) => trackingSteps({ ...BASE, ...input });

describe('trackingSteps', () => {
  it('lists attendance, project and status in that order', () => {
    expect(stepsFor({}).map((step) => step.id)).toEqual(['attendance', 'project', 'status']);
    expect(stepsFor({}).map((step) => step.title)).toEqual([
      'Mark attendance & location',
      'Project',
      'My status',
    ]);
  });

  it('locks project and status until attendance is marked', () => {
    const [attendance, project, status] = stepsFor({ selectedProjectId: 'p1' });
    expect(attendance).toMatchObject({ state: 'active', hint: null });
    expect(project).toMatchObject({ state: 'locked', hint: 'Mark your attendance first.' });
    expect(status).toMatchObject({ state: 'locked', hint: 'Mark your attendance first.' });
  });

  it('opens project and status once attendance is marked', () => {
    const [attendance, project, status] = stepsFor({ attendanceMarked: true, presence: 'LUNCH' });
    expect(attendance.state).toBe('complete');
    expect(project).toMatchObject({ state: 'active', hint: null });
    expect(status).toMatchObject({ state: 'active', hint: 'On lunch' });
  });

  it('marks the project complete once one is chosen', () => {
    const [, project] = stepsFor({ attendanceMarked: true, selectedProjectId: 'p1' });
    expect(project.state).toBe('complete');
  });

  it('gates nothing on an off day, keeping attendance active for its banner', () => {
    const [attendance, project, status] = stepsFor({ offDay: true, selectedProjectId: 'p1' });
    expect(attendance.state).toBe('active');
    expect(project).toMatchObject({ state: 'complete', hint: null });
    expect(status).toMatchObject({ state: 'active', hint: 'Working' });
  });
});
