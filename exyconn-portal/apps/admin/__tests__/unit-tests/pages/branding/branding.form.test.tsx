import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { BrandingForm, toBrandingValues } from '../../../../src/pages/branding/forms/branding';
import { branding } from './branding.fixtures';

const mutation = vi.hoisted(() => ({ update: vi.fn<(options: unknown) => Promise<unknown>>() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return { ...actual, useUpdateBrandingMutation: () => [mutation.update] };
});

beforeEach(() => {
  mutation.update.mockReset();
  mutation.update.mockResolvedValue({ data: {} });
});

const renderForm = (route = '/admin/branding/identity') =>
  renderWithProviders(<BrandingForm initial={branding()} />, { route });

const businessName = () => screen.getByRole('textbox', { name: 'Business name' });
const save = () => screen.getByRole('button', { name: 'Save changes' });
const snackbar = () => document.querySelector('.MuiSnackbar-root');

describe('BrandingForm', () => {
  it('previews the name and slogan as they are typed, before anything is saved', async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('No logo')).toBeInTheDocument();

    await user.clear(businessName());
    await user.type(businessName(), 'Globex');
    expect(screen.getByRole('heading', { name: 'Globex' })).toBeInTheDocument();
    expect(mutation.update).not.toHaveBeenCalled();
  });

  it('requires a business name before saving', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(businessName());
    await user.click(save());
    expect(await screen.findByText('Business name is required')).toBeInTheDocument();
    expect(mutation.update).not.toHaveBeenCalled();
  });

  it('saves every field, trimmed, and confirms', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(businessName());
    await user.type(businessName(), '  Globex  ');
    await user.click(save());

    await waitFor(() => expect(snackbar()).toHaveTextContent('Branding updated'));
    expect(mutation.update).toHaveBeenCalledWith({
      variables: { input: { ...toBrandingValues(branding()), businessName: 'Globex' } },
    });
    expect(businessName()).toHaveValue('Globex');
  });

  it('says why a save failed', async () => {
    mutation.update.mockRejectedValue(new Error('Branding is locked'));
    const user = userEvent.setup();
    renderForm();
    await user.click(save());
    await waitFor(() => expect(snackbar()).toHaveTextContent('Branding is locked'));
  });

  it('falls back to a generic message when the failure carries none', async () => {
    mutation.update.mockRejectedValue('offline');
    const user = userEvent.setup();
    renderForm();
    await user.click(save());
    await waitFor(() => expect(snackbar()).toHaveTextContent('Save failed'));
  });

  it('puts the loaded branding back on Cancel', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(businessName());
    await user.type(businessName(), 'Globex');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(businessName()).toHaveValue('Acme');
  });

  it('keeps what was typed on one tab while another tab is open', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(businessName());
    await user.type(businessName(), 'Globex');

    await user.click(screen.getByRole('tab', { name: 'Colors' }));
    expect(screen.queryByRole('textbox', { name: 'Business name' })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Primary' })).toHaveValue('#155dfc');

    await user.click(screen.getByRole('tab', { name: 'Identity' }));
    expect(businessName()).toHaveValue('Globex');
  });
});
