import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Branding } from '@exyconn/tracker-core';
import { BrandProvider, useBrand } from '../../../src/theme/BrandProvider';
import { useColorScheme } from '../mocks/react-native';
import { renderHookWithProviders } from '../test-utils';

const DARK_BRAND = { primaryColor: '#4f46e5', backgroundColor: '#0b1026' } as Branding;
const LIGHT_BRAND = { primaryColor: '#4f46e5', backgroundColor: '#fafafa' } as Branding;

describe('BrandProvider', () => {
  it('paints its children', () => {
    render(
      <BrandProvider branding={null} themeMode="light" groundOpacity={1}>
        <span>Dashboard</span>
      </BrandProvider>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('hands the brand, its scheme and the ground opacity to every screen', () => {
    const { result } = renderHookWithProviders(() => useBrand(), {
      branding: LIGHT_BRAND,
      themeMode: 'system',
      groundOpacity: 0.6,
    });
    expect(result.current).toMatchObject({
      scheme: 'light',
      branding: LIGHT_BRAND,
      groundOpacity: 0.6,
      background: '#fafafa',
    });
    expect(result.current.primary).toMatch(/^#[\da-f]{6}$/);
  });

  it('turns dark on system for a dark brand, or when the phone prefers dark', () => {
    const dark = renderHookWithProviders(() => useBrand(), {
      branding: DARK_BRAND,
      themeMode: 'system',
    });
    expect(dark.result.current.scheme).toBe('dark');
    vi.mocked(useColorScheme).mockReturnValue('dark');
    const osDark = renderHookWithProviders(() => useBrand(), {
      branding: LIGHT_BRAND,
      themeMode: 'system',
    });
    expect(osDark.result.current.scheme).toBe('dark');
  });

  it('lets the employee’s explicit choice overrule a dark brand', () => {
    const { result } = renderHookWithProviders(() => useBrand(), {
      branding: DARK_BRAND,
      themeMode: 'light',
    });
    expect(result.current.scheme).toBe('light');
  });
});

describe('useBrand', () => {
  it('refuses to run outside the provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useBrand())).toThrow(
      'useBrand must be used inside BrandProvider.',
    );
    error.mockRestore();
  });
});
