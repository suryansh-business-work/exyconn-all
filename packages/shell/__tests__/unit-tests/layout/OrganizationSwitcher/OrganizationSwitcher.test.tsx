import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/auth/roles';
import {
  MyOrganizationDocument,
  OrganizationStatus,
  OrganizationsDocument,
} from '@/graphql/generated';
import { OrganizationSwitcher } from '@/layout/OrganizationSwitcher';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';

function organization(slug: string, name: string, patch: Record<string, unknown> = {}) {
  return {
    __typename: 'Organization',
    id: `org-${slug}`,
    name,
    slug,
    legalName: name,
    status: OrganizationStatus.Active,
    country: 'IN',
    currency: 'INR',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    fiscalYearStartMonth: 4,
    taxSystem: 'IN',
    contactEmail: `ops@${slug}.example.com`,
    logoUrl: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}

const acme = organization('acme', 'acme works', { logoUrl: 'https://cdn.example.com/acme.png' });
const beta = organization('beta', 'Beta Labs');
const gone = organization('gone', 'Gone Ltd', { status: OrganizationStatus.Suspended });

const platformAdmin = makeUser({ roles: [ROLES.SUPER_ADMIN] });

function show(
  organizations: unknown[],
  current: unknown,
  user: ReturnType<typeof makeUser> | null = platformAdmin,
) {
  const list = answer(OrganizationsDocument, { organizations });
  const mine = answer(MyOrganizationDocument, { myOrganization: current });
  const view = renderWithProviders(<OrganizationSwitcher />, {
    mocks: [list.mock, mine.mock],
    user,
  });
  return { ...view, list, mine };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the organization switcher', () => {
  it('is not offered to anybody but a platform administrator', async () => {
    const { container, list } = show([acme, beta], acme, makeUser({ roles: [ROLES.ADMIN] }));

    await act(async () => {});
    expect(list.delivered()).toBe(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('is not offered to somebody signed out', async () => {
    const { container, list } = show([acme, beta], acme, null);

    await act(async () => {});
    expect(list.delivered()).toBe(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('stays out of the way while there is only one open company', async () => {
    const { container, list } = show([acme, gone], acme);

    await waitFor(() => expect(list.delivered()).toBe(true));
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it('names the company in use, with its logo', async () => {
    show([acme, beta, gone], acme);

    const button = await screen.findByRole('button', { name: 'Organization: acme works' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/acme.png');
  });

  it('lists only the open companies, marking the current one', async () => {
    const user = userEvent.setup();
    show([acme, beta, gone], acme);

    await user.click(await screen.findByRole('button', { name: 'Organization: acme works' }));

    const items = screen.getAllByRole('menuitem');
    // A company with a logo shows it; one without shows its initial instead.
    expect(items.map((item) => item.textContent)).toEqual(['acme worksacme', 'BBeta Labsbeta']);
    expect(items[0]).toHaveClass('Mui-selected');
    expect(items[1]).not.toHaveClass('Mui-selected');
  });

  it('loads the same page under the chosen company', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    show([acme, beta], acme);

    await user.click(await screen.findByRole('button', { name: 'Organization: acme works' }));
    await user.click(screen.getByRole('menuitem', { name: /Beta Labs/ }));

    expect(assign).toHaveBeenCalledWith('/organization/beta/');
  });

  it('only closes the menu when the current company is chosen again', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    show([acme, beta], acme);

    await user.click(await screen.findByRole('button', { name: 'Organization: acme works' }));
    await user.click(screen.getByRole('menuitem', { name: /acme works/ }));

    expect(assign).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    show([acme, beta], acme);
    await user.click(await screen.findByRole('button', { name: 'Organization: acme works' }));

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('falls back to a generic name, and every choice moves, before its own company loads', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...globalThis.location, assign });
    const user = userEvent.setup();
    show([acme, beta], null);

    const button = await screen.findByRole('button', { name: 'Organization: Organization' });
    expect(button.querySelector('img')).toBeNull();

    await user.click(button);
    await user.click(screen.getByRole('menuitem', { name: /acme works/ }));

    expect(assign).toHaveBeenCalledWith('/organization/acme/');
  });
});
