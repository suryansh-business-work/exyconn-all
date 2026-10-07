import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestSignatureForm } from '../../../../../../src/pages/legal/forms/request-signature';
import type { ContractRow } from '../../../../../../src/pages/legal/forms/contract';
import { renderWithProviders } from '../../../../test-utils';
import { fill } from '../../../../form.helpers';
import { contractRow } from '../../legal.fixtures';

const gql = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRequestContractSignatureMutation: () => [gql.request],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (contract: ContractRow = contractRow()) =>
  renderWithProviders(
    <RequestSignatureForm contract={contract} onDone={onDone} onCancel={onCancel} />,
  );

const send = () => userEvent.click(screen.getByRole('button', { name: 'Send for signature' }));

const NOTHING_TO_SIGN =
  'Attach the document to this contract first — there is nothing to sign yet.';

describe('RequestSignatureForm', () => {
  beforeEach(() => {
    gql.request.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('offers the counterparty as the signer and asks where to send the link', () => {
    renderForm();
    expect(
      screen.getByText('Asking for a signature on “Master services agreement”.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Who is signing')).toHaveValue('Acme Inc');
    expect(screen.getByLabelText('Their email')).toHaveValue('');
    expect(screen.getByText('The link is theirs alone and works for 30 days')).toBeInTheDocument();
    expect(screen.queryByText(NOTHING_TO_SIGN)).not.toBeInTheDocument();
  });

  it('warns when the contract has no document for them to read', () => {
    renderForm(contractRow({ documentUrl: '' }));
    expect(screen.getByText(NOTHING_TO_SIGN)).toBeInTheDocument();
  });

  it('validates the signer, the address and the length of the message', async () => {
    renderForm();
    fill('Who is signing', 'A');
    fill('Their email', 'not-an-email');
    fill('Message (optional)', 'x'.repeat(1001));
    await send();

    expect(await screen.findByText('Who are you asking?')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
    expect(screen.getByText('Keep the message under 1000 characters')).toBeInTheDocument();
    expect(gql.request).not.toHaveBeenCalled();
  });

  it('sends the link without a message when none was written', async () => {
    renderForm();
    fill('Their email', ' legal@acme.example ');
    await send();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.request).toHaveBeenCalledWith({
      variables: {
        contractId: 'contract-1',
        signerName: 'Acme Inc',
        signerEmail: 'legal@acme.example',
        message: null,
      },
    });
    expect(await screen.findByText('Signing link sent to legal@acme.example')).toBeInTheDocument();
  });

  it('sends the message and the signer that were typed', async () => {
    renderForm();
    fill('Who is signing', 'Dana Cruz');
    fill('Their email', 'dana@acme.example');
    fill('Message (optional)', 'Please sign by Friday.');
    await send();

    await waitFor(() => expect(gql.request).toHaveBeenCalledTimes(1));
    expect(gql.request.mock.calls[0][0].variables).toMatchObject({
      signerName: 'Dana Cruz',
      message: 'Please sign by Friday.',
    });
  });

  it('keeps the form open and says why when the request fails', async () => {
    gql.request.mockRejectedValue(new Error('This contract has no document'));
    renderForm();
    fill('Their email', 'legal@acme.example');
    await send();

    expect(await screen.findByText('This contract has no document')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.request.mockRejectedValue('offline');
    renderForm();
    fill('Their email', 'legal@acme.example');
    await send();

    expect(await screen.findByText('The request could not be sent')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without sending', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.request).not.toHaveBeenCalled();
  });
});
