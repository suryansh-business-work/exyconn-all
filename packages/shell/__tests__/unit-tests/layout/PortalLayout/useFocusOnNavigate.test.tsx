import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useFocusOnNavigate } from '@/layout/PortalLayout/useFocusOnNavigate';

/** A region with a tab strip that stays mounted while the path changes beneath it. */
function Region() {
  const region = useRef<HTMLElement>(null);
  useFocusOnNavigate(region);
  return (
    <>
      <Link to="/hr/payroll">Sidebar payroll</Link>
      <main ref={region} tabIndex={-1}>
        <Link to="/hr/leave">Leave tab</Link>
        <Routes>
          <Route path="/hr/*" element={<p>page</p>} />
        </Routes>
      </main>
    </>
  );
}

/** A layout that has not mounted its region (signed out): nothing to focus. */
function NoRegion() {
  const region = useRef<HTMLElement>(null);
  useFocusOnNavigate(region);
  return <Link to="/hr/leave">Leave</Link>;
}

function show(ui: React.ReactElement) {
  render(<MemoryRouter initialEntries={['/hr']}>{ui}</MemoryRouter>);
}

describe('useFocusOnNavigate', () => {
  it('takes focus into the region when the path changes from outside it', async () => {
    const user = userEvent.setup();
    show(<Region />);

    await user.click(screen.getByRole('link', { name: 'Sidebar payroll' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('leaves focus on the tab just chosen inside the region', async () => {
    const user = userEvent.setup();
    show(<Region />);
    const tab = screen.getByRole('link', { name: 'Leave tab' });

    await user.click(tab);

    expect(tab).toHaveFocus();
  });

  it('does nothing without a region to focus', async () => {
    const user = userEvent.setup();
    show(<NoRegion />);
    const link = screen.getByRole('link', { name: 'Leave' });

    await user.click(link);

    expect(link).toHaveFocus();
  });
});
