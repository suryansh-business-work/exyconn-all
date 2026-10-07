import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import {
  MyPendingApprovalCountDocument,
  MyUnreadNotificationCountDocument,
} from '@/graphql/generated';
import { PortalLayout } from '@/layout/PortalLayout';
import { portalLogger } from '@/logging/portalLogger';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/env')>();
  return { env: { ...actual.env, portalApp: 'hr' } };
});
vi.mock('@/hooks/useBrandMark', () => ({
  useBrandMark: () => '/brand-mark.svg',
  useBrandLogo: () => '/brand-logo.svg',
}));

const BELLS = [
  answer(MyPendingApprovalCountDocument, { myPendingApprovalCount: 0 }, undefined, 5).mock,
  answer(MyUnreadNotificationCountDocument, { myUnreadNotificationCount: 0 }, undefined, 5).mock,
];

function Broken(): never {
  throw new Error('Reports exploded');
}

function showLayout(
  route = '/hr',
  user: ReturnType<typeof makeUser> | null = makeUser({ roles: [ROLES.ADMIN] }),
) {
  return renderWithProviders(
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/hr" element={<h1>HR dashboard</h1>} />
        <Route path="/hr/leave" element={<h1>Leave</h1>} />
        <Route path="/hr/reports" element={<Broken />} />
      </Route>
    </Routes>,
    { route, user, mocks: BELLS },
  );
}

const main = () => screen.getByRole('main');
/** The temporary (phone) drawer's modal; MUI marks it hidden while it is closed. */
const phoneDrawer = () => document.querySelector('.MuiDrawer-modal');

beforeEach(() => {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.href = '/default-icon.svg';
  document.head.append(icon);
});

afterEach(() => {
  document.head.querySelector('link[rel="icon"]')?.remove();
  vi.restoreAllMocks();
});

describe('the portal layout', () => {
  it('draws nothing for somebody signed out', () => {
    const { container } = showLayout('/hr', null);

    expect(container).toBeEmptyDOMElement();
  });

  it('frames the page with a skip link, the navigation and the main region', () => {
    showLayout();

    expect(screen.getByRole('heading', { name: 'HR dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('navigation', { name: 'Portal pages' })).toBeInTheDocument();
    expect(main()).toHaveAttribute('id', 'main-content');
    expect(main()).toHaveAttribute('tabindex', '-1');
  });

  it('points the browser tab at the brand mark', () => {
    showLayout();

    expect(document.head.querySelector('link[rel="icon"]')).toHaveAttribute(
      'href',
      '/brand-mark.svg',
    );
  });

  it('leaves focus alone on the page it opened on', () => {
    showLayout();

    expect(main()).not.toHaveFocus();
  });

  it('moves focus to the main region after navigating from the sidebar', async () => {
    const user = userEvent.setup();
    showLayout('/hr/leave');

    // The closed phone drawer is hidden from the accessibility tree; this is the desktop one.
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));

    expect(await screen.findByRole('heading', { name: 'HR dashboard' })).toBeInTheDocument();
    expect(main()).toHaveFocus();
  });

  it('opens the phone drawer from the menu button, and closes it after a page is chosen', async () => {
    const user = userEvent.setup();
    showLayout('/hr/leave');
    expect(phoneDrawer()).toHaveClass('MuiModal-hidden');

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(phoneDrawer()).not.toHaveClass('MuiModal-hidden');

    // With the phone drawer open, the desktop sidebar behind it is hidden.
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));

    expect(await screen.findByRole('heading', { name: 'HR dashboard' })).toBeInTheDocument();
    await waitFor(() => expect(phoneDrawer()).toHaveClass('MuiModal-hidden'));
  });

  it('closes the phone drawer on Escape', async () => {
    const user = userEvent.setup();
    showLayout();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    await user.keyboard('{Escape}');

    await waitFor(() => expect(phoneDrawer()).toHaveClass('MuiModal-hidden'));
  });

  it('collapses the desktop sidebar to a rail whose pages still navigate', async () => {
    const user = userEvent.setup();
    showLayout('/hr/leave');

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    expect(localStorage.getItem('exyconn-track.sidebar-collapsed')).toBe('1');

    await user.click(screen.getByRole('button', { name: 'Dashboard' }));

    expect(await screen.findByRole('heading', { name: 'HR dashboard' })).toBeInTheDocument();
  });

  it('contains a crashed page and keeps the navigation working', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(portalLogger, 'capture').mockImplementation(() => undefined);
    const user = userEvent.setup();
    showLayout('/hr/reports');

    expect(screen.getByRole('alert')).toHaveTextContent('Reports exploded');

    // The closed phone drawer is hidden from the accessibility tree; this is the desktop one.
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));

    expect(await screen.findByRole('heading', { name: 'HR dashboard' })).toBeInTheDocument();
    expect(screen.queryByText('This page hit a problem')).not.toBeInTheDocument();
  });
});
