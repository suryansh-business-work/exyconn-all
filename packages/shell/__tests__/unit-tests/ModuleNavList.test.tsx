import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MODULES } from '@/config/modules';
import { ModuleNavList } from '@/layout/PortalLayout/ModuleNavList';

const hr = MODULES.find((m) => m.key === 'hr')!;
const social = MODULES.find((m) => m.key === 'social')!;

function show(module = hr, pathname = '/hr', query = '') {
  return render(
    <ModuleNavList module={module} pathname={pathname} query={query} onSelect={vi.fn()} />,
  );
}

/** The heading button for one section. Matched exactly, so "Pay" is not "Payroll". */
const section = (label: string) => screen.getByRole('button', { name: label });

describe('the sidebar sections', () => {
  it('shows the section headings without their pages until one is opened', () => {
    show();

    expect(section('People')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Employee Records')).not.toBeInTheDocument();
  });

  it('leaves the ungrouped pages on show, under no heading', () => {
    show();

    expect(screen.getByText('Dashboard')).toBeVisible();
    expect(screen.getByText('Reports')).toBeVisible();
  });

  it('opens the section the current page lives in', () => {
    show(hr, '/hr/payroll');

    expect(section('Pay')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Payroll')).toBeVisible();
  });

  it('marks the current page for a screen reader, not just for the eye', () => {
    show(hr, '/hr/payroll');

    const current = screen.getByRole('button', { current: 'page' });
    expect(within(current).getByText('Payroll')).toBeInTheDocument();
  });

  it('opens a section when its heading is clicked', async () => {
    const user = userEvent.setup();
    show();

    await user.click(section('People'));

    expect(section('People')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Employee Records')).toBeVisible();
  });

  it('closes the active section when its heading is clicked', async () => {
    const user = userEvent.setup();
    show(hr, '/hr/payroll');

    await user.click(section('Pay'));

    expect(section('Pay')).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows every match while a search is running, whatever is collapsed', () => {
    show(hr, '/hr', 'payslip');

    // Nobody opened Pay, but a result you cannot see is not a result.
    expect(screen.getByText('Payslip Schedule')).toBeVisible();
  });

  it('says so when nothing matches', () => {
    show(hr, '/hr', 'zzzznope');

    expect(screen.getByText(/no page matches/i)).toBeInTheDocument();
  });

  it('leaves a small module as a plain list with no headings to open', () => {
    show(social, '/social');

    expect(screen.getByText('Feed')).toBeVisible();
    expect(screen.getByText('My Profile')).toBeVisible();
    expect(screen.queryAllByRole('button', { expanded: false })).toHaveLength(0);
  });
});
