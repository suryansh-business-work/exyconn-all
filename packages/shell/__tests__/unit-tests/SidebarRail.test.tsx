import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import { MODULES } from '@/config/modules';
import { moduleNavTree, navTrail } from '@/layout/PortalLayout/moduleNav';
import { SidebarRail } from '@/layout/PortalLayout/SidebarRail';
import { Sidebar } from '@/layout/PortalLayout/Sidebar';

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return { env: { ...actual.env, portalApp: 'hr' } };
});
vi.mock('@/layout/PortalSwitcher', () => ({ PortalSwitcher: () => null }));

const hr = MODULES.find((m) => m.key === 'hr')!;
const tree = moduleNavTree(hr);

function showRail(pathname = '/hr', onSelect = vi.fn()) {
  render(
    <SidebarRail nodes={tree} trail={new Set(navTrail(tree, pathname))} onSelect={onSelect} />,
  );
  return onSelect;
}

describe('the collapsed rail', () => {
  it('shows the top level only, never the pages inside a section', () => {
    showRail();

    expect(screen.getAllByRole('button')).toHaveLength(tree.length);
    expect(screen.getByRole('button', { name: 'People' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Employee Records' })).not.toBeInTheDocument();
  });

  it('names each icon in a tooltip', async () => {
    const user = userEvent.setup();
    showRail();

    await user.hover(screen.getByRole('button', { name: 'Pay' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Pay');
  });

  it('highlights the section the current page lives in', () => {
    showRail('/hr/payroll');

    expect(screen.getByRole('button', { name: 'Pay' })).toHaveClass('Mui-selected');
    expect(screen.getByRole('button', { name: 'People' })).not.toHaveClass('Mui-selected');
  });

  it('hands the clicked entry to onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = showRail();

    await user.click(screen.getByRole('button', { name: 'People' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: 'hr:People' }));
  });
});

function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <Sidebar
      roles={[ROLES.ADMIN]}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed((value) => !value)}
    />
  );
}

describe('a rail entry with pages beneath it', () => {
  it('opens the sidebar at that section', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/hr']}>
        <CollapsibleSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'People' }));

    expect(screen.getByRole('button', { name: 'People' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Employee Records')).toBeVisible();
  });
});
