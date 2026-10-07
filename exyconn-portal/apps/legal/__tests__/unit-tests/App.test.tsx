import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import {
  ContractsPage,
  DocumentsPage,
  LegalDashboardPage,
  SignBoardPage,
} from '../../src/pages/legal';
import { PoliciesPage } from '../../src/pages/policies';

interface PortalProps {
  loginElement: ReactElement;
  moduleRole: string;
  homePath: string;
  children: ReactNode;
}

const portal = vi.hoisted(() => ({ props: null as null | PortalProps }));

/** The real PortalApp builds an Apollo client and an AuthProvider; the stand-in records its props. */
vi.mock('@exyconn/shell', () => ({
  PortalApp: (props: Readonly<PortalProps>) => {
    portal.props = props;
    return null;
  },
}));

// The rich-text editor and its export are TipTap/pdfmake, tested in @exyconn/rich-text; the
// route table only needs the pages to load.
vi.mock('@exyconn/shell/components/form/rhf/RhfRichText', () => ({ RhfRichText: () => null }));
vi.mock('@exyconn/shell/components/form/RichTextDownload', () => ({
  RichTextDownload: () => null,
}));
vi.mock('@exyconn/shell/hooks/useRichTextExport', () => ({ useRichTextExport: () => vi.fn() }));

interface RouteProps {
  path: string;
  element: ReactElement;
}

function routes(): RouteProps[] {
  return Children.toArray(portal.props?.children)
    .filter(isValidElement)
    .map((child) => child.props as RouteProps);
}

describe('App', () => {
  it('mounts the shell for the LEGAL module, homed at /legal, signing in with Login', () => {
    render(<App />);
    expect(portal.props?.moduleRole).toBe(ROLES.LEGAL);
    expect(portal.props?.homePath).toBe('/legal');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts each Legal page on its own route', () => {
    render(<App />);
    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/legal', LegalDashboardPage],
      ['/legal/policies', PoliciesPage],
      ['/legal/documents', DocumentsPage],
      ['/legal/contracts', ContractsPage],
      ['/legal/sign', SignBoardPage],
    ]);
  });
});
