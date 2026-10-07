import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignContractForm } from '../../../../../../src/pages/legal/forms/sign-contract';
import type { ContractRow } from '../../../../../../src/pages/legal/forms/contract';
import { renderWithProviders } from '../../../../test-utils';
import { contractRow } from '../../legal.fixtures';

const gql = vi.hoisted(() => ({ sign: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSignContractMutation: () => [gql.sign, { loading: gql.loading }],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (contract: ContractRow = contractRow()) =>
  renderWithProviders(<SignContractForm contract={contract} onDone={onDone} onCancel={onCancel} />);

const signButton = () => screen.getByRole('button', { name: /^Sign/ });

describe('SignContractForm', () => {
  beforeEach(() => {
    gql.sign.mockReset().mockResolvedValue({ data: {} });
    gql.loading = false;
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for nothing: the signer is the account, not a typed name', () => {
    renderForm();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.getByText('Signing “Master services agreement” with Acme Inc, as yourself.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The document will be read and hashed now, so the signature is of this version.',
      ),
    ).toBeInTheDocument();
    expect(signButton()).toBeEnabled();
  });

  it('will not sign a contract with nothing attached', () => {
    renderForm(contractRow({ documentUrl: '' }));
    expect(
      screen.getByText(
        'Attach the document to this contract first — there is nothing to sign yet.',
      ),
    ).toBeInTheDocument();
    expect(signButton()).toBeDisabled();
  });

  it('signs the contract by id and says so', async () => {
    renderForm();
    await userEvent.click(signButton());

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.sign).toHaveBeenCalledWith({ variables: { id: 'contract-1' } });
    expect(await screen.findByText('“Master services agreement” signed')).toBeInTheDocument();
  });

  it('keeps the dialog open and says why when signing fails', async () => {
    gql.sign.mockRejectedValue(new Error('The document could not be read'));
    renderForm();
    await userEvent.click(signButton());

    expect(await screen.findByText('The document could not be read')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.sign.mockRejectedValue('offline');
    renderForm();
    await userEvent.click(signButton());

    expect(await screen.findByText('Signing failed')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('cannot be pressed twice while the signature is on its way', () => {
    gql.loading = true;
    renderForm();
    expect(signButton()).toBeDisabled();
  });

  it('hands control back on Cancel without signing', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.sign).not.toHaveBeenCalled();
  });
});
