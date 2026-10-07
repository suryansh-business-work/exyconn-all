import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { App } from '../../src/App';
import { DemoLoginPage } from '../../src/visitor/DemoLoginPage';

interface PortalAppProps {
  loginElement: ReactNode;
  moduleRole: string;
  homePath: string;
  chrome: boolean;
  publicRoutes: ReactNode;
  children: ReactNode;
}

const seen = vi.hoisted(() => ({ props: null as unknown, route: '/' }));

/** The shell's PortalApp, reduced to its route table: public routes and the signed-in ones. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalAppProps>) => {
    seen.props = props;
    return (
      <MemoryRouter initialEntries={[seen.route]}>
        <Routes>
          {props.publicRoutes}
          {props.children}
        </Routes>
      </MemoryRouter>
    );
  },
}));
vi.mock('../../src/pages/chats', () => ({ ChatsPage: () => <p>Chats page</p> }));
vi.mock('../../src/admin', () => ({ AdminPage: () => <p>Admin page</p> }));
vi.mock('../../src/visitor/DemoLoginPage', () => ({ DemoLoginPage: () => <p>Demo login</p> }));
vi.mock('../../src/visitor/VisitorGate', () => ({
  VisitorGate: ({ children }: Readonly<{ children: ReactNode }>) => (
    <section aria-label="visitor gate">{children}</section>
  ),
}));

afterEach(() => {
  seen.route = '/';
  seen.props = null;
});

describe('App', () => {
  it('hands the shell the demo sign-in, the employee role, the chats home and no chrome', () => {
    render(<App />);
    const props = seen.props as PortalAppProps;
    expect((props.loginElement as { type: unknown }).type).toBe(DemoLoginPage);
    expect(props.moduleRole).toBe(ROLES.EMPLOYEE);
    expect(props.homePath).toBe('/whatsapp-demo');
    expect(props.chrome).toBe(false);
  });

  it.each(['/whatsapp-demo', '/whatsapp-demo/clinic'])(
    'opens the chats behind the visitor gate at %s',
    async (route) => {
      seen.route = route;
      render(<App />);
      const gate = await screen.findByRole('region', { name: 'visitor gate' });
      expect(gate).toContainElement(screen.getByText('Chats page'));
    },
  );

  it('mounts the admin area under /admin', async () => {
    seen.route = '/admin/analytics';
    render(<App />);
    expect(await screen.findByText('Admin page')).toBeInTheDocument();
    expect(screen.queryByText('Chats page')).not.toBeInTheDocument();
  });
});
