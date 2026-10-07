import { createRef } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import type { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { LightboxNav, LightboxTopBar } from '../../../../src/components/screenshots/LightboxBars';
import { renderWithProviders } from '../../test-utils';
import { AccessibilityInfo } from '../../mocks/react-native/apis';

describe('LightboxTopBar', () => {
  it('shows when the shot was taken and how active it was, and closes', () => {
    const onClose = vi.fn();
    const titleRef = createRef<Text>();
    renderWithProviders(
      <LightboxTopBar
        titleRef={titleRef}
        capturedAt="Tue 3 Feb, 10:42 AM"
        activityPercent={85}
        blurred={false}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Tue 3 Feb, 10:42 AM')).toBeInTheDocument();
    expect(screen.getByText('85% active')).toBeInTheDocument();
    expect(screen.queryByText('Blurred')).not.toBeInTheDocument();
    // The screen reader starts on the capture time when the viewer opens.
    expect(titleRef.current).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('says when the shot was blurred', () => {
    renderWithProviders(
      <LightboxTopBar
        titleRef={createRef<Text>()}
        capturedAt="Tue 3 Feb, 10:42 AM"
        activityPercent={20}
        blurred
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Blurred')).toBeInTheDocument();
    expect(screen.getByText('20% active')).toBeInTheDocument();
  });
});

describe('LightboxNav', () => {
  it('says where in the day the shot sits and steps either way', () => {
    const onStep = vi.fn();
    renderWithProviders(<LightboxNav index={1} total={5} onStep={onStep} />);

    expect(screen.getByText('2 / 5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onStep).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onStep).toHaveBeenLastCalledWith(1);
  });

  it('points each arrow the way it goes', () => {
    renderWithProviders(<LightboxNav index={0} total={2} onStep={vi.fn()} />);

    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(within(previous).getByTestId('icon-chevron-left')).toBeInTheDocument();
    expect(within(previous).queryByTestId('icon-chevron-right')).not.toBeInTheDocument();
    expect(within(next).getByTestId('icon-chevron-right')).toBeInTheDocument();
    expect(within(next).queryByTestId('icon-chevron-left')).not.toBeInTheDocument();
  });

  it('tells VoiceOver the new position after a step', () => {
    const { rerender } = renderWithProviders(<LightboxNav index={0} total={3} onStep={vi.fn()} />);

    rerender(<LightboxNav index={1} total={3} onStep={vi.fn()} />);

    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('2 / 3');
  });
});
