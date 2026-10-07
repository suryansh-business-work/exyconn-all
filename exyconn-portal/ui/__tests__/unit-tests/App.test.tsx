import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { App } from '../../src/App';

const shellProps = vi.hoisted(() => ({ route: '/', homePath: '' }));

interface StubProps {
  loginElement: ReactNode;
  homePath?: string;
  children: ReactNode;
}

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

// PortalApp owns the BrowserRouter, Apollo and auth; the hub only contributes its routes, so a
// memory router stands in for it and serves the shell's own /login, /profile and /settings.
vi.mock('@exyconn/shell', () => ({
  PortalApp: ({ loginElement, homePath, children }: Readonly<StubProps>) => {
    shellProps.homePath = homePath ?? '';
    return (
      <MemoryRouter initialEntries={[shellProps.route]}>
        <LocationProbe />
        <Routes>
          <Route path="/login" element={loginElement} />
          <Route path="/profile" element={<p>shell profile</p>} />
          <Route path="/settings" element={<p>shell settings</p>} />
          {children}
        </Routes>
      </MemoryRouter>
    );
  },
}));
vi.mock('@exyconn/login', () => ({ Login: () => <p>login screen</p> }));
vi.mock('../../src/pages/Portal/Portal', () => ({ Portal: () => <p>module launcher</p> }));
vi.mock('../../src/routes/LegacyModuleRedirect', () => ({
  LegacyModuleRedirect: () => <p>legacy redirect</p>,
}));

function renderAt(route: string) {
  shellProps.route = route;
  render(<App />);
}

describe('App', () => {
  it('serves the launcher at the root and hands the shell its home path', () => {
    renderAt('/');
    expect(screen.getByText('module launcher')).toBeInTheDocument();
    expect(shellProps.homePath).toBe('/');
  });

  it('keeps serving the launcher at the old /portal address', () => {
    renderAt('/portal');
    expect(screen.getByText('module launcher')).toBeInTheDocument();
  });

  it('passes the shared Login screen to the shell', () => {
    renderAt('/login');
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it.each([
    ['/portal/profile', '/profile', 'shell profile'],
    ['/portal/settings', '/settings', 'shell settings'],
  ])('redirects %s to the shell page at %s', (route, target, page) => {
    renderAt(route);
    expect(screen.getByTestId('location')).toHaveTextContent(target);
    expect(screen.getByText(page)).toBeInTheDocument();
  });

  it('sends every other /portal path to the legacy redirect', () => {
    renderAt('/portal/hr/leave');
    expect(screen.getByText('legacy redirect')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/portal/hr/leave');
  });
});
