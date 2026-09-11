import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MODULES, type ModuleDefinition } from '@/config/modules';
import { moduleNavTree, type NavNode } from '@/layout/PortalLayout/moduleNav';
import { useNavState } from '@/layout/PortalLayout/useNavState';
import { SidebarNav } from '@/layout/PortalLayout/SidebarNav';

const hr = MODULES.find((m) => m.key === 'hr')!;
const social = MODULES.find((m) => m.key === 'social')!;

const deep: ModuleDefinition = {
  ...hr,
  children: [
    {
      key: 'l2',
      label: 'Level two',
      path: '/hr/l2',
      icon: hr.icon,
      group: 'People',
      children: [
        {
          key: 'l3',
          label: 'Level three',
          path: '/hr/l2/l3',
          icon: hr.icon,
          children: [{ key: 'l4', label: 'Level four', path: '/hr/l2/l3/l4', icon: hr.icon }],
        },
      ],
    },
  ],
};

interface HarnessProps {
  tree: NavNode[];
  pathname: string;
  query: string;
  onSelect: (node: NavNode) => void;
}

function Harness({ tree, pathname, query, onSelect }: Readonly<HarnessProps>) {
  const nav = useNavState(tree, pathname, query);
  return <SidebarNav heading="HR" emptyText="No page matches." nav={nav} onSelect={onSelect} />;
}

function show(module = hr, pathname = '/hr', query = '', onSelect = vi.fn()) {
  return render(
    <Harness tree={moduleNavTree(module)} pathname={pathname} query={query} onSelect={onSelect} />,
  );
}

/** The button for one branch. Matched exactly, so "Pay" is not "Payroll". */
const branch = (label: string) => screen.getByRole('button', { name: label });

describe('the expanded sidebar', () => {
  it('shows the sections without their pages until one is opened', () => {
    show();

    expect(branch('People')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Employee Records')).not.toBeInTheDocument();
  });

  it('leaves the ungrouped pages on show', () => {
    show();

    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Reports')).toBeVisible();
  });

  it('opens the section the current page lives in and marks the page as current', () => {
    show(hr, '/hr/payroll');

    expect(branch('Pay')).toHaveAttribute('aria-expanded', 'true');
    const current = screen.getByRole('button', { current: 'page' });
    expect(within(current).getByText('Payroll')).toBeInTheDocument();
  });

  it('opens and closes a section when it is clicked', async () => {
    const user = userEvent.setup();
    show(hr, '/hr/payroll');

    await user.click(branch('People'));
    await user.click(branch('Pay'));

    expect(branch('People')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Employee Records')).toBeVisible();
    expect(branch('Pay')).toHaveAttribute('aria-expanded', 'false');
  });

  it('hands a clicked page to onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    show(hr, '/hr', '', onSelect);

    await user.click(screen.getByText('Reports'));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ path: '/hr/reports' }));
  });

  it('shows every match while a search is running, whatever is closed', () => {
    show(hr, '/hr', 'payslip');

    expect(screen.getByText('Payslip Schedule')).toBeVisible();
  });

  it('says so when nothing matches', () => {
    show(hr, '/hr', 'zzzznope');

    expect(screen.getByText('No page matches.')).toBeInTheDocument();
  });

  it('leaves a small module as a plain list with nothing to open', () => {
    show(social, '/social');

    expect(screen.getByText('Feed')).toBeVisible();
    expect(screen.queryAllByRole('button', { expanded: false })).toHaveLength(0);
  });

  it('opens all four levels down to the current page', () => {
    show(deep, '/hr/l2/l3/l4');

    expect(branch('People')).toHaveAttribute('aria-expanded', 'true');
    expect(branch('Level two')).toHaveAttribute('aria-expanded', 'true');
    expect(branch('Level three')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { current: 'page' })).toHaveTextContent('Level four');
  });

  it('reaches the fourth level by opening one branch at a time', async () => {
    const user = userEvent.setup();
    show(deep, '/hr');

    await user.click(branch('People'));
    await user.click(branch('Level two'));
    await user.click(branch('Level three'));

    expect(screen.getByText('Level four')).toBeVisible();
  });
});
