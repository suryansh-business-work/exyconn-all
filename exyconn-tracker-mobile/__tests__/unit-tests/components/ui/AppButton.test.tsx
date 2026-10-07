import { createRef } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { TamaguiElement } from 'tamagui';
import { describe, expect, it, vi } from 'vitest';
import { AppButton } from '../../../../src/components/ui/AppButton';
import { brandColors } from '../../../../src/theme/brand';
import { CHROME } from '../../../../src/theme/palette';
import { renderWithProviders } from '../../test-utils';

const BRAND = brandColors(null, 'light');

describe('AppButton', () => {
  it('runs its action when pressed', () => {
    const onPress = vi.fn();
    renderWithProviders(<AppButton label="Save" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws its icon in the ink that reads on the brand fill', () => {
    renderWithProviders(<AppButton label="Save" icon="content-save" onPress={vi.fn()} full />);
    expect(screen.getByTestId('icon-content-save')).toHaveAttribute('data-color', BRAND.onPrimary);
  });

  it('draws an outlined button in the brand colour', () => {
    renderWithProviders(
      <AppButton label="Save note" tone="outlined" icon="content-save" onPress={vi.fn()} />,
    );
    expect(screen.getByTestId('icon-content-save')).toHaveAttribute('data-color', BRAND.primary);
  });

  it("draws a destructive action in the theme's error colour", () => {
    renderWithProviders(
      <AppButton label="Sign out" tone="text" icon="logout" danger onPress={vi.fn()} />,
    );
    expect(screen.getByTestId('icon-logout')).toHaveAttribute('data-color', CHROME.light.error);
  });

  it('ignores presses while disabled', () => {
    const onPress = vi.fn();
    renderWithProviders(<AppButton label="Save" onPress={onPress} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('swaps the icon for a spinner and blocks presses while busy', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <AppButton
        label="Send"
        icon="send"
        busy
        onPress={onPress}
        accessibilityLabel="Send message"
      />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-send')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Send/ }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hands its ref to the button, so a pop-up can give focus back to it', () => {
    const ref = createRef<TamaguiElement>();
    renderWithProviders(<AppButton ref={ref} label="Sign out" onPress={vi.fn()} />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Sign out' }));
  });
});
