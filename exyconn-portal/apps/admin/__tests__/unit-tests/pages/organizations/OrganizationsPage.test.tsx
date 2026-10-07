import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationStatus } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { OrganizationsPage } from '../../../../src/pages/organizations';
import { organization } from './organizations.fixtures';

const hooks = vi.hoisted(() => ({
  list: { data: undefined as unknown, loading: false },
  refetch: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useOrganizationsQuery: () => ({ ...hooks.list, refetch: hooks.refetch }),
  useSetOrganizationStatusMutation: () => [hooks.setStatus],
}));

const ACME = organization();
const BETA = organization({
  id: 'org-2',
  name: 'beta labs',
  slug: 'beta',
  status: OrganizationStatus.Suspended,
  logoUrl: '',
});
const EMPTY = 'No companies yet. Create the first one to hand it over to its administrator.';

beforeEach(() => {
  hooks.list = { data: { organizations: [ACME, BETA] }, loading: false };
  hooks.refetch.mockResolvedValue({});
  hooks.setStatus.mockResolvedValue({});
});
afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

function mount() {
  const user = userEvent.setup();
  renderWithProviders(<OrganizationsPage />);
  return user;
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;
const drawerHeading = (name: string) => screen.findByRole('heading', { name, level: 2 });

describe('OrganizationsPage', () => {
  it('holds the table while the companies load', () => {
    hooks.list = { data: undefined, loading: true };
    mount();
    expect(screen.getByRole('heading', { name: 'Organizations' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
    expect(screen.queryByText(EMPTY)).toBeNull();
  });

  it('says how to start when there is no company yet', () => {
    hooks.list = { data: undefined, loading: false };
    mount();
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
  });

  it('lists each company with its logo or initial, its standards and whether it may sign in', () => {
    mount();
    const acme = rowOf('Acme');
    expect(within(acme).getByRole('img', { name: 'Acme' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/acme.png',
    );
    expect(within(acme).getByText('acme')).toBeInTheDocument();
    expect(within(acme).getByText('NOK')).toBeInTheDocument();
    expect(within(acme).getByText('Europe/Oslo')).toBeInTheDocument();
    expect(within(acme).getByText('Active')).toBeInTheDocument();
    expect(within(acme).getByRole('button', { name: 'Suspend this company' })).toBeInTheDocument();
    expect(within(acme).queryByRole('button', { name: 'Let this company back in' })).toBeNull();

    const beta = rowOf('beta labs');
    expect(within(beta).getByText('B')).toBeInTheDocument();
    expect(within(beta).getByText('Suspended')).toBeInTheDocument();
    expect(
      within(beta).getByRole('button', { name: 'Let this company back in' }),
    ).toBeInTheDocument();
    expect(within(beta).queryByRole('button', { name: 'Suspend this company' })).toBeNull();
  });

  it('suspends an active company and reloads the list', async () => {
    const user = mount();
    await user.click(within(rowOf('Acme')).getByRole('button', { name: 'Suspend this company' }));
    await waitFor(() => expect(hooks.refetch).toHaveBeenCalledTimes(1));
    expect(hooks.setStatus).toHaveBeenCalledWith({
      variables: { id: 'org-1', status: OrganizationStatus.Suspended },
    });
  });

  it('lets a suspended company back in', async () => {
    const user = mount();
    await user.click(
      within(rowOf('beta labs')).getByRole('button', { name: 'Let this company back in' }),
    );
    await waitFor(() =>
      expect(hooks.setStatus).toHaveBeenCalledWith({
        variables: { id: 'org-2', status: OrganizationStatus.Active },
      }),
    );
  });

  it('logs a status change that fails, without reloading', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('Not a platform administrator');
    hooks.setStatus.mockRejectedValue(failure);
    const user = mount();
    await user.click(within(rowOf('Acme')).getByRole('button', { name: 'Suspend this company' }));
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Could not change the status', failure),
    );
    expect(hooks.refetch).not.toHaveBeenCalled();
  });

  it('opens a blank form for a new company and reloads when it closes', async () => {
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'New organization' }));
    expect(await drawerHeading('New organization')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Company name' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Handle' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2 })).toBeNull());
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens the chosen company for editing, and logs a reload that fails on close', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('offline');
    hooks.refetch.mockRejectedValue(failure);
    const user = mount();
    await user.click(within(rowOf('Acme')).getByRole('button', { name: 'edit' }));
    expect(await drawerHeading('Edit Acme')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Company name' })).toHaveValue('Acme');
    expect(screen.getByRole('textbox', { name: 'Handle' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith('Could not reload organizations', failure),
    );
  });

  it('starts a new company blank again after editing another', async () => {
    const user = mount();
    await user.click(within(rowOf('Acme')).getByRole('button', { name: 'edit' }));
    await drawerHeading('Edit Acme');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2 })).toBeNull());

    await user.click(screen.getByRole('button', { name: 'New organization' }));
    expect(await drawerHeading('New organization')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Company name' })).toHaveValue('');
  });

  it('appoints an administrator for the chosen company', async () => {
    const user = mount();
    await user.click(within(rowOf('Acme')).getByRole('button', { name: 'Appoint administrator' }));
    expect(await drawerHeading('Administrator for Acme')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2 })).toBeNull());
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });
});
