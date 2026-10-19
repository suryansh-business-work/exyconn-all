import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, useParams } from 'react-router-dom';
import { ROLES } from '@exyconn/shell/auth/roles';
import { App } from '../../src/App';

interface PortalAppProps {
  loginElement: ReactNode;
  moduleRole: string;
  homePath: string;
  chrome: boolean;
  publicRoutes: ReactNode;
  children: ReactNode;
}

const seen = vi.hoisted(() => ({ props: null as PortalAppProps | null, route: '/' }));

vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalAppProps>) => {
    seen.props = props;
    return (
      <MemoryRouter initialEntries={[seen.route]}>
        <Routes>{props.publicRoutes}</Routes>
        {props.loginElement}
      </MemoryRouter>
    );
  },
}));
vi.mock('../../src/pages/website-chat', () => ({
  WebsiteChatPage: function WebsiteChatPage() {
    const { demoKey } = useParams();
    return <p>{`Website chat: ${demoKey ?? 'first site'}`}</p>;
  },
}));
vi.mock('@exyconn/demo-visitor', () => ({
  DemoLoginPage: ({ title, homePath }: Readonly<{ title: string; homePath: string }>) => (
    <p>{`Login: ${title} -> ${homePath}`}</p>
  ),
  VisitorGate: ({ children }: Readonly<{ children: ReactNode }>) => (
    <section aria-label="Visitor gate">{children}</section>
  ),
}));

describe('App', () => {
  it('opens the first demo site at the root, behind the visitor gate, without chrome', () => {
    seen.route = '/';
    render(<App />);
    expect(screen.getByRole('region', { name: 'Visitor gate' })).toHaveTextContent(
      'Website chat: first site',
    );
    expect(screen.getByText('Login: Try the AI website chat agent -> /')).toBeInTheDocument();
    expect(seen.props).toMatchObject({ moduleRole: ROLES.EMPLOYEE, homePath: '/', chrome: false });
    expect(seen.props?.children).toBeNull();
  });

  it('opens one site from its key in the address', () => {
    seen.route = '/store';
    render(<App />);
    expect(screen.getByText('Website chat: store')).toBeInTheDocument();
  });
});
