import { renderHook } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { describe, expect, it } from 'vitest';
import { LIVE_REGION, useStatusMessage } from '../../../src/hooks/useStatusMessage';
import { Platform } from '../mocks/react-native/apis';

function render(message: string | null | undefined, onMount?: boolean) {
  return renderHook(({ text }) => useStatusMessage(text, onMount), {
    initialProps: { text: message },
  });
}

describe('useStatusMessage', () => {
  it("returns Android's polite live region for the view showing the message", () => {
    const { result } = render('Synced');
    expect(result.current).toBe(LIVE_REGION);
    expect(LIVE_REGION).toEqual({ accessibilityLiveRegion: 'polite' });
  });

  it('does not announce a label that was already there when the screen opened', () => {
    render('September 2026');
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it('tells VoiceOver each time the message changes', () => {
    const { rerender } = render('September 2026');
    rerender({ text: 'October 2026' });
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('October 2026');
  });

  it('announces a message that is itself news as soon as it appears', () => {
    render('Could not sign in.', true);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Could not sign in.');
  });

  it('stays quiet when there is no message', () => {
    const { rerender } = render(null, true);
    rerender({ text: '' });
    rerender({ text: undefined });
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it('leaves Android to its live region instead of announcing', () => {
    Platform.OS = 'android';
    const { rerender } = render('Tracking', true);
    rerender({ text: 'Paused' });
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });
});
