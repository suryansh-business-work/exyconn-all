import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { SendTestEmailForm } from '../../../../../../src/pages/environment-variables/forms/send-test-email';
import { renderWithProviders } from '../../../../test-utils';
import { doneOnce, expectMessages, fill, formCallbacks, press, toast } from '../form.helpers';

const gql = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendTestEmailMutation: () => [gql.send],
}));

const cb = formCallbacks();
const RECIPIENT = 'Recipient email';

const renderForm = (defaultTo?: string) =>
  renderWithProviders(
    <SendTestEmailForm
      configId="mail-1"
      configLabel="Transactional"
      defaultTo={defaultTo}
      onDone={cb.onDone}
      onCancel={cb.onCancel}
    />,
  );

describe('SendTestEmailForm', () => {
  beforeEach(() => {
    gql.send.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('names the SMTP config it sends through and starts with no recipient', () => {
    renderForm();
    expect(
      screen.getByText('Send a verification email using the “Transactional” SMTP configuration.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(RECIPIENT)).toHaveValue('');
  });

  it('asks for a recipient, then for a valid address', async () => {
    renderForm();
    await press('Send test');
    await expectMessages('Recipient email is required');

    fill(RECIPIENT, 'not-an-email');
    await press('Send test');
    await expectMessages('Enter a valid email');
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('sends to the suggested recipient through this config', async () => {
    renderForm('admin@example.test');
    expect(screen.getByLabelText(RECIPIENT)).toHaveValue('admin@example.test');
    await press('Send test');

    await doneOnce(cb.onDone);
    expect(gql.send).toHaveBeenCalledWith({
      variables: { id: 'mail-1', to: 'admin@example.test' },
    });
    expect(await toast()).toHaveTextContent('Test email sent to admin@example.test');
  });

  it('shows why the SMTP server refused, and stays open', async () => {
    gql.send.mockRejectedValue(new Error('535 Authentication failed'));
    renderForm('admin@example.test');
    await press('Send test');
    expect(await toast()).toHaveTextContent('535 Authentication failed');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('says the send failed when the error carries no message', async () => {
    gql.send.mockRejectedValue('timeout');
    renderForm('admin@example.test');
    await press('Send test');
    expect(await toast()).toHaveTextContent('Send failed');
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
