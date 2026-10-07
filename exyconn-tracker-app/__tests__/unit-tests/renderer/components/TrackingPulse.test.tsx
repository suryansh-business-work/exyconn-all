// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { TrackerStatus } from '@shared/types';
import TrackingPulse from '../../../../src/renderer/components/TrackingPulse';
import { LiveAnnouncer } from '../../../../src/renderer/a11y/LiveAnnouncer';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function dot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="img"]');
}

describe('TrackingPulse', () => {
  it.each<[TrackerStatus, string]>([
    ['signed-out', 'Signed out'],
    ['consent-required', 'Waiting for your consent'],
    ['idle', 'Not tracking — nothing is being recorded'],
    ['paused', 'Paused — nothing is being recorded'],
  ])('holds a still dot while %s', async (status, label) => {
    await render(<TrackingPulse status={status} />);
    expect(dot()?.getAttribute('aria-label')).toBe(label);
    expect(dot()?.children).toHaveLength(1);
  });

  it('pulses only while tracking, reachable from the keyboard, and says so aloud', async () => {
    await render(
      <LiveAnnouncer>
        <TrackingPulse status="tracking" />
      </LiveAnnouncer>,
    );
    expect(dot()?.getAttribute('aria-label')).toBe('Tracking — recording your work');
    expect(dot()?.tabIndex).toBe(0);
    expect(dot()?.children).toHaveLength(2);
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
      'Tracking — recording your work',
    );
  });
});
