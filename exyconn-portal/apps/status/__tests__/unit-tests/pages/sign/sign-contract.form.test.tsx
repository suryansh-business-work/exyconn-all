import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SignContractForm } from '../../../../src/pages/sign/forms/sign-contract';
import { renderWithProviders } from '../../test-utils';
import { fill, findSnackbar } from '../../form-helpers';
import { DOCUMENT_HASH, TOKEN, contract, signed, signedWithoutData } from './contract.fixtures';

vi.mock('@exyconn/shell/components/signature', async () => ({
  RhfSignaturePad: (await import('../../signature.stub')).RhfSignaturePadStub,
}));

const AGREE = 'I have read this contract and agree to be bound by it';
const NAME = /^Your full name/;

function renderForm(mocks: MockLink.MockedResponse[] = []) {
  const onSigned = vi.fn<(hash: string) => void>();
  const onCancel = vi.fn<() => void>();
  renderWithProviders(
    <SignContractForm
      token={TOKEN}
      contract={contract()}
      onSigned={onSigned}
      onCancel={onCancel}
    />,
    { mocks },
  );
  return { onSigned, onCancel };
}

const sign = () => userEvent.click(screen.getByRole('button', { name: 'Sign' }));
const drawSignature = () =>
  userEvent.click(screen.getByRole('button', { name: 'Draw a signature' }));

describe('SignContractForm', () => {
  it('needs a typed name, a signature and an explicit agreement', async () => {
    const { onSigned } = renderForm();
    expect(screen.getByLabelText(NAME)).toBeRequired();
    expect(screen.getByTestId('signature-pad')).toHaveAttribute('data-required', 'true');
    fill(NAME, ' A ');
    await sign();

    expect(await screen.findByText('Type your full name')).toBeInTheDocument();
    expect(screen.getByText('Draw or type your signature')).toBeInTheDocument();
    expect(screen.getByText('Confirm that you agree to be bound by it')).toBeInTheDocument();
    expect(onSigned).not.toHaveBeenCalled();
  });

  it('refuses a name over 120 characters', async () => {
    const { onSigned } = renderForm();
    fill(NAME, 'a'.repeat(121));
    await drawSignature();
    await userEvent.click(screen.getByLabelText(AGREE));
    await sign();

    expect(await screen.findByText('Keep your name under 120 characters')).toBeInTheDocument();
    expect(onSigned).not.toHaveBeenCalled();
  });

  it('signs under the name as typed, trimmed, with the signature drawn', async () => {
    const { onSigned } = renderForm([signed('Ada K. Lovelace')]);
    fill(NAME, '  Ada K. Lovelace ');
    await drawSignature();
    await userEvent.click(screen.getByLabelText(AGREE));
    await sign();
    await waitFor(() => expect(onSigned).toHaveBeenCalledWith(DOCUMENT_HASH));
  });

  it('says why when the signature cannot be recorded', async () => {
    const { onSigned } = renderForm([signed('Ada Lovelace', new Error('This link was withdrawn'))]);
    await drawSignature();
    await userEvent.click(screen.getByLabelText(AGREE));
    await sign();

    expect(await findSnackbar('This link was withdrawn')).toBeInTheDocument();
    expect(onSigned).not.toHaveBeenCalled();
  });

  it('hands back an empty hash when the server answers without data', async () => {
    const { onSigned } = renderForm([signedWithoutData('Ada Lovelace')]);
    await drawSignature();
    await userEvent.click(screen.getByLabelText(AGREE));
    await sign();
    await waitFor(() => expect(onSigned).toHaveBeenCalledWith(''));
  });

  it('explains what signing records, and cancels on request', async () => {
    const { onCancel } = renderForm();
    expect(
      screen.getByText(
        'Read the document above before signing. Your signature is recorded with the time.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Draw it with a mouse, finger or stylus, or switch to Type to use your name.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Signing records your name, your signature, the moment/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
