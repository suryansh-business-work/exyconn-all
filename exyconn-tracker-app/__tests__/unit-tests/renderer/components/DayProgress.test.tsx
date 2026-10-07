// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { WorkProfile, Workday } from '@shared/types';
import { DEFAULT_WORK_HOURS } from '@exyconn/tracker-core';
import DayProgress from '../../../../src/renderer/components/DayProgress';
import { render, trackerState, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const HOUR = 3_600_000;
const state = trackerState('tracking');

function workday(targetMs: number): Workday | null {
  return state.workday === null ? null : { ...state.workday, targetMs };
}

function profile(workHoursPerDay: number): WorkProfile | null {
  return state.workProfile === null
    ? null
    : { ...state.workProfile, workHoursPerDay, targetMs: workHoursPerDay * HOUR };
}

function bar(): Element | null {
  return document.querySelector('[role="progressbar"]');
}

describe('DayProgress', () => {
  it('fills the bar towards the day’s target and says what is left', async () => {
    await render(
      <DayProgress
        workday={workday(8 * HOUR)}
        workProfile={profile(8)}
        activeMs={2 * HOUR}
        style="bar"
      />,
    );
    expect(bar()?.getAttribute('aria-valuenow')).toBe('25');
    expect(bar()?.getAttribute('aria-label')).toBe('2h 0m of 8h 0m worked today');
    expect(pageText()).toContain('25% — 6h 0m left of your 8h day.');
    expect(pageText()).toContain('of 8h 0m');
  });

  it('draws a finished day as a full green ring', async () => {
    await render(
      <DayProgress
        workday={workday(6 * HOUR)}
        workProfile={profile(6)}
        activeMs={7 * HOUR}
        style="ring"
      />,
    );
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('100%. 7h 0m');
    expect(pageText()).toContain('Full 6h day complete.');
    expect(document.querySelector('.MuiCircularProgress-colorSuccess')).not.toBeNull();
  });

  it('falls back to HR’s profile target before the workday has loaded', async () => {
    await render(
      <DayProgress workday={null} workProfile={profile(4)} activeMs={HOUR} style="ring" />,
    );
    expect(pageText()).toContain('25% — 3h 0m left of your 4h day.');
    expect(document.querySelector('.MuiCircularProgress-colorSuccess')).toBeNull();
  });

  it('shows nothing done, against the default day, when no target is known yet', async () => {
    await render(<DayProgress workday={null} workProfile={null} activeMs={HOUR} style="bar" />);
    expect(bar()?.getAttribute('aria-valuenow')).toBe('0');
    expect(pageText()).toContain(`0% — 0m left of your ${DEFAULT_WORK_HOURS}h day.`);
  });

  it('explains where the working day comes from behind the info button', async () => {
    await render(
      <DayProgress workday={workday(8 * HOUR)} workProfile={profile(8)} activeMs={0} style="bar" />,
    );
    const info = document.querySelector('[aria-label="How your working day is set"]');
    expect(info?.tagName).toBe('BUTTON');
  });
});
