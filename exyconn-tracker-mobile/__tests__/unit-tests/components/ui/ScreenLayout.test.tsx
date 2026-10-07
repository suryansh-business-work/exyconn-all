import { fireEvent, screen } from '@testing-library/react';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { describe, expect, it, vi } from 'vitest';
import { ScreenLayout } from '../../../../src/components/ui/ScreenLayout';
import { renderWithProviders } from '../../test-utils';

describe('ScreenLayout', () => {
  it('scrolls the screen content, with no pull-to-refresh unless asked for', () => {
    renderWithProviders(
      <ScreenLayout maxWidth={440}>
        <span>Sign in</span>
      </ScreenLayout>,
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
  });

  it('re-reads the portal on pull-to-refresh, and shows when it is doing so', () => {
    const onRefresh = vi.fn();
    renderWithProviders(
      <BottomTabBarHeightContext.Provider value={80}>
        <ScreenLayout onRefresh={onRefresh} refreshing>
          <span>Report</span>
        </ScreenLayout>
      </BottomTabBarHeightContext.Provider>,
    );
    const pull = screen.getByRole('button', { name: 'Refresh' });
    expect(pull).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(pull);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Report')).toBeInTheDocument();
  });

  it('is not refreshing until told so', () => {
    renderWithProviders(
      <ScreenLayout onRefresh={vi.fn()}>
        <span>Report</span>
      </ScreenLayout>,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'false');
  });
});
