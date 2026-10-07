// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackerSettings } from '@shared/types';
import AutoStopNotice from '../../../../src/renderer/components/AutoStopNotice';
import { render, trackerState, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

/** A workspace that tracks from 9 AM to 6 PM. */
function schedule(): TrackerSettings {
  const settings = trackerState('idle').settings;
  if (settings === null) {
    throw new Error('The fixture state carries settings');
  }
  return { ...settings, autoStartEnabled: true, autoStartHour: 9, autoStopHour: 18 };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
});
afterEach(() => {
  unmountAll();
  vi.useRealTimers();
});

function alertTone(): string {
  return document.querySelector('.MuiAlert-colorWarning') === null ? 'info' : 'warning';
}

describe('AutoStopNotice', () => {
  it('says nothing when the workspace runs no schedule', async () => {
    vi.setSystemTime(new Date('2026-09-14T12:00:00.000Z'));
    await render(<AutoStopNotice settings={null} timezone="UTC" status="tracking" />);
    expect(document.body.textContent).toBe('');
  });

  it('states the hours, then turns into a warning as the stop hour comes round', async () => {
    vi.setSystemTime(new Date('2026-09-14T17:44:00.000Z'));
    await render(<AutoStopNotice settings={schedule()} timezone="UTC" status="tracking" />);
    // Intl may join the time and AM with a narrow no-break space, hence \s.
    expect(pageText()).toMatch(/Tracking hours: 9:00\sAM to 6:00\sPM/);
    expect(alertTone()).toBe('info');

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(pageText()).toContain('Tracking stops in 15 minutes');
    expect(alertTone()).toBe('warning');
  });

  it('warns outside the window that a session started now stops again', async () => {
    vi.setSystemTime(new Date('2026-09-14T20:00:00.000Z'));
    await render(<AutoStopNotice settings={schedule()} timezone="UTC" status="idle" />);
    expect(pageText()).toMatch(/Outside your tracking hours \(9:00\sAM to 6:00\sPM\)/);
    expect(alertTone()).toBe('warning');
  });
});
