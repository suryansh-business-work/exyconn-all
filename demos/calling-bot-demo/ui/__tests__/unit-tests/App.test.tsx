import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
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

const seen = vi.hoisted(() => ({ props: null as PortalAppProps | null }));

/** The shell's PortalApp, reduced to its route table. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalAppProps>) => {
    seen.props = props;
    return (
      <MemoryRouter initialEntries={['/']}>
        <Routes>{props.publicRoutes}</Routes>
        {props.loginElement}
      </MemoryRouter>
    );
  },
}));
vi.mock('../../src/pages/CallPage', () => ({ CallPage: () => <p>Call page</p> }));
vi.mock('@exyconn/demo-visitor', () => ({
  DemoLoginPage: ({ title, homePath }: Readonly<{ title: string; homePath: string }>) => (
    <p>{`Login: ${title} -> ${homePath}`}</p>
  ),
  VisitorGate: ({ children }: Readonly<{ children: ReactNode }>) => (
    <section aria-label="Visitor gate">{children}</section>
  ),
}));

describe('App', () => {
  it('opens the call page at the root, behind the visitor gate, without portal chrome', () => {
    render(<App />);
    expect(screen.getByRole('region', { name: 'Visitor gate' })).toHaveTextContent('Call page');
    expect(screen.getByText('Login: Talk to our AI calling bot -> /')).toBeInTheDocument();
    expect(seen.props).toMatchObject({ moduleRole: ROLES.EMPLOYEE, homePath: '/', chrome: false });
    expect(seen.props?.children).toBeNull();
  });
});
