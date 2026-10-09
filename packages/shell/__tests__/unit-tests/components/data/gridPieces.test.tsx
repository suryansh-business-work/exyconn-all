import { describe, expect, it } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { ThemeProvider, createTheme } from '@exyconn/ui/styles';
import { skeletonWhileLoading } from '@/components/data/GridSkeletonCell';
import { useGridTheme } from '@/components/data/useGridTheme';

/** ag-grid's resolved theme parameters, as the grid itself reads them. */
interface ModeParamsReader {
  _getModeParams(): { $default: Record<string, unknown> };
}

function params(data: unknown): ICellRendererParams<unknown> {
  return { data } as ICellRendererParams<unknown>;
}

describe('skeletonWhileLoading', () => {
  it('draws a skeleton for a row whose block has not arrived', () => {
    const selected = skeletonWhileLoading(params(undefined));
    expect(selected).toBeDefined();

    const Cell = selected?.component as () => ReactNode;
    render(<Cell />);
    expect(screen.getByTestId('grid-skeleton-cell')).toBeInTheDocument();
  });

  it('falls through to the column renderer once the row is loaded', () => {
    expect(skeletonWhileLoading(params({ id: 'r1' }))).toBeUndefined();
  });
});

function themeFor(mode: 'light' | 'dark') {
  const theme = createTheme({ palette: { mode } });
  const { result } = renderHook(() => useGridTheme(), {
    wrapper: ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>,
  });
  return { grid: result.current, theme };
}

describe('useGridTheme', () => {
  it('paints the Quartz grid from the active MUI palette', () => {
    const { grid, theme } = themeFor('dark');
    const resolved = (grid as unknown as ModeParamsReader)._getModeParams().$default;

    expect(resolved.accentColor).toBe(theme.palette.primary.main);
    expect(resolved.backgroundColor).toBe(theme.palette.background.paper);
    expect(resolved.browserColorScheme).toBe('dark');
  });

  it('builds a different theme for light and dark', () => {
    expect(themeFor('light').grid).not.toBe(themeFor('dark').grid);
  });
});
