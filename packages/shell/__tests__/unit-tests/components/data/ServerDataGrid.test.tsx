import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MockedProvider } from '@apollo/client/testing/react';
import { I18nProvider } from '@exyconn/i18n';
import { ServerDataGrid } from '@/components/data/ServerDataGrid';
import { gridTranslator } from '@/components/data/gridContext';

/** What the grid was last rendered with. */
const rendered = vi.hoisted(() => ({ context: undefined as object | undefined }));

vi.mock('ag-grid-react', () => ({
  AgGridReact: ({ context }: Readonly<{ context?: object }>) => {
    rendered.context = context;
    return <div data-testid="ag-grid" />;
  },
}));

interface Lead {
  id: string;
  name: string;
}

function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <MockedProvider>
      <I18nProvider locale="en" messages={{ Lead: 'Cliente' }}>
        {children}
      </I18nProvider>
    </MockedProvider>
  );
}

/** How long the lazily loaded grid chunk may take to arrive. */
const CHUNK_TIMEOUT_MS = 15_000;

const columns = [{ field: 'name' as const, headerName: 'Name' }];

describe('ServerDataGrid', () => {
  // Must run first: once the lazy grid chunk has loaded, no later render suspends.
  it('holds each grid’s space with a busy skeleton until the grid code has loaded', async () => {
    const { container } = render(
      <Providers>
        <ServerDataGrid<Lead> columnDefs={columns} fetchRows={vi.fn()} height={320} />
        <ServerDataGrid<Lead> columnDefs={columns} fetchRows={vi.fn()} />
      </Providers>,
    );

    const placeholders = container.querySelectorAll('[aria-busy="true"]');
    expect(placeholders).toHaveLength(2);
    expect(placeholders[0]).toHaveStyle({ height: '320px' });
    expect(placeholders[1]).toHaveStyle({ height: '560px' });

    // The grid chunk pulls in all of ag-grid, which takes a while on a loaded machine.
    expect(await screen.findAllByTestId('ag-grid', {}, { timeout: CHUNK_TIMEOUT_MS })).toHaveLength(
      2,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });

  it('hands every cell the workspace date format and translator next to the page context', async () => {
    const actions = { open: vi.fn() };
    render(
      <Providers>
        <ServerDataGrid<Lead> columnDefs={columns} fetchRows={vi.fn()} context={{ actions }} />
      </Providers>,
    );
    await screen.findByTestId('ag-grid', {}, { timeout: CHUNK_TIMEOUT_MS });

    const context = rendered.context as {
      actions: object;
      formatDate: (value: string) => string;
    };
    expect(context.actions).toBe(actions);
    expect(context.formatDate('2026-10-07T00:00:00.000Z')).toContain('2026');
    expect(gridTranslator(context)('Lead')).toBe('Cliente');
  });
});
