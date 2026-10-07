import { fireEvent, screen } from '@testing-library/react';
import type { ThemeMode } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../../../../src/components/shell/ThemeToggle';
import { tracker } from '../../../../src/tracker/instance';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/tracker/instance', () => ({ tracker: { setPreferences: vi.fn() } }));

describe('ThemeToggle', () => {
  it.each([
    ['system', 'Theme: Matching your system. Switch to light.', 'brightness-auto', 'light'],
    ['light', 'Theme: Light. Switch to dark.', 'white-balance-sunny', 'dark'],
    ['dark', 'Theme: Dark. Switch to matching your system.', 'weather-night', 'system'],
  ] as const)(
    'in %s mode, says where a tap goes and cycles there',
    (mode: ThemeMode, label, icon, next) => {
      renderWithProviders(<ThemeToggle mode={mode} />);
      const button = screen.getByRole('button', { name: label });
      expect(screen.getByTestId(`icon-${icon}`)).toBeInTheDocument();
      fireEvent.click(button);
      expect(tracker.setPreferences).toHaveBeenCalledWith({ themeMode: next });
    },
  );

  it("is the header's round button when asked to be", () => {
    renderWithProviders(<ThemeToggle mode="light" round />);
    fireEvent.click(screen.getByRole('button', { name: 'Theme: Light. Switch to dark.' }));
    expect(tracker.setPreferences).toHaveBeenCalledWith({ themeMode: 'dark' });
  });
});
