import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ROLES } from '@exyconn/shell/auth/roles';
import { Login } from '@exyconn/login';
import { App } from '../../src/App';
import {
  TrackerPage,
  TrackerAccessPage,
  TrackerDevicesPage,
  TrackerBillingPage,
  TrackerApprovalsPage,
  TrackerMessagesPage,
  TrackerSettingsPage,
} from '../../src/pages/tracker';
import { TrackerDownloadPage } from '../../src/pages/download';
import { TrackerOverviewPage } from '../../src/pages/overview';

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
  it('mounts the shell for the Tracker module, homed at /tracker, signing in with Login', () => {
    render(<App />);

    expect(portal.props?.moduleRole).toBe(ROLES.TRACKER);
    expect(portal.props?.homePath).toBe('/tracker');
    expect(portal.props?.loginElement.type).toBe(Login);
  });

  it('puts each Tracker page on its own route, once', () => {
    render(<App />);

    expect(routes().map((route) => [route.path, route.element.type])).toEqual([
      ['/tracker', TrackerOverviewPage],
      ['/tracker/activity', TrackerPage],
      ['/tracker/access', TrackerAccessPage],
      ['/tracker/devices', TrackerDevicesPage],
      ['/tracker/billing/:tab?', TrackerBillingPage],
      ['/tracker/approvals', TrackerApprovalsPage],
      ['/tracker/messages/:tab?', TrackerMessagesPage],
      ['/tracker/settings', TrackerSettingsPage],
      ['/tracker/download', TrackerDownloadPage],
    ]);
  });
});
