import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  EmailTemplateForm,
  type EmailTemplateRow,
} from '../../../../../../src/pages/email/forms/email-template';
import { renderWithProviders } from '../../../../test-utils';
import { notify, resetHarness } from '../../../environment-variables/panel.harness';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateEmailTemplateMutation: () => [gql.create],
  useUpdateEmailTemplateMutation: () => [gql.update],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('../../../environment-variables/panel.harness')).notifyModule(importOriginal),
);

const ROW: EmailTemplateRow = {
  id: 'tpl-1',
  key: 'welcome',
  name: 'Welcome',
  description: 'Sent on sign-up',
  subject: 'Welcome aboard',
  mjml: '<mjml><mj-body></mj-body></mjml>',
  isActive: true,
  updatedBy: 'admin',
  updatedAt: '2026-09-01T00:00:00.000Z',
  variables: ['name'],
  fragments: [],
};

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: EmailTemplateRow | null) =>
  renderWithProviders(<EmailTemplateForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const ACTIVE = 'Active (an inactive template refuses to send)';

describe('EmailTemplateForm', () => {
  beforeEach(() => {
    resetHarness();
    gql.create.mockReset();
    gql.update.mockReset();
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('requires a key, a name, a subject and a body', async () => {
    renderForm(null);
    expect(screen.queryByText(/Renaming the key/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Key is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Subject is required')).toBeInTheDocument();
    expect(screen.getByText('The template cannot be empty')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the key to lower-case letters, numbers and hyphens', async () => {
    renderForm(null);
    await userEvent.type(screen.getByLabelText('Key'), 'Welcome Email');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('Lower-case letters, numbers and hyphens only'),
    ).toBeInTheDocument();
  });

  it('creates a template from trimmed values, active unless switched off', async () => {
    gql.create.mockResolvedValue({ data: {} });
    renderForm(null);
    expect(screen.getByLabelText(ACTIVE)).toBeChecked();
    await userEvent.type(screen.getByLabelText('Key'), 'welcome-email-v2');
    await userEvent.type(screen.getByLabelText('Name'), ' Welcome ');
    await userEvent.type(screen.getByLabelText('Description'), 'Sent on sign-up ');
    await userEvent.type(screen.getByLabelText('Subject'), 'Hello there');
    await userEvent.type(screen.getByLabelText('MJML'), '<mjml></mjml>');
    await userEvent.click(screen.getByLabelText(ACTIVE));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          key: 'welcome-email-v2',
          name: 'Welcome',
          description: 'Sent on sign-up',
          subject: 'Hello there',
          mjml: '<mjml></mjml>',
          isActive: false,
        },
      },
    });
    expect(notify).toHaveBeenCalledWith('{entity} created', 'success', { entity: 'Template' });
  });

  it('edits a stored template, warning that the key is what code sends by', async () => {
    gql.update.mockResolvedValue({ data: {} });
    renderForm(ROW);
    expect(
      screen.getByText(
        'Code sends this template by its key. Renaming the key stops whatever sends it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Key')).toHaveValue('welcome');
    await userEvent.clear(screen.getByLabelText('Subject'));
    await userEvent.type(screen.getByLabelText('Subject'), 'Welcome to Exyconn');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'tpl-1',
        input: {
          key: 'welcome',
          name: 'Welcome',
          description: 'Sent on sign-up',
          subject: 'Welcome to Exyconn',
          mjml: ROW.mjml,
          isActive: true,
        },
      },
    });
    expect(notify).toHaveBeenCalledWith('{entity} updated', 'success', { entity: 'Template' });
  });

  it('says why a save failed and keeps the form open', async () => {
    gql.update.mockRejectedValue(new Error('A template with that key already exists'));
    renderForm(ROW);
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('A template with that key already exists', 'error'),
    );
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cancels without saving', async () => {
    renderForm(null);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
