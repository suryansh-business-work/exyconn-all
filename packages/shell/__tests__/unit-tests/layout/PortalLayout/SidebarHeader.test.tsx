import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarHeader } from '@/layout/PortalLayout/SidebarHeader';
import { renderWithProviders } from '../../test-utils';

vi.mock('@/hooks/useBrandMark', () => ({
  useBrandMark: () => '/brand-mark.svg',
  useBrandLogo: () => '/brand-logo.svg',
}));

interface HarnessProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onOpenSwitcher?: () => void;
}

/** The header with a live search box, as the sidebar owns its query. */
function Harness({
  collapsed,
  onToggleCollapse,
  onOpenSwitcher = vi.fn(),
}: Readonly<HarnessProps>) {
  const [query, setQuery] = useState('');
  return (
    <>
      <SidebarHeader
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onOpenSwitcher={onOpenSwitcher}
        searchPlaceholder="Search pages…"
        query={query}
        onQueryChange={setQuery}
      />
      <output aria-label="query">{query}</output>
    </>
  );
}

const search = () => screen.getByRole('searchbox', { name: 'Search pages…' });
const query = () => screen.getByRole('status', { name: 'query' });

describe('the sidebar header, open', () => {
  it('carries the full wordmark and a collapse control', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();
    renderWithProviders(<Harness collapsed={false} onToggleCollapse={onToggleCollapse} />);

    expect(screen.getByRole('img', { name: 'Exyconn' })).toHaveAttribute('src', '/brand-logo.svg');
    expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('offers no collapse control on the phone drawer', () => {
    renderWithProviders(<Harness collapsed={false} />);

    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeInTheDocument();
  });

  it('opens the portal switcher from its labelled row', async () => {
    const user = userEvent.setup();
    const onOpenSwitcher = vi.fn();
    renderWithProviders(<Harness collapsed={false} onOpenSwitcher={onOpenSwitcher} />);

    await user.click(screen.getByRole('button', { name: 'Other Portals' }));

    expect(onOpenSwitcher).toHaveBeenCalledTimes(1);
  });

  it('clears the search from its button, which only shows once something is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness collapsed={false} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    await user.type(search(), 'pay');
    expect(query()).toHaveTextContent('pay');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(query()).toBeEmptyDOMElement();
  });

  it('clears the search on Escape, and leaves it on any other key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness collapsed={false} />);

    await user.type(search(), 'pay');
    await user.keyboard('{ArrowLeft}');
    expect(query()).toHaveTextContent('pay');

    await user.keyboard('{Escape}');
    expect(query()).toBeEmptyDOMElement();
  });
});

describe('the sidebar header, collapsed to a rail', () => {
  it('carries the square mark and an expand control, and no search', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();
    renderWithProviders(<Harness collapsed onToggleCollapse={onToggleCollapse} />);

    expect(screen.getByRole('img', { name: 'Exyconn' })).toHaveAttribute('src', '/brand-mark.svg');
    expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('names the switcher icon in a tooltip', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness collapsed onToggleCollapse={vi.fn()} />);
    const switcher = screen.getByRole('button', { name: 'Other Portals' });
    expect(switcher).not.toHaveTextContent('Other Portals');

    await user.hover(switcher);

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Other Portals');
  });
});
