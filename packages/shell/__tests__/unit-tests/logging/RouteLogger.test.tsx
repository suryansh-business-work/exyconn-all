import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteLogger } from '@/logging/RouteLogger';
import { portalLogger } from '@/logging/portalLogger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the route logger', () => {
  it('tells the logger the page it opened on, and every page after it', async () => {
    const setRoute = vi.spyOn(portalLogger, 'setRoute').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/hr/leave']}>
        <RouteLogger />
        <Link to="/hr/payroll">Payroll</Link>
      </MemoryRouter>,
    );

    expect(setRoute).toHaveBeenLastCalledWith('/hr/leave');

    await user.click(getByRole('link', { name: 'Payroll' }));

    expect(setRoute).toHaveBeenLastCalledWith('/hr/payroll');
    expect(setRoute).toHaveBeenCalledTimes(2);
  });

  it('renders nothing of its own', () => {
    vi.spyOn(portalLogger, 'setRoute').mockImplementation(() => undefined);
    const { container } = render(
      <MemoryRouter>
        <RouteLogger />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
