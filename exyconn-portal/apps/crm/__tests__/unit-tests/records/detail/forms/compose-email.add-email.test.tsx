import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposeEmailForm } from '../../../../../src/records/detail/forms/compose-email';
import { EMAIL_INTEGRATIONS_PATH } from '../../../../../src/integrations/emailIntegrationsPath';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const gql = vi.hoisted(() => ({
  senders: [] as { id: string; email: string; provider: string }[],
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendCrmEmailMutation: () => [vi.fn()],
  useDraftCrmEmailMutation: () => [vi.fn(), { loading: false }],
  useCrmEmailSendersQuery: () => ({ data: { crmEmailSenders: gql.senders }, loading: false }),
  useCrmEmailSenderQuery: () => ({ data: undefined }),
}));

function Url() {
  return <output aria-label="Current URL">{useCurrentUrl()}</output>;
}

function renderForm() {
  renderWithProviders(
    <>
      <ComposeEmailForm
        context={{ object: 'CONTACT', id: 'c-1', to: ['ada@example.com'] }}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />
      <Url />
    </>,
    { route: '/contacts/c-1' },
  );
}

async function chooseAddEmail() {
  await userEvent.click(screen.getByRole('combobox', { name: /^From/ }));
  await userEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', { name: 'Add email' }),
  );
}

describe('ComposeEmailForm: Add email', () => {
  afterEach(() => {
    gql.senders = [];
  });

  it('goes to CRM > Integrations > Email and keeps the chosen mailbox', async () => {
    gql.senders = [{ id: 'mb-1', email: 'sales@example.com', provider: 'GMAIL' }];
    renderForm();
    const from = screen.getByRole('combobox', { name: /^From/ });
    await waitFor(() => expect(from).toHaveTextContent('sales@example.com'));

    await chooseAddEmail();

    expect(screen.getByLabelText('Current URL')).toHaveTextContent(EMAIL_INTEGRATIONS_PATH);
    expect(from).toHaveTextContent('sales@example.com');
  });

  it('does not pick a value or show the mailbox error when none is connected', async () => {
    renderForm();

    await chooseAddEmail();

    expect(screen.getByLabelText('Current URL')).toHaveTextContent(EMAIL_INTEGRATIONS_PATH);
    expect(document.querySelector('input[name="fromAccountId"]')).toHaveValue('');
    expect(screen.queryByText('Choose the mailbox to send from')).not.toBeInTheDocument();
  });
});
