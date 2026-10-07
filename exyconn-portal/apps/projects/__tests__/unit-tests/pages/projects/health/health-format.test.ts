import { describe, expect, it } from 'vitest';
import { ProjectRisk, ProjectTimeline } from '@exyconn/shell/graphql/generated';
import {
  RISK_COLOR,
  RISK_LABEL,
  TIMELINE_COLOR,
  TIMELINE_LABEL,
  percentLabel,
} from '../../../../../src/pages/projects/health';

describe('percentLabel', () => {
  it('rounds a percentage to a whole number', () => {
    expect(percentLabel(42.4, 'n/a')).toBe('42%');
    expect(percentLabel(42.5, 'n/a')).toBe('43%');
  });

  it('keeps a real zero and a figure past full', () => {
    expect(percentLabel(0, 'n/a')).toBe('0%');
    expect(percentLabel(130, 'n/a')).toBe('130%');
  });

  it('gives the reason instead of a made-up zero when there is no figure', () => {
    expect(percentLabel(null, 'Not tracked')).toBe('Not tracked');
    expect(percentLabel(undefined, 'No budget set')).toBe('No budget set');
  });
});

describe('risk presentation', () => {
  it('colours every risk, leaving an unmeasured project grey rather than green', () => {
    expect(RISK_COLOR).toEqual({
      [ProjectRisk.Low]: 'success',
      [ProjectRisk.Medium]: 'warning',
      [ProjectRisk.High]: 'error',
      [ProjectRisk.Unknown]: 'default',
    });
  });

  it('names every risk in words', () => {
    expect(RISK_LABEL[ProjectRisk.Low]).toBe('On track');
    expect(RISK_LABEL[ProjectRisk.Medium]).toBe('Watch');
    expect(RISK_LABEL[ProjectRisk.High]).toBe('At risk');
    expect(RISK_LABEL[ProjectRisk.Unknown]).toBe('Not measured');
  });
});

describe('timeline presentation', () => {
  it('colours a finished or on-track project green and an overdue one red', () => {
    expect(TIMELINE_COLOR).toEqual({
      [ProjectTimeline.OnTrack]: 'success',
      [ProjectTimeline.Completed]: 'success',
      [ProjectTimeline.DueSoon]: 'warning',
      [ProjectTimeline.Overdue]: 'error',
      [ProjectTimeline.NoDates]: 'default',
    });
  });

  it('names every timeline state', () => {
    expect(Object.values(TIMELINE_LABEL)).toEqual(
      expect.arrayContaining(['On track', 'Completed', 'Due soon', 'Overdue', 'No end date']),
    );
    expect(TIMELINE_LABEL[ProjectTimeline.NoDates]).toBe('No end date');
  });
});
