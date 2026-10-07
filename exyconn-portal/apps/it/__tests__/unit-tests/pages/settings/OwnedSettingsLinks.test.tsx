import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { appUrl } from '@exyconn/shell/config/apps';
import { OwnedSettingsLinks } from '../../../../src/pages/settings/OwnedSettingsLinks';
import { renderWithProviders } from '../../test-utils';

/** Paths the portal registry is made to forget, to see what a link does without an owner app. */
const unclaimed = vi.hoisted(() => new Set<string>());

vi.mock('@exyconn/shell/config/modules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/config/modules')>();
  return {
    ...actual,
    appForPath: (path: string) => (unclaimed.has(path) ? undefined : actual.appForPath(path)),
  };
});

const OWNED = [
  { label: 'Departments', owner: 'HR', path: '/hr/departments', app: 'hr' },
  {
    label: 'Roles & approval permissions',
    owner: 'Admin',
    path: '/admin/permissions',
    app: 'admin',
  },
  { label: 'Ticket SLA policies', owner: 'Support', path: '/support/sla', app: 'support' },
  { label: 'Vendors', owner: 'Products', path: '/products/suppliers', app: 'products' },
] as const;

describe('OwnedSettingsLinks', () => {
  beforeEach(() => {
    unclaimed.clear();
  });

  it('names each setting IT relies on and the team that manages it', () => {
    renderWithProviders(<OwnedSettingsLinks />);

    for (const link of OWNED) {
      expect(screen.getByText(link.label)).toBeInTheDocument();
      expect(screen.getByText(`Managed by ${link.owner}`)).toBeInTheDocument();
    }
  });

  it('opens each setting in the portal that serves it', () => {
    renderWithProviders(<OwnedSettingsLinks />);

    const hrefs = screen
      .getAllByRole('link', { name: 'Open' })
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(OWNED.map((link) => appUrl(link.app, link.path)));
  });

  it('falls back to the bare path when no portal claims it', () => {
    unclaimed.add('/products/suppliers');
    renderWithProviders(<OwnedSettingsLinks />);

    const links = screen.getAllByRole('link', { name: 'Open' });
    expect(links[3]).toHaveAttribute('href', '/products/suppliers');
    expect(links[0]).toHaveAttribute('href', appUrl('hr', '/hr/departments'));
  });
});
