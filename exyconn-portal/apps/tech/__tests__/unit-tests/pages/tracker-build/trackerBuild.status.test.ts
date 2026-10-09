import { describe, expect, it } from 'vitest';
import { TrackerPlatform } from '@exyconn/shell/graphql/generated';
import { buildOutcome } from '../../../../src/pages/tracker-build/trackerBuild.status';
import {
  BUILD_PLATFORMS,
  DEFAULT_BUILD_REF,
  MOBILE_BUILD_HINT,
} from '../../../../src/pages/tracker-build/trackerBuild.constants';

const run = (status: string, conclusion?: string | null) => ({
  id: 'r1',
  status,
  conclusion,
  branch: 'main',
  url: 'https://github.example/runs/1',
  startedAt: '2026-10-04T08:00:00.000Z',
});

describe('buildOutcome', () => {
  it('reports a run still going by its status', () => {
    expect(buildOutcome(run('in_progress'))).toBe('IN PROGRESS');
    expect(buildOutcome(run('queued', 'success'))).toBe('QUEUED');
  });

  it('reports a finished run by its conclusion', () => {
    expect(buildOutcome(run('completed', 'success'))).toBe('SUCCESS');
    expect(buildOutcome(run('completed', 'failure'))).toBe('FAILURE');
  });

  it('calls a finished run without a conclusion unknown', () => {
    expect(buildOutcome(run('completed', null))).toBe('UNKNOWN');
    expect(buildOutcome(run('completed'))).toBe('UNKNOWN');
  });
});

describe('tracker build constants', () => {
  it('offers every platform the server can build, once each', () => {
    const values = BUILD_PLATFORMS.map((platform) => platform.value);
    const byName = (a: string, b: string) => a.localeCompare(b);
    const platforms = Object.values(TrackerPlatform);
    values.sort(byName);
    platforms.sort(byName);
    expect(values).toEqual(platforms);
    expect(BUILD_PLATFORMS[0]).toEqual({
      value: TrackerPlatform.Windows,
      label: 'Windows',
      artifact: 'Installer (.exe)',
    });
  });

  it('builds off main and explains the phone builds', () => {
    expect(DEFAULT_BUILD_REF).toBe('main');
    expect(MOBILE_BUILD_HINT).toContain('Android produces an APK');
    expect(MOBILE_BUILD_HINT).toContain('unsigned IPA');
  });
});
