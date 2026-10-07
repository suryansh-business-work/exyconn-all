import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmailFragmentForm,
  type EmailFragmentRow,
} from '../../../../../../src/pages/email/forms/email-fragment';
import { renderWithProviders } from '../../../../test-utils';
import { notify, resetHarness } from '../../../environment-variables/panel.harness';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateEmailFragmentMutation: () => [gql.create],
  useUpdateEmailFragmentMutation: () => [gql.update],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../../../environment-variables/panel.harness')).notifyModule(importOriginal),
);

const ROW: EmailFragmentRow = {
  id: 'frag-1',
  key: 'footer',
  name: 'Footer',
  description: 'Address and unsubscribe',
  mjml: '<mj-section></mj-section>',
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: EmailFragmentRow | null) =>
  renderWithProviders(<EmailFragmentForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('EmailFragmentForm', () => {
  beforeEach(() => {
    resetHarness();
    gql.create.mockReset();
    gql.update.mockReset();
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('requires a key, a name and a body, and explains how templates include it', async () => {
    renderForm(null);
    expect(
      screen.getByText('Templates include this as {{> key }}. Renaming it breaks those templates.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Key is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('The fragment cannot be empty')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('rejects a key a template could not type', async () => {
    renderForm(null);
    await userEvent.type(screen.getByLabelText('Key'), 'Brand_Footer');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
  });

  it('creates a fragment from trimmed values', async () => {
    gql.create.mockResolvedValue({ data: {} });
    renderForm(null);
    await userEvent.type(screen.getByLabelText('Key'), 'brand-header');
    await userEvent.type(screen.getByLabelText('Name'), 'Header ');
    await userEvent.type(screen.getByLabelText('MJML'), '<mj-section></mj-section>');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          key: 'brand-header',
          name: 'Header',
          description: '',
          mjml: '<mj-section></mj-section>',
        },
      },
    });
    expect(notify).toHaveBeenCalledWith('{entity} created', 'success', { entity: 'Fragment' });
  });

  it('updates the stored fragment by id', async () => {
    gql.update.mockResolvedValue({ data: {} });
    renderForm(ROW);
    expect(screen.getByLabelText('Name')).toHaveValue('Footer');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'frag-1',
        input: {
          key: 'footer',
          name: 'Footer',
          description: 'Address and unsubscribe',
          mjml: ROW.mjml,
        },
      },
    });
    expect(notify).toHaveBeenCalledWith('{entity} updated', 'success', { entity: 'Fragment' });
  });

  it('says why a save failed and keeps the form open', async () => {
    gql.create.mockRejectedValue('network');
    renderForm(null);
    await userEvent.type(screen.getByLabelText('Key'), 'x');
    await userEvent.type(screen.getByLabelText('Name'), 'X');
    await userEvent.type(screen.getByLabelText('MJML'), '<p/>');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Save failed', 'error'));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderForm(ROW);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
