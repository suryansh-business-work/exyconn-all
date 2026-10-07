import { screen } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { describe, expect, it } from 'vitest';
import { Notice } from '../../../../src/components/ui/Notice';
import { CHROME } from '../../../../src/theme/palette';
import { renderWithProviders } from '../../test-utils';

describe('Notice', () => {
  it.each([
    ['success', 'check-circle-outline', CHROME.light.success],
    ['info', 'information-outline', CHROME.light.ink],
    ['warning', 'alert-outline', CHROME.light.warning],
    ['error', 'alert-circle-outline', CHROME.light.error],
  ] as const)('marks a %s notice with its own icon and hue', (severity, icon, color) => {
    renderWithProviders(<Notice severity={severity}>Something changed</Notice>);
    expect(screen.getByText('Something changed')).toBeInTheDocument();
    expect(screen.getByTestId(`icon-${icon}`)).toHaveAttribute('data-color', color);
  });

  it('adds the quieter second line, and takes a custom icon', () => {
    renderWithProviders(
      <Notice severity="warning" icon="wifi-off" detail="It will retry by itself.">
        Offline
      </Notice>,
    );
    expect(screen.getByText('It will retry by itself.')).toBeInTheDocument();
    expect(screen.getByTestId('icon-wifi-off')).toBeInTheDocument();
  });

  it('is announced to VoiceOver the moment it appears', () => {
    renderWithProviders(<Notice severity="error">Could not sign in.</Notice>);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Could not sign in.');
  });

  it('announces nothing when its content is not plain text', () => {
    renderWithProviders(
      <Notice severity="info">
        <span>Rich content</span>
      </Notice>,
    );
    expect(screen.getByText('Rich content')).toBeInTheDocument();
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });
});
