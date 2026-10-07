import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test-utils';
import { OrganizationAdminForm } from '../../../../../../src/pages/organizations/forms/organization-admin';

const hooks = vi.hoisted(() => ({ assign: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAssignOrganizationAdminMutation: () => [hooks.assign],
}));

afterEach(() => vi.resetAllMocks());

function mount() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <OrganizationAdminForm
      organizationId="org-7"
      organizationName="Fjord AS"
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { user, onDone, onCancel };
}

describe('OrganizationAdminForm', () => {
  it('asks for a name and an email before appointing anyone', async () => {
    const { user } = mount();
    expect(screen.getByText('They are emailed a password to sign in with')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(hooks.assign).not.toHaveBeenCalled();
  });

  it('refuses an address that is not an email', async () => {
    const { user } = mount();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ola Nordmann');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ola@');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(hooks.assign).not.toHaveBeenCalled();
  });

  it('appoints the administrator of this company, trimmed, and hands control back', async () => {
    hooks.assign.mockResolvedValue({ data: undefined });
    const { user, onDone } = mount();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Ola Nordmann ');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ola@fjord.example');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Administrator for Fjord AS created')).toBeInTheDocument();
    expect(hooks.assign).toHaveBeenCalledWith({
      variables: {
        organizationId: 'org-7',
        input: { name: 'Ola Nordmann', email: 'ola@fjord.example' },
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says why the appointment was refused, and stays open', async () => {
    hooks.assign.mockRejectedValue(new Error('That account belongs to another company'));
    const { user, onDone } = mount();
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Ola Nordmann');
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ola@fjord.example');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('That account belongs to another company')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    const { user, onCancel } = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});
