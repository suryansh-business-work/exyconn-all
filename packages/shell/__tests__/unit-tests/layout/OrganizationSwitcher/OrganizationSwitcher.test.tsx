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
import { portalLogger } from '@/logging/portalLogger';
import { makeUser, renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';

interface FormStubProps {
  onDone: () => void;
  onCancel: () => void;
}

// The form has its own tests; here only its two ways out matter.
vi.mock('@/pages/organizations/forms/organization', () => ({
  OrganizationForm: ({ onDone, onCancel }: Readonly<FormStubProps>) => (
    <div>
      <button type="button" onClick={onDone}>
        Stub create
      </button>
      <button type="button" onClick={onCancel}>
        Stub cancel
      </button>
    </div>
  ),
}));

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
  { reloadFails = false } = {},
) {
  const list = answer(OrganizationsDocument, { organizations });
  const mine = answer(MyOrganizationDocument, { myOrganization: current });
  // The answer to the reload after a company is added.
  const reload = answer(OrganizationsDocument, { organizations });
  const mocks = [list.mock, mine.mock];
  mocks.push(reloadFails ? failure(OrganizationsDocument) : reload.mock);
  const view = renderWithProviders(<OrganizationSwitcher />, { mocks, user });
  return { ...view, list, mine, reload };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openAdd(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(await screen.findByRole('button', { name }));
  await user.click(screen.getByRole('menuitem', { name: /Add organization/ }));
  return screen.findByRole('heading', { name: 'Add organization', level: 2 });
}

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

  it('is offered with a single open company, as that is where the next one is added', async () => {
    const user = userEvent.setup();
    show([acme, gone], acme);

    await user.click(await screen.findByRole('button', { name: 'Organization: acme works' }));

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent('Add organization');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('offers only Add organization, without a divider, when no company is open', async () => {
    const user = userEvent.setup();
    const { list } = show([gone], null);
    await waitFor(() => expect(list.delivered()).toBe(true));

    await user.click(await screen.findByRole('button', { name: 'Organization: Organization' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('adds an organization in a drawer and reloads the companies once it exists', async () => {
    const user = userEvent.setup();
    const logged = vi.spyOn(portalLogger, 'error');
    const { reload } = show([acme, beta], acme);

    expect(await openAdd(user, 'Organization: acme works')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stub create' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add organization' })).toBeNull(),
    );
    await waitFor(() => expect(reload.delivered()).toBe(true));
    expect(logged).not.toHaveBeenCalled();
  });

  it('logs a reload that fails after an organization is added', async () => {
    const user = userEvent.setup();
    const logged = vi.spyOn(portalLogger, 'error').mockImplementation(() => undefined);
    show([acme, beta], acme, platformAdmin, { reloadFails: true });

    await openAdd(user, 'Organization: acme works');
    await user.click(screen.getByRole('button', { name: 'Stub create' }));

    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Reloading organizations failed', expect.any(Error)),
    );
  });

  it('closes the drawer from its close button and from the form’s cancel', async () => {
    const user = userEvent.setup();
    show([acme, beta], acme);

    await openAdd(user, 'Organization: acme works');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add organization' })).toBeNull(),
    );

    await openAdd(user, 'Organization: acme works');
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add organization' })).toBeNull(),
    );
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
    expect(items.map((item) => item.textContent)).toEqual([
      'acme worksacme',
      'BBeta Labsbeta',
      'Add organizationCreate a company and invite its people',
    ]);
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
