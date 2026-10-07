import { waitFor } from '@testing-library/react';
import { AccessibilityInfo, Animated } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { TrackingPulse, trackingStatusLabel } from '../../../../src/components/shell/TrackingPulse';
import { renderWithProviders } from '../../test-utils';

/** The loop the pulse started, if it started one. */
function startedLoop() {
  return vi.mocked(Animated.loop).mock.results[0]?.value;
}

describe('trackingStatusLabel', () => {
  it('says plainly, per status, whether anything is being recorded', () => {
    expect(trackingStatusLabel('signed-out')).toBe('Signed out');
    expect(trackingStatusLabel('consent-required')).toBe('Waiting for your consent');
    expect(trackingStatusLabel('idle')).toBe('Not tracking — nothing is being recorded');
    expect(trackingStatusLabel('tracking')).toBe('Tracking — recording your work');
    expect(trackingStatusLabel('paused')).toBe('Paused — nothing is being recorded');
  });
});

describe('TrackingPulse', () => {
  it('pulses, slowly, only while tracking', () => {
    renderWithProviders(<TrackingPulse status="tracking" />);
    expect(Animated.loop).toHaveBeenCalledTimes(1);
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, duration: 2000 }),
    );
    expect(startedLoop()?.start).toHaveBeenCalled();
  });

  it('stays still while paused, and says what it means in words', () => {
    const onMissing = vi.fn();
    renderWithProviders(<TrackingPulse status="paused" />, { onMissing });
    expect(Animated.loop).not.toHaveBeenCalled();
    expect(onMissing).toHaveBeenCalledWith('Paused — nothing is being recorded');
  });

  it('stops the pulse when it leaves the screen', () => {
    const { unmount } = renderWithProviders(<TrackingPulse status="tracking" />);
    unmount();
    expect(startedLoop()?.stop).toHaveBeenCalled();
  });

  it('stops moving when the phone asks for reduced motion', async () => {
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
    renderWithProviders(<TrackingPulse status="tracking" />);
    await waitFor(() => expect(startedLoop()?.stop).toHaveBeenCalled());
    expect(Animated.loop).toHaveBeenCalledTimes(1);
  });
});
